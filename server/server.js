import express from 'express'

import cors from 'cors'

import { inngest, functions } from "./inngest/index.js"


import 'dotenv/config'
import connectDB from './configs/db.js'

const app =express()

app.use(express())

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
