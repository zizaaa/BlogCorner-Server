import { Router } from "express";
import { forgotPassword, getSingleUser, handleUpdatePassword, login, registerUser, resetForgottedPass, sendResetPassForm, updateEmail, updateName, updateUserAvatar, verifyUser } from "../controller/user";
import passport from "passport";
import { upload } from "../controller/multer";

const router = Router();

router.post('/register', registerUser)

router.post('/login', login)

router.get('/verify', verifyUser)

router.post('/reset-password', forgotPassword)

router.get('/change-password', sendResetPassForm)

router.post('/insert-updated-password',resetForgottedPass)

router.get('/single/user', passport.authenticate('jwt', { session: false }), getSingleUser)

router.put('/update/name', passport.authenticate('jwt', { session: false }), updateName)

router.put('/update/email', passport.authenticate('jwt', { session: false }), updateEmail)

router.put('/update/password', passport.authenticate('jwt', { session: false }), handleUpdatePassword)

router.put('/update/avatar', passport.authenticate('jwt', { session: false }), upload.single('avatar'), updateUserAvatar)
export default router;