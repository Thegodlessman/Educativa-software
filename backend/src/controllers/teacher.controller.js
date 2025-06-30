import { pool } from "../db.js";

export const updateStudentByTeacher = async (req, res) => {
    const { studentId } = req.params; 
    const { user_name, user_lastname, user_email, user_ced } = req.body;

    const teacherId = req.user.id_user; 

    try {

        const query = `
            UPDATE users 
            SET user_name = $1, user_lastname = $2, user_email = $3, user_ced = $4
            WHERE id_user = $5
            RETURNING id_user, user_name, user_lastname, user_email, user_ced;
        `;
        const { rows } = await pool.query(query, [user_name, user_lastname, user_email, user_ced, studentId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Estudiante no encontrado." });
        }
        res.status(200).json({ message: "Estudiante actualizado con éxito.", student: rows[0] });
    } catch (error) {
        console.error("Error al actualizar estudiante:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

export const removeStudentFromRoom = async (req, res) => {
    const { roomId, studentId } = req.params;
    const teacherId = req.user.id_user;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar que el profesor es el dueño de la clase
        const roomResult = await client.query('SELECT admin_room FROM room WHERE id_room = $1', [roomId]);
        if (roomResult.rows.length === 0 || roomResult.rows[0].admin_room !== teacherId) {
            return res.status(403).json({ message: "No tienes permiso para modificar esta clase." });
        }
        
        // 2. Obtener el id_user_room para eliminar la prueba asociada
        const userRoomResult = await client.query('SELECT id_user_room FROM user_room WHERE id_room = $1 AND id_user = $2', [roomId, studentId]);
        
        if (userRoomResult.rows.length > 0) {
            const { id_user_room } = userRoomResult.rows[0];
            // 3. Eliminar tests asociados (CASCADE se encargará de métricas y respuestas)
            await client.query('DELETE FROM tests WHERE id_user_room = $1', [id_user_room]);
        }
        
        // 4. Eliminar al estudiante de la clase
        const deleteResult = await client.query('DELETE FROM user_room WHERE id_room = $1 AND id_user = $2 RETURNING *', [roomId, studentId]);

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: "El estudiante no se encontró en esta clase." });
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: "Estudiante eliminado de la clase exitosamente." });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al eliminar estudiante de la clase:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    } finally {
        client.release();
    }
};

export const deleteRoomByTeacher = async (req, res) => {
    const { roomId } = req.params;
    const teacherId = req.user.id_user;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Verificar que el profesor es el dueño de la clase
        const roomResult = await client.query('SELECT admin_room FROM room WHERE id_room = $1', [roomId]);
        if (roomResult.rows.length === 0) {
            return res.status(404).json({ message: "Clase no encontrada." });
        }
        if (roomResult.rows[0].admin_room !== teacherId) {
            return res.status(403).json({ message: "No tienes permiso para eliminar esta clase." });
        }

        // 2. Eliminar las pruebas de todos los estudiantes en la clase (CASCADE se encarga del resto)
        await client.query(`
            DELETE FROM tests 
            WHERE id_user_room IN (SELECT id_user_room FROM user_room WHERE id_room = $1)
        `, [roomId]);

        // 3. Eliminar las relaciones de los estudiantes con la clase
        await client.query('DELETE FROM user_room WHERE id_room = $1', [roomId]);
        
        // 4. Finalmente, eliminar la clase
        await client.query('DELETE FROM room WHERE id_room = $1', [roomId]);
        
        await client.query('COMMIT');
        res.status(200).json({ message: "Clase eliminada exitosamente." });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al eliminar la clase:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    } finally {
        client.release();
    }
};