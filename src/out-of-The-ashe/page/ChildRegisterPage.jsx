import React, { useEffect } from 'react'

import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav'
import { FooterComponent } from '../Component/FooterComponent'

import RegisterChild from '../Component/AuthenticateComponent/ChildRegisterComponent/RegisterChild'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'


const ChildRegisterPage = () => {
   const {isAuthenticate}=useSelector((state)=>state.auth);
    const navigate=useNavigate()
   useEffect(()=>{
  
  
      if(!isAuthenticate){
   
        navigate('/loginpage');
  
      }
    },[isAuthenticate])
      useEffect(()=>{
    
        window.scrollTo(0,0)
    
      },[])
  return (
    <div className='w-full overflow-x-hidden relative min-h-screen flex flex-col  bg-[#D6E2ED] gap-[10px]   pt-30'>
      <DashbordNav></DashbordNav>

     <RegisterChild ></RegisterChild>
        
    </div>
  )
}

export default ChildRegisterPage;
