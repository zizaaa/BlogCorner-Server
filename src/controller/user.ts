import { Request, Response } from "express";
import { Passwords, userData, userLogin } from "../types/user";
import { emailSender } from './mailer/emailSender'
import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from 'jsonwebtoken'
import client from "../config/db.config";
import * as argon2 from "argon2";
import { resetPassword } from "./mailer/resetPassword";
import { deleteToken, getToken, insertToken } from "./tokenController";
import { User } from "../types/blogs";
require('dotenv').config();

export async function registerUser(req:Request<{},{},userData>, res:Response) {
    const {username,name,password,email,avatar} = req.body;

    const checkUserQuery = `
    SELECT username,email
    FROM users
    WHERE username=$1 OR email=$2
    `
    const createQuery = `
        INSERT INTO users
        (username,name,password,email,avatar)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `

    try {
        const existingUser = await client.query(checkUserQuery,[username,email])

            if(existingUser.rows[0]){
                const existingCredential = existingUser.rows[0].username === username ? 'Username' : 'Email';
                return res.status(400).json({
                    message: `${existingCredential} already exists.`
                });
            }

        const hash = await argon2.hash(password);

        const result = await client.query(createQuery,[username,name,hash,email,avatar])

        const payload = { email:result.rows[0].email };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        //save token
        await insertToken(token)
        //send verification email
        emailSender(result.rows[0].email,token);
        return res.status(200).json({
            message:"success"
        })
    } catch (error) {
        console.log(error)
        if(error instanceof Error){
            return res.status(500).json({message:error})
        }
        return res.status(500).json({message:error})
    }
}

export async function login(req:Request<{},{},userLogin>,res:Response){
    const {username,password} = req.body;

    const logInQuery = `
    SELECT *
    FROM users
    WHERE username = $1
    `
    try {
        const user = await client.query(logInQuery,[username])

            if(!user.rows[0]){
                return res.status(404).json({message:"User not found!"})
            }

        if (await argon2.verify(user.rows[0].password, password)) {
            
            if(user.rows[0].isverified === false){
                return res.status(400).json({message:"Account not verified"})
            }

            const payload = { id: user.rows[0].id, username: user.rows[0].username };
            const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '12h' });
    
            res.json({ message: 'Logged in successfully', token});
        } else {
            // password did not match
            return res.status(401).json({message:"Incorrect password!"})
        }

    } catch (error) {
        return res.status(500).json({message:error})
    }
}

export async function rsndVrfctnLnk(req:Request<{},{},{email:string}>,res:Response) {
    const {email} = req.body;
    console.log(email)
    try {
        const result = await client.query(`
            SELECT *
            FROM users
            WHERE email = $1`,
            [email]
        )

        const payload = { email:result.rows[0].email };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        //save token
        await insertToken(token)
        //send verification email
        emailSender(result.rows[0].email,token);

        return res.status(200).json({
            message:"success"
        })
    } catch (error) {
        return res.status(500).json({message:error})
    }
}

export async function verifyUser(req: Request<{}, {}, {}, { token: string; email: string }>, res: Response) {
    const { email, token } = req.query;
    const jwtSecret = process.env.JWT_SECRET!;

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
        const result = await getToken(token)

        if (typeof result === 'string') {
            return res.status(400).render('invalidToken', { message: 'Token is invalid or has already been used.' });
        }

        if (typeof result !== 'string' && result.rows.length === 0) {
            return res.status(400).render('invalidToken', { message: 'Token is invalid or has already been used.' });
        }

        // Check if the user exists
        const existingUser = await client.query(verifyQuery, [email]);
        if (existingUser.rows.length === 0) {
            return res.status(404).render('userNotFound', { message: 'User not found.' });
        }

        // Verify the token
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        // Ensure the decoded token contains the email
        if (typeof decoded === 'object' && 'email' in decoded) {
            // Ensure the email from the token matches the email in the query
            if (decoded.email !== email) {
                return res.status(400).render('invalidToken', { message: 'Token email mismatch.' });
            }
        } else {
            return res.status(400).render('invalidToken', { message: 'Invalid token structure.' });
        }

        // Update the user's verification status
        await client.query(updateQuery, [email]);

        // Delete the token from the database
        await deleteToken(token);

        return res.status(200).render('success', { message: 'Email successfully verified!' });
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return res.status(400).render('invalidToken', { message: 'The verification link has expired. Please request a new one.' });
        } else if (error instanceof JsonWebTokenError) {
            return res.status(400).render('invalidToken', { message: 'Invalid token. Please request a new verification link.' });
        } else if (error instanceof Error) {
            console.error('Error verifying user:', error);
            return res.status(500).render('error', { message: 'An error occurred while verifying your email.' });
        } else {
            console.error('Unexpected error:', error);
            return res.status(500).render('error', { message: 'An unexpected error occurred.' });
        }
    }
}

export async function forgotPassword(req:Request<{},{},{email:string}>,res:Response){
    const { email } = req.body;

    const emailQuery = `
        SELECT *
        FROM users
        WHERE email = $1
    `

    try {
        const existingUser = await client.query(emailQuery,[email])

        if(!existingUser.rows[0]){
            return res.status(404).json({message:'User not found!'})
        }
        const payload = { email:existingUser.rows[0].email };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        resetPassword(email,token);
        await insertToken(token);
        return res.status(200).json({message:'success'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({message:'An unexpected error occured'})
    }
}

export async function sendResetPassForm(req:Request<{},{},{},{email:string,token:string}>,res:Response){
    const { email, token } = req.query;
    const jwtSecret = process.env.JWT_SECRET!;
    
    try {
        // Check if the token is used
        const result = await getToken(token)

        if (typeof result === 'string') {
            return res.status(400).render('invalidRequest', { message: 'Token is invalid or has already been used.' });
        }

        if (typeof result !== 'string' && result.rows.length === 0) {
            return res.status(400).render('invalidRequest', { message: 'Token is invalid or has already been used.' });
        }
        
        // Verify the token
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        // Ensure the decoded token contains the email
        if (typeof decoded === 'object' && 'email' in decoded) {
            // Ensure the email from the token matches the email in the query
            if (decoded.email !== email) {
                return res.status(400).render('invalidRequest', { message: 'Token email mismatch.' });
            }
        } else {
            return res.status(400).render('invalidRequest', { message: 'Invalid token structure.' });
        }

        // Pass the token to the EJS template
        return res.status(200).render('resetPassword', {
            message: 'Valid token',
            token // Pass the token to the template
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({message:'An unexpected error occured'})
    }
}

export async function resetForgottedPass(req: Request<{}, {}, { newPassword: string; confirmPassword: string; token: string }>, res: Response) {
    const { newPassword, confirmPassword, token } = req.body;
    const jwtSecret = process.env.JWT_SECRET!;

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
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        // Ensure the decoded token contains the email
        if (typeof decoded === 'object' && 'email' in decoded) {
            // Hash the new password
            const hash = await argon2.hash(newPassword);
            
            // Update the password in the database
            await client.query(changePassQuery, [hash, decoded.email]);
            
            // Delete the stored token
            await deleteToken(token);

            // Render the success page
            return res.status(200).render('changePasswordSuccess', { message: 'Password successfully changed!' });
        } else {
            return res.status(400).render('invalidRequest', { message: 'Invalid token structure.' });
        }
    } catch (error) {
        console.error('Error during password reset:', error);
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
}

export const getSingleUser = async(req:Request<{},{},{},{userId:string}>,res:Response) =>{
    const {userId} = req.query;

    try {
        const result = await client.query(`
            SELECT id,username,email,name,avatar,created_at,isverified 
            FROM users 
            WHERE id = $1`,
            [userId]
        )
            if(result.rows.length <= 0){
                return res.status(404).json({message:'User not found'})
            }
        return res.status(200).json(result.rows[0])
    } catch (error) {
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
}

export const updateName = async (req: Request<{},{},{  name: string }>, res: Response) => {
    const { name } = req.body;
    const userId = (req.user as User)?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

    try {
        // Check if user exists
        const existing = await client.query(
            `SELECT * FROM users WHERE id = $1`,
            [userId]
        );

        if (existing.rows.length <= 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's name
        await client.query(
            `UPDATE users SET name = $1 WHERE id = $2`,
            [name, userId] // Correct order of parameters
        );

        return res.status(200).json({ message: 'Name changed successfully' });
    } catch (error) {
        console.error('Error updating name:', error);
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
};

export const updateEmail = async (req: Request<{},{},{email:string}>, res: Response) => {
    const { email } = req.body;
    const userId = (req.user as User)?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Check if user exists
        const existing = await client.query(
            `SELECT * FROM users WHERE id = $1`,
            [userId]
        );

        if (existing.rows.length <= 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's email
        const result = await client.query(
            `UPDATE users SET email = $1,isverified = false WHERE id = $2 RETURNING email;`,
            [email, userId]
        );

        if (result.rowCount === 0) {
            return res.status(500).json({ message: 'Failed to update email' });
        }

        const updatedEmail = result.rows[0].email;

        // Generate token with the updated email
        const payload = { email: updatedEmail };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        // Save token
        await insertToken(token);

        // Send verification email
        emailSender(updatedEmail, token);

        return res.status(200).json({ message: 'Email changed successfully' });
    } catch (error) {
        console.error('Error updating email:', error);
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
};

export const handleUpdatePassword = async(req: Request<{}, {}, Passwords>, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const userId = (req.user as User)?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Check if user exists
        const existing = await client.query(
            `SELECT * FROM users WHERE id = $1`,
            [userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = existing.rows[0];

        // Verify old password
        const validPassword = await argon2.verify(user.password, oldPassword);
        if (!validPassword) {
            return res.status(401).json({ message: "Incorrect old password!" });
        }

        // Hash new password and update
        const hash = await argon2.hash(newPassword);
        await client.query(
            `UPDATE users SET password = $1 WHERE id = $2`,
            [hash, userId]
        );

        return res.status(200).json({ message: 'Password changed successfully!' });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
};

export const updateUserAvatar = async(req: Request, res: Response) => {
    const userId = (req.user as User)?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.file?.path) {
        return res.status(400).json({ message: 'File not found' });
    }

    try {
        // Check if user exists
        const existing = await client.query(
            `SELECT * FROM users WHERE id = $1`,
            [userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update avatar in database
        await client.query(
            `UPDATE users SET avatar = $2 WHERE id = $1`,
            [userId, req.file.path]
        );

        return res.status(200).json({ message: "Image successfully changed" });
    } catch (error) {
        console.error('Error updating avatar:', error);
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
};