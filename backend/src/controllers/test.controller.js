import { pool } from "../db.js";

export const createTest = async (req, res) => {
    try {
        const {
            id_user_room, 
            reaction_time_avg,
            error_count,
            correct_decisions,
            distracted_events,
            total_time,
            final_score,
            test_version,
        } = req.body;

        let id_risk_level = req.body.id_risk_level; 

        const testInsertResult = await pool.query(
            `INSERT INTO tests (id_user_room, id_risk_level, final_score, test_version, test_date)
            VALUES ($1, $2, $3, $4, NOW()) RETURNING id_test`,
            [id_user_room, id_risk_level, final_score, test_version]
        );
        const id_test = testInsertResult.rows[0].id_test;

        // La BD genera id_test_metrics
        await pool.query(
            `INSERT INTO test_metrics (id_test, average_reaction_time, error_count, correct_decisions_count, distraction_events_count, total_time_numeric)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                id_test,
                reaction_time_avg,
                error_count,
                correct_decisions,
                distracted_events, 
                total_time 
            ]
        );

        res.status(201).json({ message: 'Test creado exitosamente', id_test });
    } catch (error) {
        console.error('Error creando el test (ruta HTTP):', error);
        res.status(500).json({ error: 'Error al crear el test' });
    }
};

export const getTestsByRoom = async (req, res) => {
    try {
        const { id_room } = req.params;

        const query = `
        SELECT 
            u.id_user,
            CONCAT(u.user_name,' ',u.user_lastname) AS student_name,
            t.id_test,
            t.id_risk_level,
            rl.risk_name,
            t.final_score,
            t.test_date,
            t.recommendation
        FROM user_room ur
        INNER JOIN users u ON ur.id_user = u.id_user
        LEFT JOIN tests t ON t.id_user_room = ur.id_user_room AND ur.id_room = $1 -- Asegurar que el test pertenezca a ESTA sala
        LEFT JOIN risk_levels rl ON t.id_risk_level = rl.id_risk_level
        WHERE ur.id_room = $1
        ORDER BY u.user_lastname ASC, u.user_name ASC;`; 

        const { rows } = await pool.query(query, [id_room]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener los tests de la sala:', error);
        res.status(500).json({ error: 'Error al obtener los tests' });
    }
};

export const setStartTest = async (req, res) => {
    const { id_user, id_room } = req.body;
    const testVersion = 'v1.0'; 

    if (!id_user || !id_room) { 
        return res.status(400).json({ message: 'Faltan id_user o id_room.' });
    }

    try {
        // 1. Validar usuario y su pertenencia a la sala para obtener id_user_room
        const userRoomQuery = await pool.query(
            `SELECT ur.id_user_room, r.rol_name 
             FROM user_room ur
             JOIN users u ON ur.id_user = u.id_user
             JOIN roles r ON u.active_role = r.id_rol
             WHERE ur.id_user = $1 AND ur.id_room = $2`,
            [id_user, id_room]
        );

        if (userRoomQuery.rows.length === 0) {
            return res.status(403).json({ message: 'El estudiante no pertenece a esta sala o no es un usuario válido.' });
        }
        if (userRoomQuery.rows[0].rol_name !== 'Estudiante') {
            return res.status(403).json({ message: 'Acción permitida solo para estudiantes.' });
        }
        const id_user_room = userRoomQuery.rows[0].id_user_room;

        // 2. Validar que NO existe ya una prueba para este id_user_room y test_version
        const existingTestCheck = await pool.query(
            `SELECT id_test FROM tests WHERE id_user_room = $1 AND test_version = $2`,
            [id_user_room, testVersion] 
        );

        if (existingTestCheck.rows.length > 0) {
            return res.status(409).json({ message: `Ya has iniciado o completado la prueba versión ${testVersion} para esta sala.` });
        }

        const insertQuery = `
            INSERT INTO tests (id_user_room, test_date, test_version) 
            VALUES ($1, NOW(), $2)
            RETURNING id_test; 
        `;
        const result = await pool.query(insertQuery, [id_user_room, testVersion]);
        const newTestId = result.rows[0].id_test;

        res.status(201).json({ message: 'Prueba iniciada con éxito.', id_test: newTestId });

    } catch (error) {
        console.error(`Error al iniciar prueba para user ${id_user}, room ${id_room}:`, error);
        res.status(500).json({ message: 'Error interno del servidor al iniciar la prueba.', error: error.message });
    }
};

export const getStudentTestStatus = async (req, res) => {
    const { id_room, id_user } = req.params;

    try {
        // 1. Obtener id_user_room
        const userRoomQuery = await pool.query(
            `SELECT ur.id_user_room, r.rol_name
             FROM user_room ur
             JOIN users u ON ur.id_user = u.id_user
             JOIN roles r ON u.active_role = r.id_rol
             WHERE ur.id_user = $1 AND ur.id_room = $2`,
            [id_user, id_room]
        );

        if (userRoomQuery.rows.length === 0) {
            return res.status(404).json({ message: 'El usuario no está asignado a esta sala o no existe.' });
        }
        if (userRoomQuery.rows[0].rol_name !== 'Estudiante') {
            return res.status(403).json({ message: `Acción permitida solo para estudiantes.` });
        }
        const id_user_room = userRoomQuery.rows[0].id_user_room;

        // 2. Consultar el test más reciente para ese id_user_room
        const query = `
            SELECT
                t.id_test,
                t.final_score,
                rl.risk_name 
            FROM tests t
            LEFT JOIN risk_levels rl ON t.id_risk_level = rl.id_risk_level
            WHERE t.id_user_room = $1 
            ORDER BY t.test_date DESC 
            LIMIT 1;
        `;
        const { rows } = await pool.query(query, [id_user_room]);

        if (rows.length === 0) {

            return res.status(200).json({
                isAssigned: true,
                isCompleted: false,
                testId: null
            });
        }

        const testRecord = rows[0];
        const isCompleted = testRecord.final_score !== null; // Un test se considera completo si tiene final_score

        res.status(200).json({
            isAssigned: true,
            isCompleted: isCompleted,
            testId: testRecord.id_test, // Devolver el id_test para posible reanudación o referencia
            finalScore: isCompleted ? testRecord.final_score : null,
            riskName: isCompleted ? testRecord.risk_name : null
        });

    } catch (error) {
        console.error(`Error al obtener estado de prueba (user ${id_user}, room ${id_room}):`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const getTestMetricsByTestId = async (req, res) => {
    const { id_test } = req.params;
    try {
        const result = await pool.query(
            "SELECT * FROM test_metrics WHERE id_test = $1",
            [id_test]
        );
        if (result.rows.length === 0) {
            return res.status(200).json([]); 
        }
        res.status(200).json(result.rows[0]); 
    } catch (error) {
        console.error("Error obteniendo métricas del test:", error);
        res.status(500).json({ message: "Error interno al obtener las métricas del test." });
    }
}