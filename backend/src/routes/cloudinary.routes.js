import express from "express";
import upload from "../multer.js";
import { uploadProfilePicture} from "../controllers/cloudinary.controller.js";

const router = express.Router();

router.post("/uploadProfile", upload.single("photo"), uploadProfilePicture);

export default router;