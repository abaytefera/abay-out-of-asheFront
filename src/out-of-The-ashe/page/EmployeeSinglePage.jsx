import React, { useEffect } from 'react';

import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
import { FooterComponent } from '../Component/FooterComponent';

import EmployeeProfile from '../Component/AuthenticateComponent/EmployeeProfile/EmployeeProfile';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const EmployeeSinglePage = () => {
  const { isAuthenticate } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticate) navigate('/loginpage');
  }, [isAuthenticate, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className='w-full min-h-screen flex flex-col bg-[#F1F5F9]'>
      <DashbordNav />
      <main className="flex-grow pt-32 pb-20 px-4">
        <EmployeeProfile />
      </main>
  
    </div>
  );
};

export default EmployeeSinglePage;