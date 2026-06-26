import express from 'express'
import cors from 'cors'
import cookieParser  from 'cookie-parser'
import 'dotenv/config'
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoute.js';
import userRouter from './routes/userRoute.js';


const app = express();
const port = process.env.PORT || 4000 

// middleware -> all the request will be passed using middleware 
const allowedOrigins = ['http://localhost:5173',
    'https://vercel.com/httpsgithubcom123adnankhan/mern-frontend'
]
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin:allowedOrigins,credentials:true}));


app.use('/api/auth',authRouter);
app.use('/api/user',userRouter)

connectDB();  

app.get('/',(req,res)=>{
    res.send("API Working")
})
app.listen(port ,()=>console.log(`App is listening on port : ${port}`))
