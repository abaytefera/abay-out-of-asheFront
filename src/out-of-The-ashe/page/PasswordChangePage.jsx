import React, { useEffect } from 'react';
import { FooterComponent } from '../Component/FooterComponent';

import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
import PasswordChange from '../Component/AuthenticateComponent/PasswordChange';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const PasswordChangePage = () => {
  const { isAuthenticate } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticate) navigate('/loginpage');
  }, [isAuthenticate, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className='w-full min-h-screen flex flex-col bg-[#F0F4F8]'>
      <DashbordNav />
      <main className="flex-grow container mx-auto max-w-2xl pt-32 pb-20 px-4">
        <PasswordChange />
      </main>
  
    </div>
  );
};

export default PasswordChangePage;