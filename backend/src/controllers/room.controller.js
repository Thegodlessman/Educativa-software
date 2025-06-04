import { response } from "express";
import { pool } from "../db.js";
import { generateRoomCode } from "../helpers/generateCode.js";

export const createRoom = async (req, res) => {
  try {
    const { secc_room, max_room, id_institution, admin_room, room_grate } =
      req.body;
    const code_room = await generateRoomCode();

    const classroomImages = [
      `${process.env.CLOUDNARY_URL_IMG}educativa/Classroom1`,
      `${process.env.CLOUDNARY_URL_IMG}educativa/Classroom2`,
      `${process.env.CLOUDNARY_URL_IMG}educativa/Classroom3`,
      `${process.env.CLOUDNARY_URL_IMG}educativa/Classroom4`,
    ];

    const room_url =
      classroomImages[Math.floor(Math.random() * classroomImages.length)];
    const createDate = new Date().toISOString().split("T")[0];

    // 1. Insertamos la clase
    const insertQuery = `
      INSERT INTO room (code_room, secc_room, max_room, id_institution, admin_room, create_date, room_url, room_grate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_room;
    `;
    const values = [
      code_room,
      secc_room,
      max_room,
      id_institution,
      admin_room,
      createDate,
      room_url,
      room_grate,
    ];
    const insertResult = await pool.query(insertQuery, values);
    const newRoomId = insertResult.rows[0].id_room;

    // 2. Buscamos esa clase con JOIN a institutions para traer insti_name
    const selectQuery = `
      SELECT room.id_room, room.room_url, room.room_grate, room.code_room, room.secc_room,room.max_room, room.create_date, insti.insti_name
      FROM room
      INNER JOIN institutions AS insti ON room.id_institution = insti.id_insti
      WHERE room.id_room = $1
    `;
    const selectResult = await pool.query(selectQuery, [newRoomId]);

    // 3. Respondemos con todos los datos completos
    res.status(201).json({ success: true, room: selectResult.rows[0] });
  } catch (error) {
    console.error("Error creando aula:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

export const getInsti = async (req, res) => {
  try {
    const { id_user } = req.body;

    if (!id_user) {
      return res
        .status(400)
        .json({ success: false, message: "ID de usuario requerido" });
    }

    const { rows } = await pool.query(
      `SELECT insti.Id_insti, insti.insti_name 
        FROM "institutions" AS insti 
        INNER JOIN "users_institutions" AS ui ON insti.Id_insti = ui.Id_institution 
        INNER JOIN "users" AS usuario ON ui.id_user = usuario.id_user 
        WHERE usuario.id_user = $1`,
      [id_user]
    );

    return res.status(200).json({ success: true, insti: rows });
  } catch (error) {
    console.error("Error en getInsti:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error en el servidor" });
  }
};

export const getCreatedClass = async (req, res) => {
  try {
    const { id_user } = req.body;

    const { rows } = await pool.query(
      `SELECT room.id_room, room.room_url, room.room_grate, room.code_room, room.secc_room, room.max_room, room.create_date, insti.insti_name 
      FROM "room" AS room 
      INNER JOIN "institutions" AS insti ON room.id_institution = insti.id_insti 
      WHERE admin_room = $1`,
      [id_user]
    );

    return res.status(200).json({ success: true, classes: rows });
  } catch (error) {
    console.error("Error fetching classes", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
};

export const joinRoom = async (req, res) => {
  const { code_room, id_user } = req.body;

  try {
    // Buscar la sala por código
    const { rowCount, rows } = await pool.query(`SELECT * FROM room WHERE code_room = $1`, [code_room]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "Clase no encontrada, verifique el codigo" });
    }

    const id_room = rows[0].id_room;

    // Verificar si el usuario ya está en la sala
    const checkUser = await pool.query(
      'SELECT * FROM user_room WHERE id_user = $1 AND id_room = $2',
      [id_user, id_room]
    );

    if (checkUser.rowCount > 0) {
      return res.status(400).json({ message: "Ya estás unido a esta clase" });
    }

    // Insertar si no está unido aún
    await pool.query(
      'INSERT INTO user_room (id_user, id_room) VALUES ($1, $2)',
      [id_user, id_room]
    );

    res.status(200).json({ message: "Unido a la sala exitosamente", id_room });

  } catch (error) {
    console.error('Error al unirse a la clase:', error);
    res.status(500).json({ error: 'Error al unirse' });
  }
};

export const getJoinedClass = async (req, res) => {
  const { id_user } = req.body

  try {
    const { rows } = await pool.query(`
      SELECT r.*, i.insti_name FROM "room" AS r 
      INNER JOIN user_room AS ur ON ur.id_room = r.id_room 
      INNER JOIN institutions AS i ON i.id_insti = r.id_institution 
      WHERE ur.id_user = $1`, 
      [id_user]
    );

    return res.status(200).json({ classes: rows })
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener las clases' })
  }
}