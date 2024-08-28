import { Router } from "express";
import passport from "passport";
import { upload } from "../controller/multer";
import { postBlog } from "../controller/blog";

const router = Router();

router.post('/post/blog', passport.authenticate('jwt', { session: false }), upload.single('cover'), postBlog);

export default router;