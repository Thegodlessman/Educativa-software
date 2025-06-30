import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js"; 

import { 
    updateStudentByTeacher,
    removeStudentFromRoom,
    deleteRoomByTeacher
} from "../controllers/teacher.controller.js";

const teacherRouter = Router();

teacherRouter.use(authMiddleware, checkRole(['Profesor']));

// Ruta para editar la info de un estudiante
teacherRouter.put('/students/:studentId', updateStudentByTeacher);

// Ruta para remover a un estudiante de una clase
teacherRouter.delete('/rooms/:roomId/students/:studentId', removeStudentFromRoom);

// Ruta para eliminar una clase completa
teacherRouter.delete('/rooms/:roomId', deleteRoomByTeacher);

export default teacherRouter;