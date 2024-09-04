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
exports.updateUserTable = updateUserTable;
exports.createUserTable = createUserTable;
exports.createBlogsTable = createBlogsTable;
exports.createBookmarksTable = createBookmarksTable;
exports.createTables = createTables;
const db_config_1 = __importDefault(require("../config/db.config"));
//update existing table
function updateUserTable() {
    return __awaiter(this, void 0, void 0, function* () {
        const alterQuery = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS isVerified BOOLEAN DEFAULT FALSE;
    `;
        yield db_config_1.default.query(alterQuery);
    });
}
// Create the users table first
function createUserTable() {
    return __awaiter(this, void 0, void 0, function* () {
        const createQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(50) NOT NULL,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        avatar VARCHAR(255),
        isVerified BOOLEAN DEFAULT FALSE
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
        yield db_config_1.default.query(createQuery);
        console.log('Users table created successfully');
    });
}
// Create the blogs table
function createBlogsTable() {
    return __awaiter(this, void 0, void 0, function* () {
        const createQuery = `
    CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        cover_img VARCHAR(255),
        up_vote INT,
        down_vote INT,
        owner INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
    `;
        yield db_config_1.default.query(createQuery);
        console.log('Blogs table created successfully');
    });
}
// Create the bookmarks table
function createBookmarksTable() {
    return __awaiter(this, void 0, void 0, function* () {
        const createQuery = `
    CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
        saved_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
    `;
        yield db_config_1.default.query(createQuery);
        console.log('Bookmarks table created successfully');
    });
}
// Main function to create all tables
function createTables() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // First, ensure the users table is created
            yield createUserTable();
            // Then, create the blogs and bookmarks tables
            yield createBlogsTable();
            yield createBookmarksTable();
            console.log('Tables created');
        }
        catch (error) {
            console.error('Error creating tables:', error);
        }
    });
}
