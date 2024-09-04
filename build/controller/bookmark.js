"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookMarked = exports.isSavedBlog = exports.addBookMark = void 0;
const db_config_1 = __importDefault(require("../config/db.config"));
const addBookMark = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { blogId } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        // Check if already saved
        const isExisting = yield db_config_1.default.query(`
            SELECT * FROM bookmarks
            WHERE blog_id = $1
            AND saved_by = $2;`, [blogId, userId]);
        if (isExisting.rows.length > 0) {
            // Delete bookmark
            yield db_config_1.default.query(`
                DELETE FROM bookmarks
                WHERE blog_id = $1
                AND saved_by = $2;`, [blogId, userId]);
            return res.status(200).json({ message: 'Unsaved' });
        }
        // Save bookmark
        yield db_config_1.default.query(`
            INSERT INTO bookmarks
            (blog_id, saved_by)
            VALUES ($1, $2);`, [blogId, userId]);
        return res.status(200).json({ message: 'Saved' });
    }
    catch (error) {
        console.error('Error adding bookmark:', error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.addBookMark = addBookMark;
const isSavedBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { blogId } = req.query;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const isSaved = yield db_config_1.default.query(`
            SELECT * FROM bookmarks
            WHERE blog_id = $1
            AND saved_by = $2;`, [blogId, userId]);
        return res.status(200).json({
            saved: isSaved.rows.length > 0
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.isSavedBlog = isSavedBlog;
const getBookMarked = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const bookMarked = yield db_config_1.default.query(`
            SELECT b.id, b.title, b.content, b.created_at, b.cover_img
            FROM bookmarks bm
            JOIN blogs b ON bm.blog_id = b.id
            WHERE bm.saved_by = $1
            ORDER BY bm.created_at DESC;`, [userId]);
        return res.status(200).json(bookMarked.rows);
    }
    catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.getBookMarked = getBookMarked;
