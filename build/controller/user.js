"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.updateUserAvatar = exports.handleUpdatePassword = exports.updateEmail = exports.updateName = exports.getSingleUser = void 0;
exports.registerUser = registerUser;
exports.login = login;
exports.verifyUser = verifyUser;
exports.forgotPassword = forgotPassword;
exports.sendResetPassForm = sendResetPassForm;
exports.resetForgottedPass = resetForgottedPass;
const emailSender_1 = require("./mailer/emailSender");
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const db_config_1 = __importDefault(require("../config/db.config"));
const argon2 = __importStar(require("argon2"));
const resetPassword_1 = require("./mailer/resetPassword");
const tokenController_1 = require("./tokenController");
require('dotenv').config();
function registerUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, name, password, email, avatar } = req.body;
        const checkUserQuery = `
    SELECT username,email
    FROM users
    WHERE username=$1 OR email=$2
    `;
        const createQuery = `
        INSERT INTO users
        (username,name,password,email,avatar)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
        try {
            const existingUser = yield db_config_1.default.query(checkUserQuery, [username, email]);
            if (existingUser.rows[0]) {
                const existingCredential = existingUser.rows[0].username === username ? 'Username' : 'Email';
                return res.status(400).json({
                    message: `${existingCredential} already exists.`
                });
            }
            const hash = yield argon2.hash(password);
            const result = yield db_config_1.default.query(createQuery, [username, name, hash, email, avatar]);
            const payload = { email: result.rows[0].email };
            const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
            //save token
            yield (0, tokenController_1.insertToken)(token);
            //send verification email
            (0, emailSender_1.emailSender)(result.rows[0].email, token);
            return res.status(200).json({
                message: "success"
            });
        }
        catch (error) {
            console.log(error);
            if (error instanceof Error) {
                return res.status(500).json({ message: error });
            }
            return res.status(500).json({ message: error });
        }
    });
}
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, password } = req.body;
        const logInQuery = `
    SELECT *
    FROM users
    WHERE username = $1
    `;
        try {
            const user = yield db_config_1.default.query(logInQuery, [username]);
            if (!user.rows[0]) {
                return res.status(404).json({ message: "User not found!" });
            }
            if (user.rows[0].isverified === false) {
                return res.status(400).json({ message: "Account not verified" });
            }
            if (yield argon2.verify(user.rows[0].password, password)) {
                const payload = { id: user.rows[0].id, username: user.rows[0].username };
                const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
                res.json({ message: 'Logged in successfully', token });
            }
            else {
                // password did not match
                return res.status(401).json({ message: "Incorrect password!" });
            }
        }
        catch (error) {
            return res.status(500).json({ message: error });
        }
    });
}
function verifyUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, token } = req.query;
        const jwtSecret = process.env.JWT_SECRET;
        const verifyQuery = `
        SELECT email
        FROM users
        WHERE email = $1
    `;
        const updateQuery = `
        UPDATE users
        SET isVerified = TRUE
        WHERE email = $1
    `;
        if (!token || !email) {
            return res.status(400).render('error', { message: 'Token or email is missing.' });
        }
        try {
            // Check if the token is used
            const result = yield (0, tokenController_1.getToken)(token);
            if (typeof result === 'string') {
                return res.status(400).render('invalidToken', { message: 'Token is invalid or has already been used.' });
            }
            if (typeof result !== 'string' && result.rows.length === 0) {
                return res.status(400).render('invalidToken', { message: 'Token is invalid or has already been used.' });
            }
            // Check if the user exists
            const existingUser = yield db_config_1.default.query(verifyQuery, [email]);
            if (existingUser.rows.length === 0) {
                return res.status(404).render('userNotFound', { message: 'User not found.' });
            }
            // Verify the token
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            // Ensure the decoded token contains the email
            if (typeof decoded === 'object' && 'email' in decoded) {
                // Ensure the email from the token matches the email in the query
                if (decoded.email !== email) {
                    return res.status(400).render('invalidToken', { message: 'Token email mismatch.' });
                }
            }
            else {
                return res.status(400).render('invalidToken', { message: 'Invalid token structure.' });
            }
            // Update the user's verification status
            yield db_config_1.default.query(updateQuery, [email]);
            // Delete the token from the database
            yield (0, tokenController_1.deleteToken)(token);
            return res.status(200).render('success', { message: 'Email successfully verified!' });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.TokenExpiredError) {
                return res.status(400).render('invalidToken', { message: 'The verification link has expired. Please request a new one.' });
            }
            else if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
                return res.status(400).render('invalidToken', { message: 'Invalid token. Please request a new verification link.' });
            }
            else if (error instanceof Error) {
                console.error('Error verifying user:', error);
                return res.status(500).render('error', { message: 'An error occurred while verifying your email.' });
            }
            else {
                console.error('Unexpected error:', error);
                return res.status(500).render('error', { message: 'An unexpected error occurred.' });
            }
        }
    });
}
function forgotPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email } = req.body;
        const emailQuery = `
        SELECT *
        FROM users
        WHERE email = $1
    `;
        try {
            const existingUser = yield db_config_1.default.query(emailQuery, [email]);
            if (!existingUser.rows[0]) {
                return res.status(404).json({ message: 'User not found!' });
            }
            const payload = { email: existingUser.rows[0].email };
            const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
            (0, resetPassword_1.resetPassword)(email, token);
            yield (0, tokenController_1.insertToken)(token);
            return res.status(200).json({ message: 'success' });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'An unexpected error occured' });
        }
    });
}
function sendResetPassForm(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, token } = req.query;
        const jwtSecret = process.env.JWT_SECRET;
        try {
            // Check if the token is used
            const result = yield (0, tokenController_1.getToken)(token);
            if (typeof result === 'string') {
                return res.status(400).render('invalidRequest', { message: 'Token is invalid or has already been used.' });
            }
            if (typeof result !== 'string' && result.rows.length === 0) {
                return res.status(400).render('invalidRequest', { message: 'Token is invalid or has already been used.' });
            }
            // Verify the token
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            // Ensure the decoded token contains the email
            if (typeof decoded === 'object' && 'email' in decoded) {
                // Ensure the email from the token matches the email in the query
                if (decoded.email !== email) {
                    return res.status(400).render('invalidRequest', { message: 'Token email mismatch.' });
                }
            }
            else {
                return res.status(400).render('invalidRequest', { message: 'Invalid token structure.' });
            }
            // Pass the token to the EJS template
            return res.status(200).render('resetPassword', {
                message: 'Valid token',
                token // Pass the token to the template
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'An unexpected error occured' });
        }
    });
}
function resetForgottedPass(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { newPassword, confirmPassword, token } = req.body;
        const jwtSecret = process.env.JWT_SECRET;
        if (newPassword !== confirmPassword) {
            return res.status(400).render('passwordNotMatched', { message: 'Passwords do not match.' });
        }
        const changePassQuery = `
        UPDATE users
        SET password = $1
        WHERE email = $2
    `;
        try {
            // Verify the token
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            // Ensure the decoded token contains the email
            if (typeof decoded === 'object' && 'email' in decoded) {
                // Hash the new password
                const hash = yield argon2.hash(newPassword);
                // Update the password in the database
                yield db_config_1.default.query(changePassQuery, [hash, decoded.email]);
                // Delete the stored token
                yield (0, tokenController_1.deleteToken)(token);
                // Render the success page
                return res.status(200).render('changePasswordSuccess', { message: 'Password successfully changed!' });
            }
            else {
                return res.status(400).render('invalidRequest', { message: 'Invalid token structure.' });
            }
        }
        catch (error) {
            console.error('Error during password reset:', error);
            return res.status(500).json({ message: 'An unexpected error occurred.' });
        }
    });
}
const getSingleUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    try {
        const result = yield db_config_1.default.query(`
            SELECT id,username,email,name,avatar,created_at 
            FROM users 
            WHERE id = $1`, [userId]);
        if (result.rows.length <= 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(result.rows[0]);
    }
    catch (error) {
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
});
exports.getSingleUser = getSingleUser;
const updateName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        // Check if user exists
        const existing = yield db_config_1.default.query(`SELECT * FROM users WHERE id = $1`, [userId]);
        if (existing.rows.length <= 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Update the user's name
        yield db_config_1.default.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, userId] // Correct order of parameters
        );
        return res.status(200).json({ message: 'Name changed successfully' });
    }
    catch (error) {
        console.error('Error updating name:', error);
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
});
exports.updateName = updateName;
const updateEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        // Check if user exists
        const existing = yield db_config_1.default.query(`SELECT * FROM users WHERE id = $1`, [userId]);
        if (existing.rows.length <= 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Update the user's email
        const result = yield db_config_1.default.query(`UPDATE users SET email = $1,isverified = false WHERE id = $2 RETURNING email;`, [email, userId]);
        if (result.rowCount === 0) {
            return res.status(500).json({ message: 'Failed to update email' });
        }
        const updatedEmail = result.rows[0].email;
        // Generate token with the updated email
        const payload = { email: updatedEmail };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        // Save token
        yield (0, tokenController_1.insertToken)(token);
        // Send verification email
        (0, emailSender_1.emailSender)(updatedEmail, token);
        return res.status(200).json({ message: 'Email changed successfully' });
    }
    catch (error) {
        console.error('Error updating email:', error);
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
});
exports.updateEmail = updateEmail;
const handleUpdatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { oldPassword, newPassword } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        // Check if user exists
        const existing = yield db_config_1.default.query(`SELECT * FROM users WHERE id = $1`, [userId]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = existing.rows[0];
        // Verify old password
        const validPassword = yield argon2.verify(user.password, oldPassword);
        if (!validPassword) {
            return res.status(401).json({ message: "Incorrect old password!" });
        }
        // Hash new password and update
        const hash = yield argon2.hash(newPassword);
        yield db_config_1.default.query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, userId]);
        return res.status(200).json({ message: 'Password changed successfully!' });
    }
    catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
});
exports.handleUpdatePassword = handleUpdatePassword;
const updateUserAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!((_b = req.file) === null || _b === void 0 ? void 0 : _b.path)) {
        return res.status(400).json({ message: 'File not found' });
    }
    try {
        // Check if user exists
        const existing = yield db_config_1.default.query(`SELECT * FROM users WHERE id = $1`, [userId]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Update avatar in database
        yield db_config_1.default.query(`UPDATE users SET avatar = $2 WHERE id = $1`, [userId, req.file.path]);
        return res.status(200).json({ message: "Image successfully changed" });
    }
    catch (error) {
        console.error('Error updating avatar:', error);
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
});
exports.updateUserAvatar = updateUserAvatar;
