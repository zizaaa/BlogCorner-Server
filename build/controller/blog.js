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
exports.getPostedBlogs = exports.getTopBlogs = exports.checkIsVoted = exports.handleGetVotes = exports.handleDownvote = exports.handleUpvote = exports.getSingleBlog = exports.getBlogs = exports.postBlog = void 0;
const db_config_1 = __importDefault(require("../config/db.config"));
const formatCount_1 = require("../utility/formatCount");
const postBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }
        const result = yield db_config_1.default.query(`
            INSERT INTO blogs
            (title, content, cover_img, owner)
            VALUES ($1, $2, $3, $4);`, [
            req.body.title,
            req.body.content,
            (_b = req.file) === null || _b === void 0 ? void 0 : _b.path,
            userId
        ]);
        console.log(result);
        return res.status(201).json({ message: "Blog post created successfully", result });
    }
    catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.postBlog = postBlog;
const getBlogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const query = `
        SELECT * FROM blogs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
    `;
    try {
        const result = yield db_config_1.default.query(query, [limit, offset]);
        return res.status(200).json(result.rows);
    }
    catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.getBlogs = getBlogs;
const getSingleBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const query = `
        SELECT *
        FROM blogs
        WHERE id = $1;
    `;
    try {
        const result = yield db_config_1.default.query(query, [id]);
        return res.status(200).json(result.rows[0]);
    }
    catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.getSingleBlog = getSingleBlog;
const handleUpvote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { blogId } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        // Check existing upvote
        const existingUpvotes = yield db_config_1.default.query(`
            SELECT *
            FROM up_voted
            WHERE userId = $1 AND blogId = $2
        `, [userId, blogId]);
        if (existingUpvotes.rows[0]) {
            // If existing upvote, delete it
            yield db_config_1.default.query(`
                DELETE FROM up_voted
                WHERE userId = $1 AND blogId = $2
            `, [userId, blogId]);
            return res.status(200).json({ message: 'Upvote removed' });
        }
        // Add upvote
        yield db_config_1.default.query(`
            INSERT INTO up_voted (userId, blogId)
            VALUES ($1, $2)
        `, [userId, blogId]);
        // Remove downvote if it exists
        yield db_config_1.default.query(`
            DELETE FROM down_voted
            WHERE userId = $1 AND blogId = $2
        `, [userId, blogId]);
        return res.status(200).json({ message: 'Upvote recorded' });
    }
    catch (error) {
        console.error('Error handling upvote:', error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.handleUpvote = handleUpvote;
const handleDownvote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { blogId } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        // Check existing downvote
        const existingDownvotes = yield db_config_1.default.query(`
            SELECT *
            FROM down_voted
            WHERE userId = $1 AND blogId = $2
        `, [userId, blogId]);
        if (existingDownvotes.rows[0]) {
            // If existing downvote, delete it
            yield db_config_1.default.query(`
                DELETE FROM down_voted
                WHERE userId = $1 AND blogId = $2
            `, [userId, blogId]);
            return res.status(200).json({ message: 'Down voted removed' });
        }
        // Add down vote
        yield db_config_1.default.query(`
            INSERT INTO down_voted (userId, blogId)
            VALUES ($1, $2)
        `, [userId, blogId]);
        // Remove upvote if it exists
        yield db_config_1.default.query(`
            DELETE FROM up_voted
            WHERE userId = $1 AND blogId = $2
        `, [userId, blogId]);
        return res.status(200).json({ message: 'Downvote recorded' });
    }
    catch (error) {
        console.error('Error handling upvote:', error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.handleDownvote = handleDownvote;
const handleGetVotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { blogId } = req.query;
    const upVoteQuery = `
        SELECT COUNT(*) as count from up_voted
        WHERE blogid = $1
    `;
    const downVoteQuery = `
        SELECT COUNT(*) as count from down_voted
        WHERE blogid = $1
    `;
    try {
        const upVoteResult = yield db_config_1.default.query(upVoteQuery, [blogId]);
        const downVoteResult = yield db_config_1.default.query(downVoteQuery, [blogId]);
        const upVotes = (0, formatCount_1.formatCount)(parseInt(((_a = upVoteResult.rows[0]) === null || _a === void 0 ? void 0 : _a.count) || '0', 10));
        const downVotes = (0, formatCount_1.formatCount)(parseInt(((_b = downVoteResult.rows[0]) === null || _b === void 0 ? void 0 : _b.count) || '0', 10));
        return res.status(200).json({
            upVotes,
            downVotes
        });
    }
    catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.handleGetVotes = handleGetVotes;
const checkIsVoted = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { blogId, userId } = req.query;
    if (!userId || !blogId) {
        return res.status(400).json({ message: "Missing user or blog ID" });
    }
    const isUpvotedQuery = `
        SELECT * 
        FROM up_voted
        WHERE userid = $1 AND blogid = $2
    `;
    const isDownvotedQuery = `
        SELECT * 
        FROM down_voted
        WHERE userid = $1 AND blogid = $2
    `;
    try {
        const isUpvoted = yield db_config_1.default.query(isUpvotedQuery, [userId, blogId]);
        const isDownvoted = yield db_config_1.default.query(isDownvotedQuery, [userId, blogId]);
        return res.status(200).json({
            upvoted: isUpvoted.rows.length > 0,
            downvoted: isDownvoted.rows.length > 0
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.checkIsVoted = checkIsVoted;
const getTopBlogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
        WITH TopBlogs AS (
            SELECT blogid, COUNT(*) AS upvote_count
            FROM up_voted
            GROUP BY blogid
            ORDER BY upvote_count DESC
            LIMIT 5
        )
        SELECT b.id, b.title, b.created_at
        FROM blogs b
        INNER JOIN TopBlogs tb ON b.id = tb.blogid
        ORDER BY tb.upvote_count DESC;
    `;
    try {
        const result = yield db_config_1.default.query(query);
        return res.status(200).json(result.rows);
    }
    catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.getTopBlogs = getTopBlogs;
const getPostedBlogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.query.userId;
    console.log(userId);
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get pagination parameters from the request query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Default to 10 results per page
    const offset = (page - 1) * limit;
    try {
        // Get total count of blogs by the user
        const countQuery = `
            SELECT COUNT(*) 
            FROM blogs 
            WHERE owner = $1;
        `;
        const { rows: countResult } = yield db_config_1.default.query(countQuery, [userId]);
        const totalBlogs = parseInt(countResult[0].count, 10);
        // Get paginated blogs by the user
        const blogsQuery = `
            SELECT 
                b.id, 
                b.title, 
                b.content, 
                b.owner,
                b.created_at 
            FROM 
                blogs b
            WHERE 
                b.owner = $1
            ORDER BY 
                b.created_at DESC
            LIMIT $2
            OFFSET $3;
        `;
        const { rows: blogs } = yield db_config_1.default.query(blogsQuery, [userId, limit, offset]);
        // If no blogs found
        if (blogs.length === 0) {
            return res.status(200).json({ blogs: [], total: totalBlogs, page, limit });
        }
        // For each blog, get the count of upvotes and downvotes
        const blogIds = blogs.map(blog => blog.id);
        const upvotesQuery = `
            SELECT 
                blogid, 
                COUNT(*) as upvotes 
            FROM 
                up_voted 
            WHERE 
                blogid = ANY($1)
            GROUP BY 
                blogid;
        `;
        const downvotesQuery = `
            SELECT 
                blogid, 
                COUNT(*) as downvotes 
            FROM 
                down_voted 
            WHERE 
                blogid = ANY($1)
            GROUP BY 
                blogid;
        `;
        const { rows: upvotes } = yield db_config_1.default.query(upvotesQuery, [blogIds]);
        const { rows: downvotes } = yield db_config_1.default.query(downvotesQuery, [blogIds]);
        // Combine blogs with their respective upvotes and downvotes
        const blogsWithVotes = blogs.map(blog => {
            const upvote = upvotes.find(u => u.blogid === blog.id);
            const downvote = downvotes.find(d => d.blogid === blog.id);
            return Object.assign(Object.assign({}, blog), { upvotes: upvote ? parseInt(upvote.upvotes, 10) : 0, downvotes: downvote ? parseInt(downvote.downvotes, 10) : 0 });
        });
        return res.status(200).json({
            blogs: blogsWithVotes,
            total: totalBlogs,
            page,
            limit
        });
    }
    catch (error) {
        console.error('Error fetching blogs:', error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
});
exports.getPostedBlogs = getPostedBlogs;
