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
    getCountriesAdmin,
    createCountry,
    updateCountry,
    deleteCountry,
    getStatesAdmin,
    createState,
    updateState,
    deleteState,
    getMunicipalitiesAdmin,
    createMunicipality,
    updateMunicipality,
    deleteMunicipality,
    getParishesAdmin,
    createParish,
    updateParish,
    deleteParish,
    getStatisticsTDAH,
    getInstitutionById,
} from "../controllers/admin.controller.js";

import {
    createSupportMaterial,
    updateSupportMaterial,
    deleteSupportMaterial,
    getAllSupportMaterials,
    createMaterialType,
    getAllMaterialTypes,
    updateMaterialType,
    deleteMaterialType,
    getSupportMaterialById
} from "../controllers/supportMaterials.controller.js";
import upload from '../multer.js';

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
adminRouter.get('/institutions/:id', getInstitutionById);
adminRouter.post('/institutions', createInstitution);
adminRouter.put('/institutions/:id', updateInstitution);
adminRouter.delete('/institutions/:id', deleteInstitution);

// --- Rutas para Gestión de Ubicaciones (Países, Estados, Municipios, Parroquias) ---
adminRouter.get('/countries', getCountriesAdmin);
adminRouter.post('/countries', createCountry);
adminRouter.put('/countries/:id', updateCountry);
adminRouter.delete('/countries/:id', deleteCountry);

adminRouter.get('/states', getStatesAdmin);
adminRouter.post('/states', createState);
adminRouter.put('/states/:id', updateState);
adminRouter.delete('/states/:id', deleteState);

adminRouter.get('/municipalities', getMunicipalitiesAdmin);
adminRouter.post('/municipalities', createMunicipality);
adminRouter.put('/municipalities/:id', updateMunicipality);
adminRouter.delete('/municipalities/:id', deleteMunicipality);

adminRouter.get('/parishes', getParishesAdmin);
adminRouter.post('/parishes', createParish);
adminRouter.put('/parishes/:id', updateParish);
adminRouter.delete('/parishes/:id', deleteParish);

// --- Rutas de Estadísticas ---
adminRouter.get('/statistics/tdah', getStatisticsTDAH);

// --- Rutas para Gestión de Material de Apoyo ---
adminRouter.get('/support-materials', getAllSupportMaterials); // Solo leer
adminRouter.get('/support-materials/:id_material', getSupportMaterialById);
adminRouter.post('/support-materials', upload.single('file'), createSupportMaterial);
adminRouter.put('/support-materials/:id_material', upload.single('file'), updateSupportMaterial);
adminRouter.delete('/support-materials/:id_material', deleteSupportMaterial);

// --- Rutas para Gestión de Tipos de Material ---
adminRouter.get('/material-types', getAllMaterialTypes);
adminRouter.post('/material-types', createMaterialType);
adminRouter.put('/material-types/:id_material_type', updateMaterialType);
adminRouter.delete('/material-types/:id_material_type', deleteMaterialType);

export default adminRouter;