import { pool } from "../db.js"; 

// --- Controladores para Material Types ---

export const createMaterialType = async (req, res) => {
    const { type_name, type_description, icon_identifier } = req.body;
    if (!type_name) {
        return res.status(400).json({ message: "El nombre del tipo de material (type_name) es requerido." });
    }
    try {
        const result = await pool.query(
            "INSERT INTO material_types (type_name, type_description, icon_identifier) VALUES ($1, $2, $3) RETURNING *",
            [type_name, type_description, icon_identifier]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creando tipo de material:", error);
        if (error.code === '23505') { // Error de violación de restricción unique (ej. type_name duplicado)
            return res.status(409).json({ message: "Ya existe un tipo de material con ese nombre." });
        }
        res.status(500).json({ message: "Error interno al crear el tipo de material." });
    }
};

export const getAllMaterialTypes = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM material_types ORDER BY type_name ASC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error obteniendo tipos de material:", error);
        res.status(500).json({ message: "Error interno al obtener los tipos de material." });
    }
};

export const updateMaterialType = async (req, res) => {
    const { id_material_type } = req.params;
    const { type_name, type_description, icon_identifier } = req.body;
    try {
        const result = await pool.query(
            "UPDATE material_types SET type_name = $1, type_description = $2, icon_identifier = $3, updated_at = NOW() WHERE id_material_type = $4 RETURNING *",
            [type_name, type_description, icon_identifier, id_material_type]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Tipo de material no encontrado." });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error actualizando tipo de material:", error);
        if (error.code === '23505') {
            return res.status(409).json({ message: "Ya existe otro tipo de material con ese nombre." });
        }
        res.status(500).json({ message: "Error interno al actualizar el tipo de material." });
    }
};

export const deleteMaterialType = async (req, res) => {
    const { id_material_type } = req.params;
    try {
        const usageCheck = await pool.query("SELECT 1 FROM support_materials WHERE id_material_type = $1 LIMIT 1", [id_material_type]);
        if (usageCheck.rowCount > 0) {
            return res.status(409).json({ message: "No se puede eliminar el tipo de material porque está siendo utilizado por materiales de apoyo existentes." });
        }

        const result = await pool.query("DELETE FROM material_types WHERE id_material_type = $1 RETURNING *", [id_material_type]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Tipo de material no encontrado." });
        }
        res.status(200).json({ message: "Tipo de material eliminado exitosamente." });
    } catch (error) {
        console.error("Error eliminando tipo de material:", error);
        res.status(500).json({ message: "Error interno al eliminar el tipo de material." });
    }
};


// --- Controladores para Support Materials ---
export const createSupportMaterial = async (req, res) => {
    const { id_material_type, material_title, material_description, material_url, target_audience, source_organization, keywords } = req.body;
    if (!id_material_type || !material_title || !material_url) {
        return res.status(400).json({ message: "id_material_type, material_title, y material_url son requeridos." });
    }
    try {
        const result = await pool.query(
            "INSERT INTO support_materials (id_material_type, material_title, material_description, material_url, target_audience, source_organization, keywords) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [id_material_type, material_title, material_description, material_url, target_audience, source_organization, keywords]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creando material de apoyo:", error);
        if (error.code === '23503') {
            return res.status(400).json({ message: "El tipo de material especificado (id_material_type) no existe." });
        }
        res.status(500).json({ message: "Error interno al crear el material de apoyo." });
    }
};

export const getAllSupportMaterials = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sm.*, mt.type_name 
            FROM support_materials sm
            JOIN material_types mt ON sm.id_material_type = mt.id_material_type
            ORDER BY sm.material_title ASC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error obteniendo materiales de apoyo:", error);
        res.status(500).json({ message: "Error interno al obtener los materiales de apoyo." });
    }
};

export const getSupportMaterialById = async (req, res) => {
    const { id_material } = req.params;
    try {
        const result = await pool.query(`
            SELECT sm.*, mt.type_name 
            FROM support_materials sm
            JOIN material_types mt ON sm.id_material_type = mt.id_material_type
            WHERE sm.id_material = $1
        `, [id_material]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Material de apoyo no encontrado." });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error obteniendo material de apoyo:", error);
        res.status(500).json({ message: "Error interno al obtener el material de apoyo." });
    }
};

export const updateSupportMaterial = async (req, res) => {
    const { id_material } = req.params;
    const { id_material_type, material_title, material_description, material_url, target_audience, source_organization, keywords } = req.body;
    try {
        const result = await pool.query(
            "UPDATE support_materials SET id_material_type = $1, material_title = $2, material_description = $3, material_url = $4, target_audience = $5, source_organization = $6, keywords = $7, updated_at = NOW() WHERE id_material = $8 RETURNING *",
            [id_material_type, material_title, material_description, material_url, target_audience, source_organization, keywords, id_material]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Material de apoyo no encontrado." });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error actualizando material de apoyo:", error);
        if (error.code === '23503') {
            return res.status(400).json({ message: "El tipo de material especificado (id_material_type) no existe." });
        }
        res.status(500).json({ message: "Error interno al actualizar el material de apoyo." });
    }
};

export const deleteSupportMaterial = async (req, res) => {
    const { id_material } = req.params;
    try {
        const result = await pool.query("DELETE FROM support_materials WHERE id_material = $1 RETURNING *", [id_material]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Material de apoyo no encontrado." });
        }
        res.status(200).json({ message: "Material de apoyo eliminado exitosamente." });
    } catch (error) {
        console.error("Error eliminando material de apoyo:", error);
        res.status(500).json({ message: "Error interno al eliminar el material de apoyo." });
    }
};

// --- Controladores para Asociaciones Risk Level <-> Support Material ---
export const associateMaterialToRiskLevel = async (req, res) => {
    const { id_risk_level, id_material, relevance_order } = req.body;
    if (!id_risk_level || !id_material) {
        return res.status(400).json({ message: "id_risk_level y id_material son requeridos." });
    }
    try {
        const result = await pool.query(
            "INSERT INTO risk_level_support_materials (id_risk_level, id_material, relevance_order) VALUES ($1, $2, $3) RETURNING *",
            [id_risk_level, id_material, relevance_order || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error asociando material a nivel de riesgo:", error);
        if (error.code === '23505') {
            return res.status(409).json({ message: "Este material ya está asociado a este nivel de riesgo." });
        }
        if (error.code === '23503') {
            return res.status(404).json({ message: "El nivel de riesgo o el material especificado no existen." });
        }
        res.status(500).json({ message: "Error interno al asociar material." });
    }
};

export const getMaterialsForRiskLevel = async (req, res) => {
    const { id_risk_level } = req.params;
    try {
        const result = await pool.query(
            `SELECT sm.id_material, sm.material_title, sm.material_description, sm.material_url, 
                    mt.type_name, mt.icon_identifier, rlsm.relevance_order
             FROM support_materials sm
             JOIN material_types mt ON sm.id_material_type = mt.id_material_type
             JOIN risk_level_support_materials rlsm ON sm.id_material = rlsm.id_material
             WHERE rlsm.id_risk_level = $1
             ORDER BY rlsm.relevance_order ASC, sm.material_title ASC`,
            [id_risk_level]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error obteniendo materiales para nivel de riesgo:", error);
        res.status(500).json({ message: "Error interno al obtener materiales." });
    }
};

export const removeMaterialFromRiskLevel = async (req, res) => {
    const { id_risk_level, id_material } = req.params;
    try {
        const result = await pool.query(
            "DELETE FROM risk_level_support_materials WHERE id_risk_level = $1 AND id_material = $2 RETURNING *",
            [id_risk_level, id_material]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Asociación no encontrada." });
        }
        res.status(200).json({ message: "Asociación de material eliminada exitosamente." });
    } catch (error) {
        console.error("Error eliminando asociación de material:", error);
        res.status(500).json({ message: "Error interno al eliminar asociación." });
    }
};