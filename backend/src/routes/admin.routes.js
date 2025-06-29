import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";

import {
    getAllUsersWithRoles,
    updateUserAsAdmin,
    deleteUserAsAdmin,
    getAllInstitutions,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    getAllRoles
} from "../controllers/admin.controller.js";

import { 
    createSupportMaterial,
    updateSupportMaterial,
    deleteSupportMaterial,
    getAllSupportMaterials,
    createMaterialType,
    getAllMaterialTypes,
    updateMaterialType,
    deleteMaterialType
} from "../controllers/supportMaterials.controller.js";

const adminRouter = Router();

// Middleware de protección para todas las rutas de administrador
adminRouter.use(authMiddleware, checkRole(['Administrador']));

// --- Rutas para Gestión de Usuarios ---
adminRouter.get('/users', getAllUsersWithRoles);
adminRouter.put('/users/:id', updateUserAsAdmin);
adminRouter.delete('/users/:id', deleteUserAsAdmin);

// --- Rutas para Gestión de Roles ---
adminRouter.get('/roles', getAllRoles);

// --- Rutas para Gestión de Instituciones ---
adminRouter.get('/institutions', getAllInstitutions);
adminRouter.post('/institutions', createInstitution);
adminRouter.put('/institutions/:id', updateInstitution);
adminRouter.delete('/institutions/:id', deleteInstitution);

// --- Rutas para Gestión de Material de Apoyo ---
adminRouter.get('/support-materials', getAllSupportMaterials); // Solo leer
adminRouter.post('/support-materials', createSupportMaterial);
adminRouter.put('/support-materials/:id_material', updateSupportMaterial);
adminRouter.delete('/support-materials/:id_material', deleteSupportMaterial);

// --- Rutas para Gestión de Tipos de Material ---
adminRouter.get('/material-types', getAllMaterialTypes);
adminRouter.post('/material-types', createMaterialType);
adminRouter.put('/material-types/:id_material_type', updateMaterialType);
adminRouter.delete('/material-types/:id_material_type', deleteMaterialType);

export default adminRouter;