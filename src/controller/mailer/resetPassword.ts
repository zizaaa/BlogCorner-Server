import dotenv from 'dotenv';
import { transporter } from './transporter';

dotenv.config();

// Function to send a password reset email
export async function resetPassword(email: string, token: string): Promise<string> {
    const resetUrl = `${process.env.SERVER_URL}/api/user/change-password?token=${token}&email=${email}`;

    try {
        await transporter.sendMail({
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
    } catch (error) {
        console.error('Error sending email:', error);
        return 'error';
    }
}