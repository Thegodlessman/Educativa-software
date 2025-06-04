import { verifyToken } from "../helpers/generateToken";

const authMiddleware = async (req, res, next) => {
    try{
        const token = req.headers['authorization']?.split(' ')[1]
        if(!token){
            return res.status(401).json({message: "No se ha proporcionado un token"});
        }

        const decoded = await verifyToken(token)

        if(!decoded){
            return res.status(401).json({message: "Token sin autorización"})
        }

        req.user = decoded; 
        next();
    }catch(error){
        return res.status(500).json({ message: "Failed to authenticate token" });
    }
}

export default authMiddleware;