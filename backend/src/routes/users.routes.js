import { Router } from "express";
import {
    createUser,
    deleteUser,
    getUsers,
    getUsersById,
    loginUser,
    updatePassword,
    updateUser,
    updateActiveRole,
    getRoles,
    forgotPassword,
    resetPassword,
    createStudent,
    fastLogin,
} from '../controllers/user.controller.js'

import { 
    validateCreateUser, 
    validateLogin, 
    validateUpdatePassword, 
    validateUpdateUser,
    validateForgotPassword,
    validateResetPassword,
    validateCreateStudent
} from "../middleware/validator.js";

import capitalizeNames from "../middleware/format.js";

import upload from '../multer.js'

const router = Router();

//*Traer a todos los usuarios
router.get('/users', getUsers)

//*Traer al usuario dependiendo del ID
router.get('/users/:id', getUsersById)

//*Iniciar Sesión
router.post('/login', validateLogin, loginUser)

//*Actualizar contraseña
router.patch('/users/password/:id', validateUpdatePassword,updatePassword)

//*Crear un usuario
router.post('/users', capitalizeNames, validateCreateUser, createUser)

//*Borrar un usuario
router.delete('/users/:id', deleteUser)

//*Actualizar un usuario
router.put('/users/:id', validateUpdateUser, updateUser);

router.patch('/users/update/role/:id', updateActiveRole)

router.get('/profile/roles', getRoles)

router.post('/forgot-password', validateForgotPassword, forgotPassword);

router.post('/reset-password/:token', validateResetPassword, resetPassword)

router.post('/users/:id_room/register-student', upload.single('photo'), capitalizeNames, validateCreateStudent, createStudent)

router.post('/fast-login', fastLogin);

export default router; 