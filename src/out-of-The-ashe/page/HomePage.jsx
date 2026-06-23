import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { NavComponent } from '../Component/NavComponent';

import { HeroComponent } from '../Component/HomeComponent.jsx/HeroComponent';
import { OurServiceComponent } from '../Component/HomeComponent.jsx/OurServiceComponent';

import FounderComponent from '../Component/HomeComponent.jsx/FounderComponent';

import { FooterComponent } from '../Component/FooterComponent';

const HomePage = () => {
  const { isAuthenticate } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isAuthenticate) navigate('/DashboardPage');
  }, [isAuthenticate, navigate]);

  return (
    <main className="w-full min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      <NavComponent />
      <HeroComponent />
      <div className="flex flex-col gap-32 md:gap-48 pb-20">
        <OurServiceComponent />
        <FounderComponent />
      </div>
      <FooterComponent />
    </main>
  );
};

export default HomePage;