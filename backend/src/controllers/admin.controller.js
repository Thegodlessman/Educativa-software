import { pool } from "../db.js";
import { encrypt } from "../helpers/handleBcrypt.js";

// --- Funciones de Ayuda ---
const executeQuery = async (query, params = []) => {
    try {
        const { rows } = await pool.query(query, params);
        return rows;
    } catch (error) {
        console.error(`Error en la consulta: ${query}`, error);
        throw new Error("Error en la base de datos");
    }
};

// --- Gestión de Usuarios ---

export const getAllUsersWithRoles = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id_user, u.user_name, u.user_lastname, u.user_email, u.user_ced,
                r.rol_name, r.id_rol
            FROM users u
            LEFT JOIN roles r ON u.active_role = r.id_rol
            ORDER BY u.user_lastname, u.user_name;
        `;
        const users = await executeQuery(query);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserAsAdmin = async (req, res) => {
    const { id } = req.params;
    const { user_name, user_lastname, user_email, user_ced, active_role } = req.body;

    try {
        const query = `
            UPDATE users 
            SET user_name = $1, user_lastname = $2, user_email = $3, user_ced = $4, active_role = $5
            WHERE id_user = $6
            RETURNING id_user, user_name, user_lastname, user_email, user_ced, active_role;
        `;
        const updatedUser = await executeQuery(query, [user_name, user_lastname, user_email, user_ced, active_role, id]);

        if (updatedUser.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        res.status(200).json(updatedUser[0]);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el usuario." });
    }
};

export const deleteUserAsAdmin = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM roles_users WHERE id_user = $1', [id]);
        await client.query('DELETE FROM users_institutions WHERE id_user = $1', [id]);
        // Considerar eliminar datos de user_room, tests, etc., o configurar ON DELETE CASCADE
        const result = await client.query('DELETE FROM users WHERE id_user = $1 RETURNING *', [id]);
        await client.query('COMMIT');

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json({ message: "Usuario eliminado exitosamente" });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Error al eliminar el usuario." });
    } finally {
        client.release();
    }
};

export const getAllInstitutions = async (req, res) => {
    try {
        const query = `
            SELECT i.id_insti, i.insti_name, i.insti_descrip, p.parish_name, m.municipality_name, s.state_name
            FROM institutions i
            JOIN parishes p ON i.id_location = p.id_parish
            JOIN municipalities m ON p.id_municipality = m.id_municipality
            JOIN states s ON m.id_state = s.id_state
            ORDER BY i.insti_name;
        `;
        const institutions = await executeQuery(query);
        res.status(200).json(institutions);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener instituciones." });
    }
};

export const createInstitution = async (req, res) => {
    const { insti_name, insti_descrip, id_location } = req.body;
    const insti_url = `${process.env.CLOUDNARY_URL_IMG}educativa/ClassroomDefault`; // URL por defecto

    try {
        const query = `
            INSERT INTO institutions (insti_name, insti_descrip, id_location, insti_url)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const newInstitution = await executeQuery(query, [insti_name, insti_descrip, id_location, insti_url]);
        res.status(201).json(newInstitution[0]);
    } catch (error) {
        res.status(500).json({ message: "Error al crear la institución." });
    }
};

export const updateInstitution = async (req, res) => {
    const { id } = req.params;
    const { insti_name, insti_descrip, id_location } = req.body;
    try {
        const query = `
            UPDATE institutions 
            SET insti_name = $1, insti_descrip = $2, id_location = $3
            WHERE id_insti = $4
            RETURNING *;
        `;
        const updatedInstitution = await executeQuery(query, [insti_name, insti_descrip, id_location, id]);
        if (updatedInstitution.length === 0) {
            return res.status(404).json({ message: "Institución no encontrada." });
        }
        res.status(200).json(updatedInstitution[0]);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la institución." });
    }
};

export const deleteInstitution = async (req, res) => {
    const { id } = req.params;
    try {
        // Opcional: Verificar si la institución está en uso antes de borrar
        const result = await executeQuery('DELETE FROM institutions WHERE id_insti = $1 RETURNING *', [id]);
        if (result.length === 0) {
            return res.status(404).json({ message: "Institución no encontrada." });
        }
        res.status(200).json({ message: "Institución eliminada." });
    } catch (error) {
        // Si hay una restricción de clave foránea, el error será capturado aquí
        res.status(409).json({ message: "No se puede eliminar la institución porque está siendo utilizada por clases existentes." });
    }
};

// --- Gestión de Roles ---

export const getAllRoles = async (req, res) => {
    try {
        const roles = await executeQuery('SELECT * FROM roles');
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener roles." });
    }
};