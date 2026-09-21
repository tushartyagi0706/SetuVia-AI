import React, { useEffect, useState } from 'react';
import treeImage from '../assets/tree.png';

const SplashScreen = ({ onFinish }) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const animTimer = setTimeout(() => {
      setIsAnimated(true);
    }, 300);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2800);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#031b18] transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* BRAND CONTAINER */}
      <div className="flex flex-col items-center justify-center px-4">
        
        {/* WORDMARK: SE [PALM TREE AS T] UVIA */}
        <div
          className={`font-lejour flex items-center justify-center text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-normal text-white tracking-normal transition-all duration-700 delay-200 ${
            isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <span className="leading-none select-none">SE</span>
          
          {/* PALM TREE GRAPHIC AS 'T' */}
          <div className="inline-flex items-center justify-center mx-2 sm:mx-3 md:mx-4 relative self-center">
            <img
              src={treeImage}
              alt="Setuvia Palm Tree"
              className="h-[48px] sm:h-[68px] md:h-[84px] lg:h-[104px] w-auto object-contain transition-all duration-1000 ease-out drop-shadow-md select-none"
              style={{
                transform: isAnimated ? 'scale(1)' : 'scale(1.3)',
              }}
            />
          </div>

          <span className="leading-none select-none">UVIA</span>
        </div>

        {/* TAGLINE */}
        <p
          className={`mt-6 text-[10px] sm:text-xs md:text-sm tracking-[0.35em] text-gray-200 font-sans uppercase transition-opacity duration-700 delay-500 text-center select-none ${
            isAnimated ? 'opacity-100' : 'opacity-0'
          }`}
        >
          EXPLORE&nbsp;·&nbsp;EVOLVE&nbsp;·&nbsp;EXPERIENCE
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;