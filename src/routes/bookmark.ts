import { Router } from "express";
import { addBookMark, getBookMarked, isSavedBlog } from "../controller/bookmark";
import passport from "passport";

const router = Router();

router.post('/save', passport.authenticate('jwt', { session: false }), addBookMark)

router.get('/saved', passport.authenticate('jwt', { session: false }), isSavedBlog)

router.get('/get/bookmarked', passport.authenticate('jwt', { session: false }), getBookMarked)

export default router;