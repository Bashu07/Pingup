import React, { useState,useEffect } from 'react'
import { assets, dummyPostsData } from '../assets/assets'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import RecentMessages from '../components/RecentMessages'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'

const Feed = () => {

    const [feeds , setFeeds] = useState([])
    const [loading ,setLoading] = useState()

    const {getToken} = useAuth()

    const fetchFeeds = async()=>{
        try {
          const {data} = await api.get('/api/post/feed' , {headers:{
            Authorization:`Bearer ${await getToken()}`
          }})
          if(data.success){
            setFeeds(data.posts)
          }else{
            toast.error(data.message)
          }
        } catch (error) {
            toast.error(error.message)
          
        }
        setLoading(false)
    }
    useEffect(()=>{
        fetchFeeds()
    },[])


  return !loading ? (
    <div className='h-full overflow-y-scrollbar no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8 '>
        {/* stories and post */}
        <div>
          
            <StoriesBar/>
            <div className='p-4 space-y-6'>
              {feeds.map((post)=>(
                <PostCard key={post._id} post={post}/>
              ))}

            </div>
        </div>



        {/* Right sidebar */}
        <div className='max-xl:hidden sticky top-0'>
          
            <div className='max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow'>
              <h2 className='text-slate-800 font-semibold'>Sponsered</h2>
              <img src={assets.sponsored_img} className='w-75 h-50 rounded-md' alt="" />
              <p className='text-slate-600 '>Email Marketing</p>
              <p className='text-slate-400'>Supercharge your marketing with a powerful easy-to-use platform built for result  </p>
                
            </div>
             <RecentMessages/>
        </div>
       

    </div>
  )
  :
  <Loading/>
}

export default Feed