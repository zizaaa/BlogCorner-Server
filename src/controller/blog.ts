import { Request, Response } from "express";
import client from "../config/db.config";
import { BlogFormData, User } from "../types/blogs";

export const postBlog = async (req: Request<{},{},BlogFormData>, res: Response) => {
    const insertQuery = `
        INSERT INTO blogs
        (title, content, cover_img, up_vote, down_vote, owner)
        VALUES ($1, $2, $3, 0, 0, $4);
    `;
    try {
        // Type assertion to ensure TypeScript understands req.user has an id
        const userId = (req.user as User)?.id;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        const result = await client.query(insertQuery, [
            req.body.title,
            req.body.content,
            req.file?.path,
            userId
        ]);

        res.status(201).json({ message: "Blog post created successfully", result });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        }
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};