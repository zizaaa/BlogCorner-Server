import { Request, Response } from "express";
import { userData, userLogin } from "../types/user";
import * as argon2 from "argon2";
import client from "../config/db.config";
import jwt from 'jsonwebtoken'
require('dotenv').config();

export async function registerUser(req:Request<{},{},userData>, res:Response) {
    const {username,firstname,lastname,middlename,password,email,avatar} = req.body;
    
    const createQuery = `
        INSERT INTO users
        (username,firstname,lastname,middlename,password,email,avatar)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `
    try {
        const hash = await argon2.hash(password);

        const result = await client.query(createQuery,[username,firstname,lastname,middlename,hash,email,avatar])

        const payload = { id: result.rows[0].id, username: result.rows[0].username };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        return res.status(200).json({
            message:"success",
            token
        })
    } catch (error) {
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

            if(!user){
                return res.status(404).json({message:"User not found!"})
            }

        if (await argon2.verify(user.rows[0].password, password)) {
            const payload = { id: user.rows[0].id, username: user.rows[0].username };
            const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    
            res.json({ message: 'Logged in successfully', token});
        } else {
            // password did not match
            return res.status(401).json({message:"Incorrect password!"})
        }

    } catch (error) {
        return res.status(500).json({message:error})
    }
}