import jwt from 'jsonwebtoken';

export const tokenSign = async (user) => {
    console.log("Recibido en tokenSign:", user);

    const payload = {
        id_user: user.id_user,
        active_role: user.active_role,
        rol_name: user.rol_name,
        full_name: user.full_name, // Usar la propiedad existente
        user_url: user.user_url
    };

    console.log("Payload para JWT:", payload);

    if (!payload.id_user || !payload.active_role || !payload.rol_name || !payload.full_name) {
        console.error("Error: Datos incompletos para generar el token", payload);
        throw new Error("Datos incompletos para generar el token.");
    }

    try {
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });
        return token;
    } catch (error) {
        console.error("Error al firmar el token JWT:", error);
        throw error;
    }
};

export const verifyToken = async (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return null;
    }
};