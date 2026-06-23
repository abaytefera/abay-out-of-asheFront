import React, { useEffect } from 'react';

import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
import { FooterComponent } from '../Component/FooterComponent';
import SponsorList from '../Component/AuthenticateComponent/sponsor/SponsorList';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const SponsorPage = () => {
  const { isAuthenticate } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticate) navigate('/loginpage');
  }, [isAuthenticate, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className='w-full min-h-screen flex flex-col bg-[#F0F4F8] selection:bg-sky-200'>
      <DashbordNav />
      {/* Reduced fixed padding, added responsive margin */}
      <main className="flex-grow  pt-32 pb-20 px-4 md:px-8">
        <SponsorList />
      </main>
  
    </div>
  );
};

export default SponsorPage;