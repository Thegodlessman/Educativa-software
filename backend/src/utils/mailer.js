import nodemailer from 'nodemailer';

const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Faltan credenciales de correo en el archivo .env. El envío de correos está deshabilitado.");
        return null; 
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_SECURE === 'true', 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS, 
        },
    });

    return transporter;
};

export const sendPasswordResetEmail = async (userEmail, resetUrl) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.error("Intento de envío de correo fallido: el transportador no está configurado.");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Educativa Software" <${process.env.EMAIL_USER}>`, 
            to: userEmail,
            subject: "Restablecimiento de Contraseña - Educativa",
            html: `
                <h1>Solicitud de Restablecimiento de Contraseña</h1>
                <p>Has solicitado restablecer tu contraseña para tu cuenta en Educativa.</p>
                <p>Por favor, haz clic en el siguiente enlace para establecer una nueva contraseña. Este enlace es válido por 15 minutos:</p>
                <a href="${resetUrl}" style="background-color: #8552aa; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer mi Contraseña</a>
                <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                <br>
                <p>Atentamente,</p>
                <p>El equipo de Educativa</p>
            `
        });
        console.log("Correo de restablecimiento enviado exitosamente a:", userEmail, "ID del mensaje:", info.messageId);
    } catch (error) {
        console.error("Error al enviar el correo de restablecimiento:", error);
    }
};