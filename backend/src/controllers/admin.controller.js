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
            SELECT 
                i.id_insti,
                i.insti_name,
                i.insti_descrip,
                i.id_location AS id_parish,
                p.parish_name,
                m.id_municipality,
                m.municipality_name,
                s.id_state,
                s.state_name,
                s.id_country
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

export const getInstitutionById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                i.id_insti,
                i.insti_name,
                i.insti_descrip,
                i.id_location AS id_parish,
                p.parish_name,
                m.id_municipality,
                m.municipality_name,
                s.id_state,
                s.state_name,
                s.id_country
            FROM institutions i
            JOIN parishes p ON i.id_location = p.id_parish
            JOIN municipalities m ON p.id_municipality = m.id_municipality
            JOIN states s ON m.id_state = s.id_state
            WHERE i.id_insti = $1
            LIMIT 1;
        `;
        const rows = await executeQuery(query, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Institución no encontrada' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener institución' });
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

// --- Gestión de Ubicaciones (Países / Estados / Municipalidades / Parroquias) ---
export const getCountriesAdmin = async (req, res) => {
    try {
        const rows = await executeQuery('SELECT * FROM countries ORDER BY country_name');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener países' });
    }
};

export const createCountry = async (req, res) => {
    const { country_name } = req.body;
    try {
        const rows = await executeQuery('INSERT INTO countries (country_name) VALUES ($1) RETURNING *', [country_name]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear país' });
    }
};

export const updateCountry = async (req, res) => {
    const { id } = req.params;
    const { country_name } = req.body;
    try {
        const rows = await executeQuery('UPDATE countries SET country_name = $1 WHERE id_country = $2 RETURNING *', [country_name, id]);
        if (rows.length === 0) return res.status(404).json({ message: 'País no encontrado' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar país' });
    }
};

export const deleteCountry = async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await executeQuery('DELETE FROM countries WHERE id_country = $1 RETURNING *', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'País no encontrado' });
        res.status(200).json({ message: 'País eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar país' });
    }
};

export const getStatesAdmin = async (req, res) => {
    try {
        const rows = await executeQuery('SELECT * FROM states ORDER BY state_name');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estados' });
    }
};

export const createState = async (req, res) => {
    const { state_name, id_country } = req.body;
    try {
        const rows = await executeQuery('INSERT INTO states (state_name, id_country) VALUES ($1, $2) RETURNING *', [state_name, id_country]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear estado' });
    }
};

export const updateState = async (req, res) => {
    const { id } = req.params;
    const { state_name, id_country } = req.body;
    try {
        const rows = await executeQuery('UPDATE states SET state_name = $1, id_country = $2 WHERE id_state = $3 RETURNING *', [state_name, id_country, id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Estado no encontrado' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar estado' });
    }
};

export const deleteState = async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await executeQuery('DELETE FROM states WHERE id_state = $1 RETURNING *', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Estado no encontrado' });
        res.status(200).json({ message: 'Estado eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar estado' });
    }
};

export const getMunicipalitiesAdmin = async (req, res) => {
    try {
        const rows = await executeQuery('SELECT * FROM municipalities ORDER BY municipality_name');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener municipios' });
    }
};

export const createMunicipality = async (req, res) => {
    const { municipality_name, id_state } = req.body;
    try {
        const rows = await executeQuery('INSERT INTO municipalities (municipality_name, id_state) VALUES ($1, $2) RETURNING *', [municipality_name, id_state]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear municipio' });
    }
};

export const updateMunicipality = async (req, res) => {
    const { id } = req.params;
    const { municipality_name, id_state } = req.body;
    try {
        const rows = await executeQuery('UPDATE municipalities SET municipality_name = $1, id_state = $2 WHERE id_municipality = $3 RETURNING *', [municipality_name, id_state, id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Municipio no encontrado' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar municipio' });
    }
};

export const deleteMunicipality = async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await executeQuery('DELETE FROM municipalities WHERE id_municipality = $1 RETURNING *', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Municipio no encontrado' });
        res.status(200).json({ message: 'Municipio eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar municipio' });
    }
};

export const getParishesAdmin = async (req, res) => {
    try {
        const rows = await executeQuery('SELECT * FROM parishes ORDER BY parish_name');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener parroquias' });
    }
};

export const createParish = async (req, res) => {
    const { parish_name, id_municipality } = req.body;
    try {
        const rows = await executeQuery('INSERT INTO parishes (parish_name, id_municipality) VALUES ($1, $2) RETURNING *', [parish_name, id_municipality]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear parroquia' });
    }
};

export const updateParish = async (req, res) => {
    const { id } = req.params;
    const { parish_name, id_municipality } = req.body;
    try {
        const rows = await executeQuery('UPDATE parishes SET parish_name = $1, id_municipality = $2 WHERE id_parish = $3 RETURNING *', [parish_name, id_municipality, id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Parroquia no encontrada' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar parroquia' });
    }
};

export const deleteParish = async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await executeQuery('DELETE FROM parishes WHERE id_parish = $1 RETURNING *', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Parroquia no encontrada' });
        res.status(200).json({ message: 'Parroquia eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar parroquia' });
    }
};

// --- Estadísticas TDAH ---
export const getStatisticsTDAH = async (req, res) => {
    try {
        // Por país: porcentaje de tests con riesgo (ej. id_risk_level >= 2) respecto al total de tests con score
        const countryQuery = `
            SELECT c.id_country, c.country_name,
                COUNT(t.id_test) FILTER (WHERE t.final_score IS NOT NULL) AS total_tests,
                COUNT(t.id_test) FILTER (WHERE t.final_score IS NOT NULL AND t.id_risk_level >= 2) AS tdah_tests
            FROM countries c
            LEFT JOIN states s ON s.id_country = c.id_country
            LEFT JOIN municipalities mu ON mu.id_state = s.id_state
            LEFT JOIN parishes p ON p.id_municipality = mu.id_municipality
            LEFT JOIN institutions i ON i.id_location = p.id_parish
            LEFT JOIN users_institutions ui ON ui.id_institution = i.id_insti
            LEFT JOIN users u ON u.id_user = ui.id_user
            LEFT JOIN user_room ur ON ur.id_user = u.id_user
            LEFT JOIN tests t ON t.id_user_room = ur.id_user_room
            GROUP BY c.id_country, c.country_name
            ORDER BY c.country_name;
        `;

        const countries = await executeQuery(countryQuery);
        const countriesFormatted = countries.map(row => ({
            id_country: row.id_country,
            country_name: row.country_name,
            total_tests: parseInt(row.total_tests || 0, 10),
            tdah_tests: parseInt(row.tdah_tests || 0, 10),
            tdah_percentage: row.total_tests > 0 ? Math.round((row.tdah_tests / row.total_tests) * 10000) / 100 : 0
        }));

        return res.status(200).json({ countries: countriesFormatted });
    } catch (error) {
        console.error('Error calculando estadísticas:', error);
        res.status(500).json({ message: 'Error al calcular estadísticas' });
    }
};