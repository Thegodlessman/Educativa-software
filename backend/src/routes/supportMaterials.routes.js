import { Router } from "express";
import {
    createMaterialType,
    getAllMaterialTypes,
    updateMaterialType,
    deleteMaterialType,
    createSupportMaterial,
    getAllSupportMaterials,
    getSupportMaterialById,
    updateSupportMaterial,
    deleteSupportMaterial,
    associateMaterialToRiskLevel,
    getMaterialsForRiskLevel,
    removeMaterialFromRiskLevel
} from "../controllers/supportMaterials.controller.js"; 

const supportMaterialsRouter = Router();

// Rutas para Tipos de Material
supportMaterialsRouter.post('/material-types', createMaterialType);
supportMaterialsRouter.get('/material-types', getAllMaterialTypes);
supportMaterialsRouter.put('/material-types/:id_material_type', updateMaterialType);
supportMaterialsRouter.delete('/material-types/:id_material_type', deleteMaterialType);

// Rutas para Materiales de Apoyo
supportMaterialsRouter.post('/support-materials', createSupportMaterial);
supportMaterialsRouter.get('/support-materials', getAllSupportMaterials);
supportMaterialsRouter.get('/support-materials/:id_material', getSupportMaterialById);
supportMaterialsRouter.put('/support-materials/:id_material', updateSupportMaterial);
supportMaterialsRouter.delete('/support-materials/:id_material', deleteSupportMaterial);

// Rutas para Asociaciones entre Niveles de Riesgo y Materiales de Apoyo
supportMaterialsRouter.post('/risk-level-materials', associateMaterialToRiskLevel);
supportMaterialsRouter.get('/risk-levels/:id_risk_level/materials', getMaterialsForRiskLevel);
supportMaterialsRouter.delete('/risk-levels/:id_risk_level/materials/:id_material', removeMaterialFromRiskLevel);

export default supportMaterialsRouter;