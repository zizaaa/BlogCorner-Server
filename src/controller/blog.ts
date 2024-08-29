import { Request, Response } from "express";
import client from "../config/db.config";
import { BlogFormData, GetBlogQuery, User } from "../types/blogs";

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
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};

export const getBlogs = async(req:Request<{},{},{},GetBlogQuery>,res:Response)=>{
    const { page, limit} = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const query = `
        SELECT * FROM blogs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
    `
    try {
        const result = await client.query(query,[limit,offset]);

        return res.status(200).json(result.rows)
    } catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
}

export const getSingleBlog = async(req:Request<{id:number}>,res:Response)=>{
    const {id} = req.params;

    const query = `
        SELECT *
        FROM blogs
        WHERE id = $1;
    `
    try {
        const result = await client.query(query,[id])

        return res.status(200).json(result.rows[0])
    } catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
}

// export const getBlogVoteCounts = async (req: Request, res: Response) => {
//     const { blogId } = req.params;

//     try {
//         // Query to get vote counts
//         const result = await client.query(`
//             SELECT
//                 COALESCE(SUM(CASE WHEN u.blogId IS NOT NULL THEN 1 ELSE 0 END), 0) AS up_votes,
//                 COALESCE(SUM(CASE WHEN d.blogId IS NOT NULL THEN 1 ELSE 0 END), 0) AS down_votes
//             FROM blogs b
//             LEFT JOIN up_voted u ON b.id = u.blogId
//             LEFT JOIN down_voted d ON b.id = d.blogId
//             WHERE b.id = $1
//         `, [blogId]);

//         res.status(200).json(result.rows[0]);

//     } catch (error) {
//         return res.status(500).json({ message: "An unexpected error occurred" });
//     }
// };
// export const getPopularBlogs = async(req:Request,res:Response)=>{
//     try {
        
//     } catch (error) {
//         return res.status(500).json({ message: "An unexpected error occurred" });
//     }
// }

export const handleUpvote = async (req: Request<{},{},{blogId:string}>, res: Response) => {
    const { blogId } = req.body;
    const userId = (req.user as User)?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Check existing upvote
        const existingUpvotes = await client.query(`
            SELECT *
            FROM up_voted
            WHERE userId = $1 AND blogId = $2
        `, [userId, blogId]);
            console.log(existingUpvotes)
        if (existingUpvotes.rows[0]) {
            // If existing upvote, delete it
            await client.query(`
                DELETE FROM up_voted
                WHERE userId = $1 AND blogId = $2
            `, [userId, blogId]);

            return res.status(200).json({ message: 'Upvote removed' });
        }

        // Add upvote
        await client.query(`
            INSERT INTO up_voted (userId, blogId)
            VALUES ($1, $2)
        `, [userId, blogId]);

        // Remove downvote if it exists
        await client.query(`
            DELETE FROM down_voted
            WHERE userId = $1 AND blogId = $2
        `, [userId, blogId]);

        res.status(200).json({ message: 'Upvote recorded' });
    } catch (error) {
        console.error('Error handling upvote:', error);
        res.status(500).json({ message: "An unexpected error occurred" });
    }
};

export const handleDownvote = async (req: Request<{},{},{blogId:string}>, res: Response) => {
    const { blogId } = req.body;
    const userId = (req.user as User)?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Check existing downvote
        const existingDownvotes = await client.query(`
            SELECT *
            FROM down_voted
            WHERE userId = $1 AND blogId = $2
        `, [userId, blogId]);
            console.log(existingDownvotes)

        if (existingDownvotes.rows[0]) {
            // If existing downvote, delete it
            await client.query(`
                DELETE FROM down_voted
                WHERE userId = $1 AND blogId = $2
            `, [userId, blogId]);

            return res.status(200).json({ message: 'Down voted removed' });
        }

        // Add down vote
        await client.query(`
            INSERT INTO down_voted (userId, blogId)
            VALUES ($1, $2)
        `, [userId, blogId]);

        // Remove upvote if it exists
        await client.query(`
            DELETE FROM up_voted
            WHERE userId = $1 AND blogId = $2
        `, [userId, blogId]);

        res.status(200).json({ message: 'Downvote recorded' });
    } catch (error) {
        console.error('Error handling upvote:', error);
        res.status(500).json({ message: "An unexpected error occurred" });
    }
};