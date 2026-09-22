import React from 'react';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message,
  className = ''
}) => {
  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#EDEDF1] dark:bg-zinc-950 transition-colors duration-300 select-none ${className}`}
    >
      <div className="flex flex-col items-center">
        {/* Large Centered App Logo with subtle breathe motion */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center transition-transform animate-gentle-breathe">
          <img 
            src="/logo-light.svg" 
            alt="Plates Logo" 
            className="w-full h-full object-contain dark:hidden drop-shadow-sm"
          />
          <img 
            src="/logo.svg" 
            alt="Plates Logo" 
            className="w-full h-full object-contain rounded-[22.5%] shadow-md hidden dark:block"
          />
        </div>

        {/* Prominent Brand Title */}
        <h1 className="mt-5 text-4xl sm:text-5xl font-black font-display tracking-tight text-[#1A1A1A] dark:text-zinc-100">
          Plates
        </h1>

        {/* Material 3 Horizontal Indeterminate Progress Bar */}
        <div className="mt-8 w-44 sm:w-52 h-1 bg-black/10 dark:bg-white/15 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 bg-[#1A1A1A] dark:bg-zinc-100 rounded-full animate-m3-bar1" />
          <div className="absolute top-0 bottom-0 bg-[#1A1A1A] dark:bg-zinc-100 rounded-full animate-m3-bar2" />
        </div>

        {/* Optional Status Message */}
        {message ? (
          <p className="mt-3 text-xs font-medium text-black/50 dark:text-zinc-400 font-sans-app animate-pulse">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
};

