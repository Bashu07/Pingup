import express from 'express'

import cors from 'cors'

import { inngest, functions } from "./inngest/index.js"
import {serve} from 'inngest/express'

import 'dotenv/config'
import connectDB from './configs/db.js'

const app =express()

app.use(express.json())

app.use(cors())

// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

await connectDB()

app.get('/', (req,res)=>{
    res.send("Server is running ....")

})
const PORT  = process.env.PORT || 5003

app.listen(PORT , ()=>{
    console.log("Server is running at : " , PORT)
})
