import dotenv from 'dotenv';
import { transporter } from './transporter';

dotenv.config();

// Function to send a verification email
export async function emailSender(email: string,token:string): Promise<string> {
    const verificationUrl = `${process.env.SERVER_URL}/api/user/verify?token=${token}&email=${email}`;

    try {
        await transporter.sendMail({
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
    } catch (error) {
        console.error('Error sending email:', error);
        return 'error';
    }
}