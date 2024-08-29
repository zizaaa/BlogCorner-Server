import { Router } from "express";
import passport from "passport";
import { upload } from "../controller/multer";
import { getBlogs, getSingleBlog, handleDownvote, handleUpvote, postBlog } from "../controller/blog";

const router = Router();

router.post('/post/blog', passport.authenticate('jwt', { session: false }), upload.single('cover'), postBlog);

router.get('/get/blogs', getBlogs)

router.get('/get/single/blog/:id', getSingleBlog)

router.post('/upvote/blog', passport.authenticate('jwt', { session: false }), handleUpvote)

router.post('/downvote/blog', passport.authenticate('jwt', { session: false }), handleDownvote)
export default router;