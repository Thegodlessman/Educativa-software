import { Router } from "express";
import { createRoom, getCreatedClass, getInsti, getJoinedClass, joinRoom, getStudentsByClassCode} from "../controllers/room.controller.js";

const router = Router();

router.post("/room/create", createRoom)
router.post("/room/insti", getInsti)
router.post("/room/classes/created", getCreatedClass)
router.post("/room/join", joinRoom)
router.post("/room/classes/joined", getJoinedClass)
router.get('/room/:roomCode/students', getStudentsByClassCode);

export default router