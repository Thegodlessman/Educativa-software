import cloudinary from "../cloudinary.js";
import streamifier from "streamifier"

export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se envió ninguna imagen" });
        }

        const result = await cloudinary.uploader.upload_stream(
            {
                folder: "educativa/profiles",
            },
            (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ message: "Error al subir imagen a Cloudinary" });
                }

                res.status(200).json({ imageUrl: result.secure_url });
            }
        );
        streamifier.createReadStream(req.file.buffer).pipe(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};