import { query, Request, Response } from "express";
import client from "../config/db.config";
import { BlogFormData, GetAllPostedBlogs, GetBlogQuery, UpdateBlogFormData, User } from "../types/blogs";
import { formatCount } from "../utility/formatCount";

export const postBlog = async (req: Request<{},{},BlogFormData>, res: Response) => {
    try {
        const userId = (req.user as User)?.id;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        const result = await client.query(`
            INSERT INTO blogs
            (title, content, cover_img, owner)
            VALUES ($1, $2, $3, $4);`, 
        [
            req.body.title,
            req.body.content,
            req.file?.path,
            userId
        ]);
        console.log(result)
        return res.status(201).json({ message: "Blog post created successfully", result });
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

        return res.status(200).json({ message: 'Upvote recorded' });
    } catch (error) {
        console.error('Error handling upvote:', error);
        return res.status(500).json({ message: "An unexpected error occurred" });
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

        return res.status(200).json({ message: 'Downvote recorded' });
    } catch (error) {
        console.error('Error handling upvote:', error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};

export const handleGetVotes = async(req: Request<{}, {}, {}, { blogId: string }>, res: Response) => {
    const { blogId } = req.query;

    const upVoteQuery = `
        SELECT COUNT(*) as count from up_voted
        WHERE blogid = $1
    `;

    const downVoteQuery = `
        SELECT COUNT(*) as count from down_voted
        WHERE blogid = $1
    `;

    try {
        const upVoteResult = await client.query(upVoteQuery, [blogId]);
        const downVoteResult = await client.query(downVoteQuery, [blogId]);

        const upVotes = formatCount(parseInt(upVoteResult.rows[0]?.count || '0', 10));
        const downVotes = formatCount(parseInt(downVoteResult.rows[0]?.count || '0', 10));

        return res.status(200).json({
            upVotes,
            downVotes
        });
    } catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};

export const checkIsVoted = async (req: Request<{},{},{},{blogId:string,userId:string}>, res: Response) => {
    const { blogId,userId } = req.query;

    if (!userId || !blogId) {
        return res.status(400).json({ message: "Missing user or blog ID" });
    }

    const isUpvotedQuery = `
        SELECT * 
        FROM up_voted
        WHERE userid = $1 AND blogid = $2
    `;
    const isDownvotedQuery = `
        SELECT * 
        FROM down_voted
        WHERE userid = $1 AND blogid = $2
    `;

    try {
        const isUpvoted = await client.query(isUpvotedQuery, [userId, blogId]);
        const isDownvoted = await client.query(isDownvotedQuery, [userId, blogId]);

        return res.status(200).json({
            upvoted: isUpvoted.rows.length > 0,
            downvoted: isDownvoted.rows.length > 0 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};

export const getTopBlogs = async (req:Request,res:Response) => {
    const query = `
        WITH TopBlogs AS (
            SELECT blogid, COUNT(*) AS upvote_count
            FROM up_voted
            GROUP BY blogid
            ORDER BY upvote_count DESC
            LIMIT 5
        )
        SELECT b.id, b.title, b.created_at
        FROM blogs b
        INNER JOIN TopBlogs tb ON b.id = tb.blogid
        ORDER BY tb.upvote_count DESC;
    `;

    try {
        const result = await client.query(query);

        return res.status(200).json(result.rows);
    } catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};

export const getPostedBlogs = async (req: Request<{},{},{},GetAllPostedBlogs>, res: Response) => {
    const userId = req.query.userId;
    console.log(userId)
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Get pagination parameters from the request query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;  // Default to 10 results per page

    const offset = (page - 1) * limit;

    try {
        // Get total count of blogs by the user
        const countQuery = `
            SELECT COUNT(*) 
            FROM blogs 
            WHERE owner = $1;
        `;
        const { rows: countResult } = await client.query(countQuery, [userId]);
        const totalBlogs = parseInt(countResult[0].count, 10);

        // Get paginated blogs by the user
        const blogsQuery = `
            SELECT 
                b.id, 
                b.title, 
                b.content, 
                b.owner,
                b.created_at 
            FROM 
                blogs b
            WHERE 
                b.owner = $1
            ORDER BY 
                b.created_at DESC
            LIMIT $2
            OFFSET $3;
        `;
        const { rows: blogs } = await client.query(blogsQuery, [userId, limit, offset]);

        // If no blogs found
        if (blogs.length === 0) {
            return res.status(200).json({ blogs: [], total: totalBlogs, page, limit });
        }

        // For each blog, get the count of upvotes and downvotes
        const blogIds = blogs.map(blog => blog.id);

        const upvotesQuery = `
            SELECT 
                blogid, 
                COUNT(*) as upvotes 
            FROM 
                up_voted 
            WHERE 
                blogid = ANY($1)
            GROUP BY 
                blogid;
        `;
        const downvotesQuery = `
            SELECT 
                blogid, 
                COUNT(*) as downvotes 
            FROM 
                down_voted 
            WHERE 
                blogid = ANY($1)
            GROUP BY 
                blogid;
        `;

        const { rows: upvotes } = await client.query(upvotesQuery, [blogIds]);
        const { rows: downvotes } = await client.query(downvotesQuery, [blogIds]);

        // Combine blogs with their respective upvotes and downvotes
        const blogsWithVotes = blogs.map(blog => {
            const upvote = upvotes.find(u => u.blogid === blog.id);
            const downvote = downvotes.find(d => d.blogid === blog.id);

            return {
                ...blog,
                upvotes: upvote ? parseInt(upvote.upvotes, 10) : 0,
                downvotes: downvote ? parseInt(downvote.downvotes, 10) : 0
            };
        });

        return res.status(200).json({
            blogs: blogsWithVotes,
            total: totalBlogs,
            page,
            limit
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};

export const getSingleOwnedBlog = async(req:Request<{id:number}>,res:Response)=>{
    const {id} = req.params;
    const userId = (req.user as User)?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const query = `
        SELECT *
        FROM blogs
        WHERE id = $1
        AND owner = $2;
    `
    try {
        const result = await client.query(query,[id,userId])

        return res.status(200).json(result.rows[0])
    } catch (error) {
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
}

export const updateBlog = async (req: Request<{}, {}, UpdateBlogFormData>, res: Response) => {
    try {
        const userId = (req.user as User)?.id;

        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        // Perform the update query
        const result = await client.query(
            `
            UPDATE blogs SET
            title = $1, content = $2, cover_img = $3
            WHERE owner = $4 AND id = $5
            RETURNING *;
            `,
            [
                req.body.title,
                req.body.content,
                req.file?.path,
                userId,
                req.body.id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Blog post not found or you are not authorized to update this post." });
        }

        return res.status(200).json({ message: "Blog post updated successfully", blog: result.rows[0] });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};

export const deleteBlog = async (req: Request<{ id: string }>, res: Response) => {
    const userId = (req.user as User)?.id;
    const blogId = req.params.id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is missing" });
    }

    try {
        // Delete the blog where both the blog ID and user ID match
        const result = await client.query(
            `DELETE FROM blogs WHERE id = $1 AND owner = $2`,
            [blogId, userId]
        );

        // Check if any rows were affected (i.e., if a blog was actually deleted)
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Blog post not found or you are not authorized to delete this post." });
        }

        return res.status(200).json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An unexpected error occurred" });
    }
};