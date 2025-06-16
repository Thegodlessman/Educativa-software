import { check, validationResult } from 'express-validator';

// Función helper para manejar el resultado de la validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    //console.log(errors)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Errores de validación",
            errors: errors.array()
        });
    }
    next();
};

// Validador para el inicio de sesión (Login)
export const validateLogin = [
    check('user_email', 'Debe proveer un correo electrónico válido.')
        .trim()
        .isEmail(),
    check('user_password', 'La contraseña es obligatoria.')
        .notEmpty(),
    handleValidationErrors
];

// Validador para la creación de un nuevo usuario (CON CONTRASEÑA ROBUSTA)
export const validateCreateUser = [
    check('user_ced', 'La cédula es obligatoria y debe ser numérica.')
        .notEmpty()
        .isNumeric(),
    check('user_name', 'El nombre es obligatorio.')
        .notEmpty(),
    check('user_lastname', 'El apellido es obligatorio.')
        .notEmpty(),
    check('user_email', 'Debe proveer un correo electrónico válido.')
        .isEmail(),
    check('user_password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
        .withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).'),
    handleValidationErrors
];

// Validador para la actualización de datos de un usuario
export const validateUpdateUser = [
    check('ced_user', 'La cédula es obligatoria y debe ser numérica.')
        .notEmpty()
        .isNumeric(),
    check('name', 'El nombre es obligatorio.')
        .notEmpty(),
    check('lastname', 'El apellido es obligatorio.')
        .notEmpty(),
    check('email', 'Debe proveer un correo electrónico válido.')
        .isEmail(),
    handleValidationErrors
];

// Validador para la actualización de la contraseña (CON CONTRASEÑA ROBUSTA)
export const validateUpdatePassword = [
    check('password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
        .withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).'),
    handleValidationErrors
];