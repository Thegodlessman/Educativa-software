// Middleware para capitalizar nombre y apellido
const capitalizeNames = (req, res, next) => {

    if (req.body.user_name) {
        req.body.user_name = capitalizeFirstLetter(req.body.user_name);
    }
    if (req.body.user_lastname) {
        req.body.user_lastname = capitalizeFirstLetter(req.body.user_lastname);
    }
    next();

};

// Función para capitalizar el primer carácter de una cadena
const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default capitalizeNames;