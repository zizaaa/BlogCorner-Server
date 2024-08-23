import express, { Request, Response } from 'express'
import cors from 'cors'
import userRoutes from './routes/user'
import './config/passport.config';
import passport from 'passport';

const app = express();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Passport middleware
app.use(passport.initialize());

// validate token and return user data
app.get('/api/validate/user', passport.authenticate('jwt', { session: false }), (req:Request, res:Response) => {
    return res.status(201).json(req.user)
});

app.use('/api/user', userRoutes)

app.listen(8000,()=>{
    console.log('Server is running at port 8000')
})