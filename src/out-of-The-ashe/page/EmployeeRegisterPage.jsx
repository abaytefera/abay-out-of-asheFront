import React, { useEffect } from 'react';

import DashbordNav from '../Component/AuthenticateComponent/DashboardComponent/DashbordNav';
import { FooterComponent } from '../Component/FooterComponent';
import EmployeeRegister from '../Component/AuthenticateComponent/EmployeeRegister';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const EmployeeRegisterPage = () => {
  const { isAuthenticate } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticate) {
      navigate('/loginpage');
    }
  }, [isAuthenticate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className='w-full min-h-screen flex flex-col bg-[#D6E2ED] selection:bg-sky-200'>
      <DashbordNav />
      {/* Content Area */}
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <EmployeeRegister />
      </main>
   
    </div>
  );
};

export default EmployeeRegisterPage;