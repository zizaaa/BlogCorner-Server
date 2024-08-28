import express, { Request, Response } from 'express'
import cors from 'cors'
import userRoutes from './routes/user'
import blogRoutes from './routes/blog'
import './config/passport.config';
import passport from 'passport';
import path from 'path'

const app = express();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))

// Initialize Passport middleware
app.use(passport.initialize());

// validate token and return user data
app.get('/api/validate/user', passport.authenticate('jwt', { session: false }), (req:Request, res:Response) => {
    return res.status(201).json(req.user)
});


app.use('/api/user', userRoutes)
app.use('/api/blogs', blogRoutes)

app.listen(8000,()=>{
    console.log('Server is running at port 8000')
})