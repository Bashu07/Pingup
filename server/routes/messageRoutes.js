import express from 'express'
import { getChatMEssages, sendMessage, sseController } from '../controllers/messageController.js'
import { upload } from '../configs/multer.js'
import { protect } from '../middlewares/auth.js'
const messageRouter = express.Router()

messageRouter.get('/:userId' , sseController)
messageRouter.post('/send' ,upload.single('image'),protect, sendMessage)
messageRouter.post('/get' ,protect, getChatMEssages)

export default messageRouter