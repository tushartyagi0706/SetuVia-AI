import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import LanguageSelector from './LanguageSelector.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <header className="w-full bg-[#f6f4ee] border-b border-sand/60 py-3 px-6 md:px-12 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* LEFT: LOGO.PNG + BRAND NAME */}
      <Link to="/" className="flex items-center gap-3 no-underline">
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

      {/* RIGHT: NAVIGATION LINKS + LANGUAGE SELECTOR + HOST CTA */}
      <nav className="flex items-center gap-4 md:gap-6">
        <Link to="/" className="text-sm font-medium text-gray-800 hover:text-black hidden sm:block">
          {t("nav_home")}
        </Link>
        <Link to="/stays" className="text-sm font-medium text-gray-800 hover:text-black flex items-center gap-1">
          <span>{t("nav_stays")}</span>
          <span className="rounded-full bg-pine/10 px-1.5 py-0.5 text-[9px] font-bold text-pine uppercase">New</span>
        </Link>
        <Link to="/plan" className="text-sm font-medium text-gray-800 hover:text-black hidden sm:block">
          {t("nav_plan")}
        </Link>
        <Link 
          to="/host" 
          className="text-xs md:text-sm font-semibold text-pine hover:text-pine-dark border border-pine/30 rounded-full px-3.5 py-1.5 bg-pine/5 hover:bg-pine/10 transition"
        >
          {t("nav_for_hosts")}
        </Link>
        <LanguageSelector compact />
        <Link 
          to="/plan" 
          className="bg-black text-white text-xs md:text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-800 transition-all hidden md:block"
        >
          {t("cta_plan")}
        </Link>
      </nav>
    </header>
  );
}