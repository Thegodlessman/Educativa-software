import { pool } from "../db.js";
import { sendPasswordResetEmail } from '../utils/mailer.js';
import { check, validationResult } from "express-validator";
import { encrypt, compare } from "../helpers/handleBcrypt.js";
import { tokenSign } from "../helpers/generateToken.js";
import { randomBytes, createHash } from 'crypto';
import cloudinary from '../cloudinary.js'; 
import streamifier from 'streamifier'; 

export const getUsers = async (req, res) => { //* Obtener todos los usuarios
    const { rows } = await pool.query('SELECT * FROM "users"');
    console.log(rows);
    res.json(rows);
};

export const getUsersById = async (req, res) => { //* Obtener usuario por ID
    const { id } = req.params;
    const { rows } = await pool.query(
        `SELECT 
            usuario.id_user, 
            CONCAT(usuario.user_name,' ', usuario.user_lastname) AS full_name, 
            usuario.user_ced, 
            usuario.user_email, 
            rol.id_rol,
            rol.rol_name
        FROM "users" AS usuario 
        INNER JOIN "roles_users" AS ru 
        ON usuario.id_user = ru.id_user 
        INNER JOIN "roles" AS rol 
        ON ru.id_rol = rol.id_rol
        WHERE usuario.id_user = $1`, [id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json(rows);
};

export const loginUser = async (req, res) => { //* Iniciar Sesión
    const { user_email, user_password } = req.body;

    try {
        // Buscar al usuario por email
        const { rows } = await pool.query(
            `SELECT 
                u.id_user,
                CONCAT(u.user_name,' ',u.user_lastname) AS full_name,
                u.user_url,
                u.user_ced,
                u.user_email,
                u.user_password,
                u.active_role,
                r.rol_name
            FROM "users" u
            LEFT JOIN "roles" r ON u.active_role = r.id_rol
            WHERE u.user_email = $1`,
            [user_email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const user = rows[0];

        //* Comparar la contraseña (contraseña plana, contraseña almacenada en DB)
        const checkPassword = await compare(user_password, user.user_password);

        if (!checkPassword) {
            return res.status(401).json({ message: "Correo Electronico o contraseña incorrectos" });
        }

        const tokenSession = await tokenSign(user);

        //* Autenticación exitosa
        return res.status(200).json({
            message: "Inicio de sesión exitoso",
            user: {
                id_user: user.id_user,
                ced_user: user.user_ced,
                name: user.full_name,
                email: user.user_email,
                active_role: user.active_role,
                role_name: user.rol_name
            },
            tokenSession
        });
    } catch (error) {
        console.error("Error durante el inicio de sesión:", error);
        return res.status(500).json({ message: "Error del servidor" });
    }
};

export const createUser = async (req, res) => { //* Crear Usuario
    try {
        const { user_ced, user_name, user_lastname, user_email, user_password } = req.body;

        const defaultURL = `${process.env.CLOUDNARY_URL_IMG}educativa/Educativa-Profile`;
        const passwordHash = await encrypt(user_password);

        const queryRole = `SELECT id_rol FROM "roles" WHERE rol_name = 'usuario'`;
        const { rows: roleRows } = await pool.query(queryRole);
        const id_rol = roleRows[0].id_rol;

        const query2 = 'SELECT * FROM "users" WHERE user_email = $1 ';
        const { rowCount: emailCount } = await pool.query(query2, [user_email]);
        if (emailCount > 0) {
            return res.status(400).json({ message: "El email ya ha sido registrado" });
        }

        const query3 = 'SELECT * FROM "users" WHERE user_ced = $1';
        const { rowCount: userCount } = await pool.query(query3, [user_ced]);
        if (userCount > 0) {
            return res.status(400).json({ message: "La cédula ya ha sido registrada" });
        }

        const { rows, rowCount } = await pool.query(
            `INSERT INTO "users" (id_user, user_url, user_ced, user_name, user_lastname, user_email, user_password, active_role)
            VALUES (default, $1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [defaultURL, user_ced, user_name, user_lastname, user_email, passwordHash, id_rol]
        );

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Hubo un error al crear el usuario' });
        }

        const newUser = rows[0];

        await pool.query(
            'INSERT INTO "roles_users" (id_user, id_rol) VALUES ($1, $2)',
            [newUser.id_user, id_rol]
        );

        return res.status(200).json({ message: 'Usuario creado exitosamente', user: newUser });

    } catch (error) {
        console.error("Error creando usuario:", error);
        return res.status(500).json({ message: "Error del servidor" });
    }
};

export const createStudent = async (req, res) => {
    try {
        const { user_ced, user_name, user_lastname, user_email } = req.body;
        const { id_room } = req.params;

        let user_url = `${process.env.CLOUDNARY_URL_IMG}educativa/Educativa-Profile`; 

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "educativa/profiles" },
                    (error, result) => {
                        if (error) reject(error);
                        resolve(result);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
            user_url = result.secure_url;
        }

        const queryRole = `SELECT id_rol FROM "roles" WHERE rol_name = 'Estudiante'`;
        const { rows: roleRows } = await pool.query(queryRole);
        const id_rol = roleRows[0].id_rol;

        const query1 = 'SELECT * FROM "users" WHERE user_email = $1';
        const { rowCount: emailCount } = await pool.query(query1, [user_email]);
        if (emailCount > 0) {
            return res.status(400).json({ message: "El email ya ha sido registrado" });
        }

        const query2 = 'SELECT * FROM "users" WHERE user_ced = $1';
        const { rowCount: userCount } = await pool.query(query2, [user_ced]);
        if (userCount > 0) {
            return res.status(400).json({ message: "La cédula ya ha sido registrada" });
        }
        
        const temporalPassword = randomBytes(16).toString('hex');

        const { rows, rowCount } = await pool.query(
            `INSERT INTO "users" (user_url, user_ced, user_name, user_lastname, user_email, user_password, active_role)
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [user_url, user_ced, user_name, user_lastname, user_email, temporalPassword, id_rol]
        );

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Hubo un error al crear el usuario' });
        }

        const newUser = rows[0];

        await pool.query(
            'INSERT INTO "roles_users" (id_user, id_rol) VALUES ($1, $2)',
            [newUser.id_user, id_rol]
        );

        await pool.query(
            'INSERT INTO user_room (id_user, id_room) VALUES ($1, $2)',
            [newUser.id_user, id_room]
        );

        return res.status(200).json({ message: 'Usuario creado y unido exitosamente', user: newUser });

    } catch (error) {
        console.error("Error registrando el usuario:", error);
        return res.status(500).json({ message: "Error del servidor" });
    }
};

export const deleteUser = async (req, res) => { //* Borrar usuario
    const { id } = req.params;

    try {
        const { rowCount } = await pool.query('DELETE FROM "users" WHERE id_user = $1 RETURNING *', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Eliminar el rol del usuario de la tabla "roles_users"
        await pool.query('DELETE FROM "roles_users" WHERE id_user = $1', [id]);

        return res.json({ message: "Usuario eliminado" });
    } catch (error) {
        console.error("Error eliminando usuario:", error);
        return res.status(500).json({ message: "Error al eliminar el usuario", error: error.message });
    }
};

export const updateUser = async (req, res) => { //* Actualizar Usuario
    const { id } = req.params;
    const { ced_user, name, lastname, email } = req.body;

    await check('ced_user').notEmpty().withMessage('La cédula es obligatoria').isNumeric().withMessage("La cédula debe ser numérica").run(req);
    await check('name').notEmpty().withMessage('El nombre es obligatorio').run(req);
    await check('lastname').notEmpty().withMessage('El apellido es obligatorio').run(req);
    await check('email').notEmpty().withMessage('El correo es obligatorio').isEmail().withMessage("El correo no es válido").run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Errores de validación",
            errors: errors.array(),
        });
    }

    try {
        //* Verificar si el email ya está en uso por otro usuario
        const query2 = 'SELECT * FROM "users" WHERE user_email = $1 AND id_user != $2';
        const { rowCount: emailCount } = await pool.query(query2, [email, id]);

        if (emailCount > 0) {
            return res.status(400).json({ message: "El email ya está en uso por otro usuario" });
        }

        //* Verificar si dos personas tienen la misma cédula
        const query3 = 'SELECT * FROM "users" WHERE user_ced = $1 AND id_user != $2';
        const { rowCount: userCount } = await pool.query(query3, [ced_user, id]);
        if (userCount > 0) {
            return res.status(400).json({ message: "La cédula ya está en uso por otro usuario" });
        }

        const query = 'UPDATE "users" SET user_ced = $1, user_name = $2, user_lastname = $3, user_email = $4 WHERE id_user = $5 RETURNING *';
        const values = [ced_user, name, lastname, email, id];
        const { rows, rowCount } = await pool.query(query, values);

        if (rowCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        return res.json({ message: "Usuario actualizado", user: rows[0] });
    } catch (error) {
        console.error("Error durante la actualización:", error);
        return res.status(500).json({ message: "Error al actualizar el usuario", error });
    }
};

export const updatePassword = async (req, res) => { //* Actualizar contraseña
    const { id } = req.params;
    const { password } = req.body;

    await check('password').notEmpty().withMessage('La contraseña es obligatoria').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Errores de validación",
            errors: errors.array(),
        });
    }

    try {
        const passwordHash = await encrypt(password);

        const query = 'UPDATE "users" SET user_password = $1 WHERE id_user = $2 RETURNING *';
        const values = [passwordHash, id];
        const { rows, rowCount } = await pool.query(query, values);

        if (rowCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        return res.json({ message: "Contraseña actualizada", user: rows[0] });
    } catch (error) {
        console.error("Error durante la actualización de contraseña:", error);
        return res.status(500).json({ message: "Error al actualizar la contraseña", error });
    }
};

export const updateActiveRole = async (req, res) => {
    const { id } = req.params; // ID del usuario
    const { id_rol } = req.body; // Nuevo rol que se desea activar
    try {
        const { rows: existingRoles } = await pool.query(
            'SELECT * FROM "roles_users" WHERE id_user = $1 AND id_rol = $2',
            [id, id_rol]
        );

        if (existingRoles.length === 0) {
            await pool.query(`INSERT INTO "roles_users" ("id_user", "id_rol") VALUES ($1, $2) `,
            [id, id_rol]);
        }
        // Actualizar el rol activo en la tabla "users"
        const { rowCount } = await pool.query(
            'UPDATE "users" SET active_role = $1 WHERE id_user = $2',
            [id_rol, id]
        );
        
        if (rowCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Obtener el nombre del nuevo rol
        const { rows: roleDetails } = await pool.query(
            'SELECT rol_name FROM "roles" WHERE id_rol = $1',
            [id_rol]
        );
        const role_name = roleDetails[0].rol_name;
        // Obtener los datos actualizados del usuario
        const { rows: updatedUser } = await pool.query(
            'SELECT id_user, user_url, user_name, user_lastname, active_role FROM "users" WHERE id_user = $1',
            [id]
        );
        // Asignamos el nombre del rol al usuario actualizado
        updatedUser[0].rol_name = role_name;

        // Generar nuevo token con el rol actualizado
        const tokenSession = await tokenSign(updatedUser[0]);

        return res.status(200).json({
            message: "Rol activo actualizado",
            user: updatedUser[0],
            tokenSession
        });
    } catch (error) {
        console.error("Error actualizando el rol activo:", error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

// Endpoint que devuelve todos los roles
export const getRoles = async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM "roles"');
    res.json({ roles: rows });
};

export const forgotPassword = async (req, res) => {
    try {
        const { user_email } = req.body;
        const userResult = await pool.query('SELECT * FROM users WHERE user_email = $1', [user_email]);

        if (userResult.rowCount === 0) {
            return res.status(200).json({ message: "Si existe una cuenta asociada a este correo, se ha enviado un enlace de restablecimiento." });
        }
        
        const user = userResult.rows[0];

        const resetToken = randomBytes(32).toString('hex');
        
        const hashedToken = createHash('sha256').update(resetToken).digest('hex');
            
        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id_user = $3',
            [hashedToken, tokenExpires, user.id_user]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.user_email, resetUrl);
        
        res.json({ message: "Si existe una cuenta asociada a este correo, se ha enviado un enlace de restablecimiento." });

    } catch (error) {
        console.error("Error en la función forgotPassword:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = createHash('sha256').update(token).digest('hex');

        const userResult = await pool.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [hashedToken]
        );

        if (userResult.rowCount === 0) {
            return res.status(400).json({ message: "El token para restablecer la contraseña es inválido o ha expirado." });
        }

        const user = userResult.rows[0];
        const newPasswordHash = await encrypt(password);

        await pool.query(
            'UPDATE users SET user_password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id_user = $2',
            [newPasswordHash, user.id_user]
        );

        res.json({ message: "Tu contraseña ha sido actualizada exitosamente." });

    } catch (error) {
        console.error("Error en la función resetPassword:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

export const fastLogin = async (req, res) => {
    const { id_user } = req.body;

    if (!id_user) {
        return res.status(400).json({ message: 'Se requiere el ID del usuario.' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                u.id_user,
                CONCAT(u.user_name,' ',u.user_lastname) AS full_name,
                u.user_url,
                u.user_ced,
                u.user_email,
                u.user_password,
                u.active_role, 
                r.rol_name 
            FROM users u
            JOIN roles r ON u.active_role = r.id_rol
            WHERE u.id_user = $1;
        `, [id_user]);

        const userRows = result.rows; 

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const user = userRows[0];
        
        const tokenSession = await tokenSign(user);

        res.status(200).json({ tokenSession });

    } catch (error) {
        console.error("Error en fastLogin:", error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};