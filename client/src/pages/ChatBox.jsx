import React, { useEffect, useRef, useState } from 'react'
import { dummyMessagesData, dummyUserData } from '../assets/assets'
import { ImageIcon, SendHorizonal } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import { addMessages, fetchMessages, resetMessages } from '../features/messages/messageSlice'
import toast from 'react-hot-toast'

const ChatBox = () => {
  const {messages} = useSelector((state)=>state.messages)
  const {userId} = useParams()
  const {getToken} = useAuth()
  const dispatch = useDispatch()

  const [text, setText] = useState('')
  const [image, setImages] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const {connections} = useSelector((state)=>state.connections)

  const fetchUserMessages = async()=>{
    try {
      const token = await getToken()
      dispatch(fetchMessages({token , userId}))
    } catch (error) {
      toast.error(error.message)
    }
  }

  const sendMessage = async () => {
    try {
      if(!text && !image) return

      const token = await getToken()
      const formData = new FormData()
      formData.append('to_user_id' , userId)
      formData.append('text' , text)
      image && formData.append('image' , image)

      const {data} = await api.post('/api/message/send' , formData,{
        headers:{Authorization:`Bearer ${token}`}
      })

      if(data.success){
        setText('')
        setImages(null)
        dispatch(addMessages(data.message))
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Create placeholder user if not found
  const createPlaceholderUser = () => {
    return {
      _id: userId,
      full_name: 'Unknown User',
      user_name: 'unknown',
      username: 'unknown', 
      profile_picture: '/default-avatar.png',
      bio: 'User information not available'
    }
  }

  useEffect(()=>{
    fetchUserMessages()
    return ()=>{
      dispatch(resetMessages())
    }
  },[userId])

  useEffect(()=>{
    if(connections && connections.length > 0){
      const foundUser = connections.find(connection=>connection._id === userId)
      if (foundUser) {
        setUser(foundUser)
      } else {
        // User not found in connections, create placeholder
        setUser(createPlaceholderUser())
      }
    } else {
      // No connections available, create placeholder
      setUser(createPlaceholderUser())
    }
    setLoading(false)
  }, [connections, userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Show loading state while user data is being set
  if (loading || !user) {
    return (
      <div className='flex flex-col h-screen'>
        <div className='flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300'>
          <div className='size-8 rounded-full bg-gray-200 animate-pulse'></div>
          <div>
            <div className='h-4 w-24 bg-gray-200 rounded animate-pulse mb-1'></div>
            <div className='h-3 w-16 bg-gray-200 rounded animate-pulse'></div>
          </div>
        </div>
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-gray-500'>Loading chat...</div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-screen'>
      <div className='flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300'>
        <img 
          src={user?.profile_picture || '/default-avatar.png'} 
          className='size-8 rounded-full object-cover' 
          alt={user?.full_name || 'User'} 
          onError={(e) => {
            e.target.src = '/default-avatar.png'
          }}
        />
        <div>
          <p className='font-medium'>{user?.full_name || 'Unknown User'}</p>
          <p className='text-sm text-gray-500 -mt-1.5'>
            @{user?.user_name || user?.username || 'unknown'}
          </p>
        </div>
      </div>

      <div className='p-5 md:px-10 h-full overflow-y-scroll'>
        <div className='space-y-4 max-w-4xl mx-auto'>
          {messages && messages.length > 0 ? (
            messages
              .toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((message, index) => (
                <div key={message._id || index} className={`flex flex-col ${message.to_user_id !== user._id ? 'items-start' : 'items-end'}`}>
                  <div className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${message.to_user_id !== user._id ? 'rounded-bl-none' : 'rounded-br-none'}`}>
                    {message.message_type === "image" && message.media_url && (
                      <img 
                        src={message.media_url} 
                        className="w-full max-w-sm rounded-lg mb-1" 
                        alt="Shared image"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                  </div>
                </div>
              ))
          ) : (
            <div className='text-center text-gray-500 mt-10'>
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className='px-4'>
        <div className='flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5'>
          <input 
            type="text" 
            className='flex-1 outline-none text-slate-700' 
            placeholder='Type a message'
            onKeyDown={e=> e.key === "Enter" && sendMessage()} 
            onChange={(e)=>setText(e.target.value)} 
            value={text} 
          />
          <label htmlFor="image"> 
            {image ? (
              <img 
                src={URL.createObjectURL(image)} 
                className='h-8 rounded object-cover' 
                alt="Preview" 
              />
            ) : (
              <ImageIcon className='size-7 text-gray-400 cursor-pointer' />
            )}
            <input 
              type="file" 
              id='image' 
              accept='image/*' 
              hidden 
              onChange={(e)=>setImages(e.target.files[0])}  
            />
          </label>
          <button 
            onClick={sendMessage} 
            disabled={!text && !image}
            className='bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 transition text-white font-medium p-2 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <SendHorizonal size={18}/>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatBox