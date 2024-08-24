import { Router } from "express";
import { forgotPassword, login, registerUser, resetForgottedPass, sendResetPassForm, verifyUser } from "../controller/user";

const router = Router();

router.post('/register', registerUser)

router.post('/login', login)

router.get('/verify', verifyUser)

router.post('/reset-password', forgotPassword)

router.get('/change-password', sendResetPassForm)

router.post('/insert-updated-password',resetForgottedPass)
export default router;