import { pool } from "../db.js";

export const generateRoomCode = async () =>{
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";

    let code;
    let isUnique = false;

    while (!isUnique) {
        // Generar código: 3 letras + 3 números
        const randomLetters = Array.from({ length: 3 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
        const randomNumbers = Array.from({ length: 3 }, () => numbers.charAt(Math.floor(Math.random() * numbers.length))).join('');
        code = `${randomLetters}${randomNumbers}`;

        // Verificar si el código ya existe
        const result = await pool.query("SELECT COUNT(*) FROM room WHERE code_room = $1", [code]);
        if (parseInt(result.rows[0].count) === 0) {
        isUnique = true;
        }
    }

    return code;
} 