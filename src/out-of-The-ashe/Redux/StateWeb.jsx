import { createSlice } from "@reduxjs/toolkit";

const initialState={
ActiveChatId:null,
Onlineuser:[]

}

const WebState=createSlice({
name:'webState',
initialState,
reducers:{
    UpdateChatId:(state,action)=>{
state.ActiveChatId=action.payload

    },
    updateOnlineUser:(state,action)=>{
     state.Onlineuser=action.payload;

    }



}


})
export const {UpdateChatId,updateOnlineUser}=WebState.actions
export default WebState.reducer