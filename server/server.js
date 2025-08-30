import express from 'express'

import cors from 'cors'

import { clerkMiddleware } from '@clerk/express'


import 'dotenv/config'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import postRouter from './routes/postRoutes.js'
import storyRouter from './routes/storyRoutes.js'
import messageRouter from './routes/messageRoutes.js'

import { inngest, functions } from "./inngest/index.js"
import {serve} from 'inngest/express'


const app =express()

app.use(express.json())

app.use(cors())

// clerk middleware
app.use(clerkMiddleware())

// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

// router

app.use('/api/user' , userRouter)
app.use('/api/post' , postRouter)
app.use('/api/story' , storyRouter)
app.use('/api/message' , messageRouter)


await connectDB()

app.get('/', (req,res)=>{
    res.send("Server is running ....")

})



const PORT  = process.env.PORT || 5003

app.listen(PORT , ()=>{
    console.log("Server is running at : " , PORT)
})
