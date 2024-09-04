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
exports.emailSender = emailSender;
const dotenv_1 = __importDefault(require("dotenv"));
const transporter_1 = require("./transporter");
dotenv_1.default.config();
// Function to send a verification email
function emailSender(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const verificationUrl = `${process.env.SERVER_URL}/api/user/verify?token=${token}&email=${email}`;
        try {
            yield transporter_1.transporter.sendMail({
                from: 'BlogCorner',
                to: email,
                subject: 'Email Verification',
                html: `
                <p>Please verify your email by clicking the button below:</p>
                <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #4D99BC; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>Or click the link below if the button does not work:</p>
                <a href="${verificationUrl}">${verificationUrl}</a>
                <p>Best regards,<br/><strong>BlogCorner</strong></p>
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
