import { Request, Response } from "express";
import { User } from "../types/blogs";
import client from "../config/db.config";

export const addBookMark = async(req:Request<{},{},{blogId:string}>,res:Response)=>{
    const { blogId } = req.body;
    const userId  = (req.user as User)?.id;
    
    try {
        // Check if already saved
        const isExisting = await client.query(`
            SELECT * FROM bookmarks
            WHERE blog_id = $1
            AND saved_by = $2;`,
            [blogId, userId]
        );

        if(isExisting.rows.length > 0){
            // Delete bookmark
            await client.query(`
                DELETE FROM bookmarks
                WHERE blog_id = $1
                AND saved_by = $2;`,
                [blogId, userId]
            );

            return res.status(200).json({ message: 'Unsaved' });
        }
        
        // Save bookmark
        await client.query(`
            INSERT INTO bookmarks
            (blog_id, saved_by)
            VALUES ($1, $2);`,
            [blogId, userId]
        );

        return res.status(200).json({ message: 'Saved' });
    } catch (error) {
        console.error('Error adding bookmark:', error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};

export const isSavedBlog = async(req:Request<{},{},{},{blogId:string}>,res:Response)=>{
    const { blogId } = req.query;
    const userId  = (req.user as User)?.id;

    try {
        const isSaved = await client.query(`
            SELECT * FROM bookmarks
            WHERE blog_id = $1
            AND saved_by = $2;`,
            [blogId, userId]
        );

        return res.status(200).json({
            saved:isSaved.rows.length > 0
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
}

export const getBookMarked = async(req:Request,res:Response)=>{
    const userId  = (req.user as User)?.id;

    try {
        const bookMarked = await client.query(`
            SELECT b.id, b.title, b.content, b.created_at, b.cover_img
            FROM bookmarks bm
            JOIN blogs b ON bm.blog_id = b.id
            WHERE bm.saved_by = $1
            ORDER BY bm.created_at DESC;`,
            [userId]
        )

        return res.status(200).json(bookMarked.rows)
    } catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
}