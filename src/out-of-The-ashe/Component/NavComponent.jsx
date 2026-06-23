import React, { useState } from 'react';
import { faBars, faTimes, faSignInAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

export const NavComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full h-20 fixed top-0 left-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="max-w-7xl mx-auto h-full px-6 flex justify-between items-center">
        <img src="https://res.cloudinary.com/dkzvlqjp9/image/upload/v1767960857/out_1_ligvau.png" 
             alt="Logo" className="h-10 w-auto object-contain" />

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-2xl text-slate-800">
          <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
        </button>

        <nav className={`fixed md:relative top-20 md:top-0 left-0 w-full md:w-auto bg-white md:bg-transparent p-6 md:p-0 flex flex-col md:flex-row gap-6 items-center transition-all duration-300 ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 md:translate-y-0 md:opacity-100'}`}>
          <Link to="/" className="text-slate-600 font-medium hover:text-Hover transition-colors">Home</Link>
          <Link to="/loginpage" className="bg-primBtn text-white px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-Hover shadow-md hover:shadow-blue-200 transition-all">
            <FontAwesomeIcon icon={faSignInAlt} />
            <span>Login</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};