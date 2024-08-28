import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express"; // Ensure this import aligns with your extended Request type
import { User } from "../types/blogs";

const createUserFolder = (userID: number) => {
    const userUploadFolder = path.join('./src/uploads', 'user', `user${userID}`);
    
    if (!fs.existsSync(userUploadFolder)) {
        fs.mkdirSync(userUploadFolder, { recursive: true });
    }

    return userUploadFolder;
}

const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
        // Type assertion since req.user is not yet fully typed
        const userID = (req.user as User)?.id;
        const userUploadFolder = createUserFolder(userID);
        cb(null, userUploadFolder);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({ storage });