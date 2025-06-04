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
import { pool } from "./db.js";


const app = express()

app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors());

app.use(userRoutes)
app.use(profileRoutes)
app.use(roomRoutes)
app.use(cloudinaryRoutes)
app.use(testRouter)
app.use(supportMaterialsRouter)

app.use(express.static("public"));

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {
    console.log(`¡Usuario conectado a través de WebSocket! ID: ${socket.id}`);

    socket.on('game_test_connected', (data) => {
        console.log(`Backend: Recibido evento 'game_test_connected' de cliente ${socket.id}. Datos:`, data);
    });

    // Evento para recibir métricas de juego 
    socket.on('submitGameTestResults', async (receivedMetrics) => {
        console.log(`Métricas de juego recibidas del cliente ${socket.id}:`);
        // console.log(JSON.stringify(receivedMetrics, null, 2)); 
    
        const {
            id_test_para_actualizar, 
            userId,
            id_room, 
            totalGameDuration, 
            score,
            error_count,
            correct_decisions,
            reactionTimes, 
            missedShots
        } = receivedMetrics;
    
        if (!id_test_para_actualizar) {
            console.error("Error: No se recibió id_test_para_actualizar desde el frontend.");
            socket.emit('gameTestError', { message: "Error: Falta ID de la prueba para guardar resultados." });
            return;
        }
    
        // --- 1. Procesar Tiempos de Reacción ---
        let sumReactionTimeDestroy = 0;
        let countReactionTimeDestroy = 0;
        const validReactionTimesDestroy = [];
        if (reactionTimes && Array.isArray(reactionTimes)) {
            reactionTimes.forEach(rt => {
                if (rt.type === 'destroy' && typeof rt.time === 'number' && rt.time > 0 && rt.time < 10000) {
                    sumReactionTimeDestroy += rt.time;
                    countReactionTimeDestroy++;
                    validReactionTimesDestroy.push(rt.time);
                }
            });
        }
        const averageReactionTimeMs = countReactionTimeDestroy > 0 ? (sumReactionTimeDestroy / countReactionTimeDestroy) : null;
        let variabilityReactionTimeMs = null;
        if (countReactionTimeDestroy > 1) {
            const mean = averageReactionTimeMs;
            const variance = validReactionTimesDestroy.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (countReactionTimeDestroy -1);
            variabilityReactionTimeMs = Math.sqrt(variance);
        }
    
        // --- 2. Calcular otras métricas derivadas ---
        const totalInteractionsWithObstacles = correct_decisions + error_count;
        const accuracyPercentage = totalInteractionsWithObstacles > 0 ? (correct_decisions / totalInteractionsWithObstacles) * 100 : 0;
        const gameDurationSeconds = totalGameDuration > 0 ? (totalGameDuration / 1000) : 0;
        const missedShotsPerMinute = gameDurationSeconds > 0 && missedShots > 0 ? (missedShots / (gameDurationSeconds / 60)) : 0;
        const errorsPerMinute = gameDurationSeconds > 0 && error_count > 0 ? (error_count / (gameDurationSeconds / 60)) : 0;
    
        // --- 3. Lógica de Puntuación de Riesgo ---
        let riskScore = 0;
        const riskFactors = [];
        if (error_count > 5) { riskScore += 2; riskFactors.push("Alto número de errores."); }
        if (averageReactionTimeMs && averageReactionTimeMs > 700) { riskScore += 2; riskFactors.push("Tiempo de reacción promedio elevado."); }
        if (variabilityReactionTimeMs && averageReactionTimeMs && (variabilityReactionTimeMs / averageReactionTimeMs) > 0.6) { riskScore += 3; riskFactors.push("Alta variabilidad en tiempos de reacción."); }
        if (missedShotsPerMinute > 10) { riskScore += 2; riskFactors.push("Alto número de disparos fallidos por minuto.");}
    
        console.log("Factores de Riesgo Calculados:", riskFactors);
    
        // --- 4. Determinar Nivel de Riesgo y Recomendación ---
        let inferredRiskLevelName = "Nada probable"; 
        let recommendationText = "Rendimiento dentro de los parámetros esperados.";
        if (riskScore >= 6) { 
            inferredRiskLevelName = "Muy probable";
            recommendationText = "Se recomienda evaluación profesional detallada.";
        } else if (riskScore >= 3) {
            inferredRiskLevelName = "Poco probable";
            recommendationText = "Se sugiere observación y seguimiento del rendimiento atencional.";
        }
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
    
            // a. Obtener id_risk_level
            const riskLevelQuery = await client.query(
                'SELECT id_risk_level FROM risk_levels WHERE risk_name = $1', 
                [inferredRiskLevelName]
            );
            let id_risk_level;
            if (riskLevelQuery.rows.length > 0) {
                id_risk_level = riskLevelQuery.rows[0].id_risk_level;
            } else {
                console.error(`Nivel de riesgo "${inferredRiskLevelName}" no encontrado en la tabla risk_levels (buscando por risk_name).`);
                await client.query('ROLLBACK');
                socket.emit('gameTestError', { message: "Nivel de riesgo no configurado en el sistema." });
                client.release();
                return;
            }
    
            // b. ACTUALIZAR el registro en la tabla 'tests'
            const testUpdateQuery = `
                UPDATE tests
                SET 
                    id_risk_level = $1,
                    final_score = $2,
                    recommendation = $3,
                    test_date = NOW() 
                WHERE id_test = $4;
            `;
            const testUpdateResult = await client.query(testUpdateQuery, [
                id_risk_level,
                score,
                recommendationText,
                id_test_para_actualizar 
            ]);
    
            if (testUpdateResult.rowCount === 0) {
                console.error(`No se encontró el test con ID: ${id_test_para_actualizar} para actualizar.`);
                await client.query('ROLLBACK');
                socket.emit('gameTestError', { message: "No se pudo encontrar la prueba para guardar resultados." });
                client.release();
                return;
            }
            console.log("Test actualizado con ID:", id_test_para_actualizar);
    
            // c. Insertar en la tabla 'test_metrics'
            const metricsInsertQuery = `
                INSERT INTO test_metrics (
                    id_test, reaction_time_avg, error_count, 
                    correct_decisions, missed_shots_count, 
                    distracted_events, total_time 
                ) VALUES ($1, $2, $3, $4, $5, $6, $7);
            `;
            await client.query(metricsInsertQuery, [
                id_test_para_actualizar,
                averageReactionTimeMs ? parseFloat(averageReactionTimeMs.toFixed(2)) : null,
                error_count,
                correct_decisions, 
                missedShots,     
                0,               
                gameDurationSeconds ? parseFloat(gameDurationSeconds.toFixed(2)) : null 
            ]);
            console.log("Métricas del test guardadas para test ID:", id_test_para_actualizar);
    
            await client.query('COMMIT');
    
            socket.emit('gameTestAnalysisResult', { 
                userId, 
                id_room, 
                id_test: id_test_para_actualizar,
                inferredRiskLevel: inferredRiskLevelName,
                recommendation: recommendationText
            });
    
        } catch (error) {
            if (client) {
                try { await client.query('ROLLBACK'); } catch (rbError) { console.error("Error durante el ROLLBACK:", rbError); }
            }
            console.error("Error al actualizar/guardar datos del juego en la base de datos:", error);
            socket.emit('gameTestError', { message: "Error interno al procesar los resultados del juego." });
        } finally {
            if (client) {
                client.release(); 
            }
        }
    });

    // Manejar la desconexión del cliente
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado de WebSocket. ID: ${socket.id}`);
        // TODO: Lógica si un usuario se desconecta inesperadamente
    });

})

server.listen(PORT, () => {
    console.log('Server HTTP and WebSocket listening on port: ', PORT);
});