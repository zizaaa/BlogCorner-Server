import { Router } from "express";
import passport from "passport";
import { upload } from "../controller/multer";
import { checkIsVoted, deleteBlog, getBlogs, getPostedBlogs, getSingleBlog, getSingleOwnedBlog, getTopBlogs, handleDownvote, handleGetVotes, handleUpvote, postBlog, updateBlog, updateBlogWithExistingImage } from "../controller/blog";

const router = Router();

router.post('/post/blog', passport.authenticate('jwt', { session: false }), upload.single('cover'), postBlog);

router.get('/get/blogs', getBlogs)

router.get('/get/single/blog/:id', getSingleBlog)

router.post('/upvote/blog', passport.authenticate('jwt', { session: false }), handleUpvote)

router.post('/downvote/blog', passport.authenticate('jwt', { session: false }), handleDownvote)

router.get('/get/votes', handleGetVotes)

router.get('/get/isvoted', checkIsVoted)

router.get('/get/popular', passport.authenticate('jwt', { session: false }), getTopBlogs)

router.get('/get/all/posted', passport.authenticate('jwt', { session: false }), getPostedBlogs)

router.get('/get/single/posted/:id', passport.authenticate('jwt', { session: false }), getSingleOwnedBlog)

router.put('/update', passport.authenticate('jwt', { session: false }), upload.single('cover'), updateBlog)

router.put('/update/2', passport.authenticate('jwt', { session: false }), updateBlogWithExistingImage)

router.delete('/delete/:id', passport.authenticate('jwt', { session: false }), deleteBlog)
export default router;