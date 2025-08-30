import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios'


const initialState = {
    messages:[5]
}

export const fetchMessages = createAsyncThunk('messages/fetchMessages' , async({token , userId})=>{
    const {data} = await api.post('/api/message/get' , {to_user_id : userId} , {
        headers:{Authorization : `Bearer ${token}`}
    })
    return data.success ? data : null 
})

const messagesSlice = createSlice({
    name:'messages',
    initialState,
    reducers:{
        setMesssages: (state , action)=>{
            state.messages = action.payload
        },
        addMessages :(state , action)=>{
            state.messages = [...state.messages , action.payload]
        },
        resetMessages :(state)=>{
            state.messages = []
        }
    },
    extraReducers:(builder)=>{
        builder.addCase(fetchMessages.fulfilled, (state , action)=>{
            state.messages  = action.payload.messages
        })
    }
})

export const {setMesssages , addMessages , resetMessages} = messagesSlice.actions

export default messagesSlice.reducer