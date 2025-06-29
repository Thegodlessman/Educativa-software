export const checkRole = (allowedRoles) => (req, res, next) => {
    try {
        const { user } = req; 

        if (!user || !user.rol_name) {
            return res.status(403).json({ message: "Error de autenticación, no se encontró el rol del usuario." });
        }

        const hasAccess = allowedRoles.includes(user.rol_name);

        if (!hasAccess) {
            return res.status(403).json({ message: "Acceso denegado. No tienes los permisos necesarios." });
        }

        next();

    } catch (error) {
        console.error("Error en el middleware checkRole:", error);
        return res.status(500).json({ message: "Error interno del servidor al verificar permisos." });
    }
};