import imagekit from "../configs/imagekit.js";
import fs from 'fs'
import Message from "../models/message.js";
import { populate } from "dotenv";
// Create an empty object to store the SS event connection 
const connections = {};

// controller function for the server side event endpoint
export const sseController = (req , res)=>{
    const {userId} = req.params
    console.log("New client connected :" , userId)

    // set SSE headers
    res.setHeader('Content_Type' , 'text/event-stream');
    res.setHeader('Cache-COntrol' , 'no-cache')
    res.setHeader('Connection' , 'keep-alive')
    res.setHeader('Access-Control-Allow_Origin' , '*')

    // Add the client response object to the connection object
    connections[userId] = res

    // send an initial event to the client 
    res.write('log:Connected to SSE\n\n' )

    // Handle the client disconnection
    req.on('close' , ()=>{
        // Remove the client response object from the connection array
        delete connections[userId]
        console.log('Client Disconnected')
    })
}

// Send Message
export const sendMessage = async(req , res)=>{
    try {
        const {userId} = req.auth()
        const {to_user_id , text} = req.body
        const image = req.file

        let media_url = ''
        let message_type = image ? 'image':'text'
        if(message_type === 'image'){
            const fileBuffer = fs.readFileSync(image.path)
            const response = await imagekit.upload({
                 file:fileBuffer,
            fileName : image.originalname,

            })
           media_url = imagekit.url({
            path:response.filePath,
            transformation:[
                {quality:'auto'},
                {form:'webp'},
                {width:'1280'}

            ]
           })
        }

        const message = await Message.create({
            from_user_id:userId,
            to_user_id,
            text,
            message_type,
            media_url
        })
        res.json({success:true , message})

        // send message to to_user_id using SSE
        const messageWithUserData = await Message.findById(message._id).populate('from_user_id')
       
        if(connections[to_user_id]){
            connections[to_user_id].write(`data:${JSON.stringify(messageWithUserData)}\n\n`)
        }
    } catch (error) {
        console.log(error)
        res.json({success:false , message:error.Message})
    }
}


// Get Chat Messages
export const getChatMEssages = async(req , res)=>{
    try {
        const {userId} = req.auth()
        const {to_user_id} = req.body

        const messages = await Message.find({
            $or:[
                {from_user_id:userId , to_user_id},
                {from_user_id: to_user_id , to_user_id:userId}
            ]
        }).sort({createdAt:-1})

        // Mark Message as seen
        await Message.updateMany({from_user_id:to_user_id , to_user_id:userId} , {seen:true})
        res.json({success:true , messages})

    } catch (error) {
         console.log(error)
        res.json({success:false , message:error.Message})
    }
}

export const getUserRecentMessage = async(req , res)=>{
    try {
        const {userId} = req.auth()
        const messages = await Message.find({to_user_id:userId}).populate('from_user_id to_user_id' ).sort({created_at : -1})

        res.json({success:true , messages})

    } catch (error) {
         
        res.json({success:false , message:error.Message})
    }
}