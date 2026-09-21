import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/logo.png';

export default function Navbar() {
  return (
    <header className="w-full bg-[#f6f4ee] border-b border-gray-200/50 py-3 px-6 md:px-12 flex items-center justify-between">
      {/* LEFT: LOGO.PNG + BRAND NAME */}
      <Link to="/" className="flex items-center gap-3 no-underline">
        {/* Aapka assets/logo.png yahan load hoga */}
        <img 
          src={logoImage} 
          alt="SETUVIA Logo" 
          className="h-10 w-auto object-contain" 
        />
        
        <div className="flex flex-col">
          <span className="font-lejour text-xl md:text-2xl font-bold tracking-wider text-[#031b18] leading-tight">
            SETUVIA
          </span>
          <span className="text-[8px] md:text-[9px] tracking-[0.25em] text-gray-600 uppercase font-sans">
            EXPLORE &nbsp;·&nbsp; EVOLVE &nbsp;·&nbsp; EXPERIENCE
          </span>
        </div>
      </Link>

      {/* RIGHT: NAVIGATION LINKS */}
      <nav className="flex items-center gap-6">
        <Link to="/" className="text-sm font-medium text-gray-800 hover:text-black">
          Home
        </Link>
        <Link to="/stays" className="text-sm font-medium text-gray-800 hover:text-black flex items-center gap-1">
          <span>Stays</span>
          <span className="rounded-full bg-pine/10 px-1.5 py-0.5 text-[9px] font-bold text-pine uppercase">New</span>
        </Link>
        <Link to="/plan" className="text-sm font-medium text-gray-800 hover:text-black">
          Plan
        </Link>
        <Link 
          to="/plan" 
          className="bg-black text-white text-xs md:text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all"
        >
          Plan My Trip
        </Link>
      </nav>
    </header>
  );
}