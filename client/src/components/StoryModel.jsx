import { useAuth } from '@clerk/clerk-react'
import { ArrowLeft, Sparkle, Type, Upload } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const StoryModel = ({ setShowModel, fetchStories }) => {
    const bgcolors = ["#4f46e5", "#7c3aed", "#e11d48", "#ca8a04", "#FF6347"]
    const [mode, setMode] = useState("text")
    const [background, setBackground] = useState(bgcolors[0])
    const [text, setText] = useState("")
    const [media, setMedia] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const MAX_VIDEO_DURATION = 60; //seconds
    const MAX_VIDEO_SIZE_MB = 50; //MB

    const { getToken } = useAuth()

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    const cleanupPreviewUrl = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
    }

    const handleMediaUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Cleanup previous preview
        cleanupPreviewUrl()

        if (file.type.startsWith('video')) {
            if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
                toast.error(`Video file size cannot exceed ${MAX_VIDEO_SIZE_MB}MB.`)
                setMedia(null)
                return
            }
            
            const video = document.createElement('video');
            video.preload = 'metadata'
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src)
                if (video.duration > MAX_VIDEO_DURATION) {
                    toast.error("Video duration cannot exceed 1 minute.")
                    setMedia(null)
                } else {
                    setMedia(file)
                    setPreviewUrl(URL.createObjectURL(file))
                    setText('') // Fixed: empty string instead of space
                    setMode("media")
                }
            }
            video.onerror = () => {
                toast.error("Invalid video file")
                setMedia(null)
            }
            video.src = URL.createObjectURL(file);
            
        } else if (file.type.startsWith("image")) {
            setMedia(file)
            setPreviewUrl(URL.createObjectURL(file))
            setText('') // Fixed: empty string instead of space
            setMode("media")
        } else {
            toast.error("Please select an image or video file")
        }
    }

    const handleModeSwitch = () => {
        setMode('text')
        setMedia(null)
        cleanupPreviewUrl() // Cleanup URL when switching modes
    }

    const validateForm = () => {
        const media_type = mode === 'media' ? (media?.type.startsWith('image') ? 'image' : 'video') : 'text'
        
        if (media_type === 'text' && !text.trim()) {
            toast.error("Please enter some text")
            return false
        }
        
        if (media_type !== 'text' && !media) {
            toast.error("Please select a media file")
            return false
        }
        
        return true
    }

    const handleCreateStory = async () => {
        if (!validateForm()) return

        const media_type = mode === 'media' ? (media?.type.startsWith('image') ? 'image' : 'video') : 'text'

        const formData = new FormData()
        formData.append('content', text.trim())
        formData.append('media_type', media_type)
        formData.append('background_color', background)
        
        // Only append media if it exists
        if (media) {
            formData.append('media', media)
        }

        setIsLoading(true)
        
        try {
            const token = await getToken()
            const { data } = await api.post('/api/story/create', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
            
            if (data.success) {
                setShowModel(false)
                toast.success("Story created successfully!")
                fetchStories()
            } else {
                toast.error(data.message || "Failed to create story")
            }
        } catch (error) {
            console.error('Story creation error:', error)
            toast.error(error?.response?.data?.message || "Failed to create story")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='fixed inset-0 z-50 min-h-screen bg-black/80 backdrop-blur text-white flex items-center justify-center p-4'>
            <div className='w-full max-w-md'>
                <div className='text-center mb-4 flex items-center justify-between'>
                    <button 
                        className='text-white p-2 cursor-pointer hover:bg-white/10 rounded' 
                        onClick={() => setShowModel(false)}
                        disabled={isLoading}
                    >
                        <ArrowLeft />
                    </button>
                    <h2 className='text-lg font-semibold'>Create Story</h2>
                    <span className='w-10'></span>
                </div>

                <div className='rounded-lg h-96 flex items-center justify-center relative overflow-hidden' style={{ backgroundColor: background }}>
                    {mode === 'text' && (
                        <textarea 
                            className='bg-transparent text-white w-full h-full p-6 text-lg resize-none focus:outline-none placeholder-white/60' 
                            placeholder="What's on your mind?" 
                            onChange={(e) => setText(e.target.value)} 
                            value={text}
                            disabled={isLoading}
                            maxLength={500}
                        />
                    )}
                    
                    {mode === 'media' && previewUrl && (
                        media?.type.startsWith('image') ? (
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className='object-contain max-h-full max-w-full' 
                            />
                        ) : (
                            <video 
                                src={previewUrl} 
                                className='object-contain max-h-full max-w-full' 
                                controls 
                            />
                        )
                    )}
                </div>

                <div className='flex mt-4 gap-2'>
                    {bgcolors.map((color) => (
                        <button 
                            key={color} 
                            className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${background === color ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}`}
                            style={{ background: color }} 
                            onClick={() => setBackground(color)}
                            disabled={isLoading}
                        />
                    ))}
                </div>

                <div className='flex gap-2 mt-4'>
                    <button 
                        onClick={handleModeSwitch}
                        disabled={isLoading}
                        className={`flex-1 flex items-center justify-center cursor-pointer gap-2 p-2 rounded transition ${mode === 'text' ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                    >
                        <Type size={18} />
                        Text
                    </button>

                    <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer transition ${mode === 'media' ? "bg-white text-black" : 'bg-zinc-800 hover:bg-zinc-700'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input 
                            onChange={handleMediaUpload} 
                            type='file' 
                            accept='image/*,video/*' 
                            className='hidden'
                            disabled={isLoading}
                        />
                        <Upload size={18} /> 
                        Photo/Video
                    </label>
                </div>

                <button 
                    className={`flex items-center justify-center gap-2 text-white py-2.5 mt-4 mb-5 w-full rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 active:scale-95 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={handleCreateStory}
                    disabled={isLoading}
                >
                    <Sparkle size={18} />
                    {isLoading ? 'Creating...' : 'Create Story'}
                </button>
            </div>
        </div>
    )
}

export default StoryModel