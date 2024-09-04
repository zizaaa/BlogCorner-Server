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
exports.resetPassword = resetPassword;
const dotenv_1 = __importDefault(require("dotenv"));
const transporter_1 = require("./transporter");
dotenv_1.default.config();
// Function to send a password reset email
function resetPassword(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const resetUrl = `${process.env.SERVER_URL}/api/user/change-password?token=${token}&email=${email}`;
        try {
            yield transporter_1.transporter.sendMail({
                from: 'BlogCorner',
                to: email,
                subject: 'Password Reset Request',
                html: `
                <p>We received a request to reset your password. Click the button below to reset it:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #4D99BC; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>If the button above does not work, click the link below:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>If you did not request a password reset, please ignore this email.</p>
                <p>Best regards,<br/><strong>BlogCorner Team</strong></p>
            `,
            });
            return 'success';
        }
        catch (error) {
            console.error('Error sending email:', error);
            return 'error';
        }
    });
}
