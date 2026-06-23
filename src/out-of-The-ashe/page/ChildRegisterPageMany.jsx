import React, { useEffect } from 'react';

import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
import { FooterComponent } from '../Component/FooterComponent';
import ChildSingle from '../Component/AuthenticateComponent/ChildSingle';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const ChildRegisterPageMany = () => {
  const { isAuthenticate } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticate) navigate('/loginpage');
  }, [isAuthenticate, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className='w-full min-h-screen flex flex-col bg-white'>
      <DashbordNav />
      <main className="flex-grow pt-28 pb-20">
        <ChildSingle />
      </main>
   
    </div>
  );
};

export default ChildRegisterPageMany;