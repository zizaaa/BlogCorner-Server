"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const createUserFolder = (userID) => {
    const userUploadFolder = path_1.default.join('./src/uploads', 'user', `user${userID}`);
    if (!fs_1.default.existsSync(userUploadFolder)) {
        fs_1.default.mkdirSync(userUploadFolder, { recursive: true });
    }
    return userUploadFolder;
};
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        var _a;
        // Type assertion since req.user is not yet fully typed
        const userID = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userUploadFolder = createUserFolder(userID);
        cb(null, userUploadFolder);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path_1.default.extname(file.originalname)}`);
    }
});
exports.upload = (0, multer_1.default)({ storage });
