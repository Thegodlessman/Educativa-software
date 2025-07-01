import express, { urlencoded } from 'express'
import cors from "cors";
import http from 'http'
import { Server } from 'socket.io';
import { PORT } from './config.js'

import userRoutes from './routes/users.routes.js'
import profileRoutes from './routes/profile.routes.js'
import roomRoutes from './routes/room.routes.js'
import cloudinaryRoutes from './routes/cloudinary.routes.js'
import testRouter from './routes/test.routes.js'
import supportMaterialsRouter from './routes/supportMaterials.routes.js';
import adminRouter from './routes/admin.routes.js'
import reportRouter from './routes/reporter.routes.js';
import teacherRouter from './routes/teacher.routes.js';

import { calculateRiskProfile } from './helpers/riskCalculator.js';
import { pool } from "./db.js";
import { resolveMx } from 'dns';

const app = express()

app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));

app.use('/api/teacher', teacherRouter); 
app.use(userRoutes)
app.use(profileRoutes)
app.use(roomRoutes)
app.use(cloudinaryRoutes)
app.use(testRouter)
app.use(supportMaterialsRouter)
app.use(reportRouter)
app.use('/api/admin', adminRouter);

app.use(express.static("public"));

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        exposedHeaders: ['Content-Disposition'],
        credentials: true,
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {
    console.log(`¡Usuario conectado a través de WebSocket! ID: ${socket.id}`);

    socket.on('gameTestReady', async ({ userId, id_room }) => {
        console.log(`Backend: Recibido 'gameTestReady' del usuario: ${userId} para la sala: ${id_room}`);
        const testVersion = 'v1.0'; // Definimos la versión de la prueba

        if (!userId || !id_room) {
            return socket.emit('gameTestError', { message: 'Datos incompletos (userId o id_room).' });
        }

        try {
            // 1. Validar usuario y obtener id_user_room (lógica de tu controlador)
            const userRoomQuery = await pool.query(
                `SELECT ur.id_user_room FROM user_room ur JOIN users u ON ur.id_user = u.id_user JOIN roles r ON u.active_role = r.id_rol WHERE ur.id_user = $1 AND ur.id_room = $2 AND r.rol_name = 'Estudiante'`,
                [userId, id_room]
            );

            if (userRoomQuery.rows.length === 0) {
                return socket.emit('gameTestError', { message: 'El usuario no es un estudiante válido en esta sala.' });
            }
            const id_user_room = userRoomQuery.rows[0].id_user_room;

            // 2. Validar que no exista una prueba previa para esta versión
            const existingTestCheck = await pool.query(
                `SELECT id_test FROM tests WHERE id_user_room = $1 AND test_version = $2`,
                [id_user_room, testVersion]
            );

            if (existingTestCheck.rows.length > 0) {
                // Si la prueba ya existe, la reutilizamos para el juego.
                const id_test = existingTestCheck.rows[0].id_test;
                console.log(`Backend: El estudiante ya había iniciado la prueba. Reutilizando ID de prueba: ${id_test}.`);
                return socket.emit('testStart', { id_test });
            }
            
            // 3. Si no existe, creamos la nueva prueba
            const insertQuery = `
                INSERT INTO tests (id_user_room, test_date, test_version) 
                VALUES ($1, NOW(), $2)
                RETURNING id_test; 
            `;
            const result = await pool.query(insertQuery, [id_user_room, testVersion]);
            const newTestId = result.rows[0].id_test;

            console.log(`Backend: Nueva prueba creada con ID: ${newTestId}. Enviando 'testStart' al cliente.`);
            socket.emit('testStart', { id_test: newTestId });

        } catch (error) {
            console.error(`Error al procesar 'gameTestReady' para user ${userId}:`, error);
            socket.emit('gameTestError', { message: 'Error del servidor al iniciar la prueba.' });
        }
    });

    socket.on('submitGameTestResults', async (receivedMetrics) => {
        console.log(`Métricas recibidas del cliente ${socket.id}:`);

        const { id_test_para_actualizar, userId, id_room } = receivedMetrics;

        if (!id_test_para_actualizar) {
            console.error("Error: Falta ID de prueba.");
            socket.emit('gameTestError', { message: "Error crítico: Falta ID de la prueba." });
            return;
        }

        const riskProfile = calculateRiskProfile(receivedMetrics);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const riskLevelQuery = await client.query('SELECT id_risk_level FROM risk_levels WHERE risk_name = $1', [riskProfile.riskLevelName]);
            if (riskLevelQuery.rows.length === 0) {
                throw new Error(`Nivel de riesgo "${riskProfile.riskLevelName}" no encontrado.`);
            }
            const id_risk_level = riskLevelQuery.rows[0].id_risk_level;

            const testUpdateQuery = `
                UPDATE tests SET id_risk_level = $1, final_score = $2, recommendation = $3, test_date = NOW() WHERE id_test = $4;
            `;
            await client.query(testUpdateQuery, [id_risk_level, receivedMetrics.score, riskProfile.recommendation, id_test_para_actualizar]);

            const metricsInsertQuery = `
                INSERT INTO test_metrics (
                    id_test, reaction_time_avg, correct_hits, 
                    collision_errors, omission_errors, commission_errors, 
                    missed_shots, total_time, reaction_time_variability
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `;
            
            const gameDurationSeconds = (receivedMetrics.totalGameDuration || 0) > 0 ? (receivedMetrics.totalGameDuration / 1000) : 0;

            await client.query(metricsInsertQuery, [
                id_test_para_actualizar,
                parseFloat(riskProfile.analytics.avgReactionTime) || null,
                receivedMetrics.correct_hits || 0,
                receivedMetrics.collision_errors || 0,
                receivedMetrics.omission_errors || 0,
                receivedMetrics.commission_errors || 0,
                receivedMetrics.missed_shots ,
                gameDurationSeconds ? parseFloat(gameDurationSeconds.toFixed(2)) : null,
                parseFloat(riskProfile.analytics.reactionTimeVariability) || null
            ]);

            const { questionsAnswered } = receivedMetrics;
            if (questionsAnswered && Array.isArray(questionsAnswered) && questionsAnswered.length > 0) {
                const answerInsertQuery = `INSERT INTO test_Youtubes (id_test, question_text, user_answer, answer_timestamp) VALUES ($1, $2, $3, TO_TIMESTAMP($4 / 1000.0));`;
                for (const ans of questionsAnswered) {
                    await client.query(answerInsertQuery, [id_test_para_actualizar, ans.questionText, ans.answer, ans.timestamp]);
                }
            }

            await client.query('COMMIT');

            socket.emit('gameTestAnalysisResult', {
                userId, id_room, id_test: id_test_para_actualizar,
                inferredRiskLevel: riskProfile.riskLevelName,
                recommendation: riskProfile.recommendation
            });

        } catch (error) {
            if (client) await client.query('ROLLBACK');
            console.error("Error procesando resultados del juego:", error);
            socket.emit('gameTestError', { message: "Error interno al procesar los resultados." });
        } finally {
            if (client) client.release();
        }
    });

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado de WebSocket. ID: ${socket.id}`);
    });
})

server.listen(PORT, () => {
    console.log('Server HTTP and WebSocket listening on port: ', PORT);
});