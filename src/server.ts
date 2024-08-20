import express from 'express'
import cors from 'cors'
import { createTables, createUserTable } from './tables/userTable';
import userRoutes from './routes/user'
const app = express();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/user', userRoutes)

app.listen(8000,()=>{
    console.log('Server is running at port 8000')
})