import React, { useState, useEffect } from 'react';
import { faBars, faTimes, faSignInAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useLocation } from 'react-router-dom';

export const NavComponent = () => {
  const [isOpen,    setIsOpen]    = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => { setIsOpen(false); }, [location]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const navLinks = [
    { to: '/', label: 'Home' },
  ];

  return (
    <>
      <header
        className={`w-full h-16 sm:h-20 fixed top-0 left-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100 transition-shadow duration-200 ${
          scrolled ? 'shadow-sm shadow-slate-200/60' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primBtn rounded-lg">
            <img
              src="https://res.cloudinary.com/dkzvlqjp9/image/upload/v1767960857/out_1_ligvau.png"
              alt="Logo"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primBtn rounded ${
                  location.pathname === to
                    ? 'text-primBtn'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </Link>
            ))}

            <Link
              to="/loginpage"
              className="inline-flex items-center gap-2 bg-primBtn hover:bg-Hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-150 shadow-sm hover:shadow-blue-200/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primBtn"
            >
              <FontAwesomeIcon icon={faSignInAlt} className="text-xs" />
              Login
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primBtn"
          >
            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className="text-lg" />
          </button>
        </div>
      </header>

      {/* Mobile menu backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel */}
      <nav
        id="mobile-menu"
        aria-label="Mobile navigation"
        className={`fixed top-16 left-0 right-0 z-50 md:hidden bg-white border-b border-slate-100 shadow-lg shadow-slate-900/5 transition-all duration-250 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                location.pathname === to
                  ? 'bg-primBtn/8 text-primBtn'
                  : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
              }`}
            >
              {label}
            </Link>
          ))}

          <div className="pt-2 pb-1">
            <Link
              to="/loginpage"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-primBtn hover:bg-Hover text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primBtn"
            >
              <FontAwesomeIcon icon={faSignInAlt} className="text-xs" />
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Spacer so page content starts below the fixed header */}
      <div className="h-16 sm:h-20" aria-hidden="true" />
    </>
  );
};