import React, { useEffect } from 'react';
import { NavComponent } from '../Component/NavComponent';
import { FooterComponent } from '../Component/FooterComponent';
import LoginComponnet from '../Component/LoginComponnet';

const LoginPage = () => {
  useEffect(() => {
    // Smooth scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    // min-h-screen + flex-col ensures the page always fills the browser height
    <main className="w-full min-h-screen flex flex-col bg-[#D6E2ED] overflow-x-hidden">
      <NavComponent />

      {/* flex-grow ensures this section takes up all available space, 
        pushing the footer to the bottom.
      */}
      <section className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md animate-fadeIn">
          <LoginComponnet />
        </div>
      </section>

      <FooterComponent />
    </main>
  );
};

export default LoginPage;