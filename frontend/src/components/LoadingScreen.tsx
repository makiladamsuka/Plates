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
      {/* Central swirling container */}
      <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
        {/* Subtle glowing halo ring behind */}
        <div className="absolute inset-0 rounded-full bg-black/[0.03] dark:bg-white/[0.03] scale-110" />

        {/* Material You Indeterminate Swirling Spinner */}
        <svg 
          className="absolute inset-0 w-full h-full animate-material-spin pointer-events-none" 
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="text-[#1A1A1A] dark:text-zinc-100 animate-material-dash opacity-90"
          />
        </svg>

        {/* Centered App Logo */}
        <div className="w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center transition-transform animate-gentle-breathe">
          <img 
            src="/logo-light.svg" 
            alt="Plates Logo" 
            className="w-14 h-14 object-contain dark:hidden"
          />
          <img 
            src="/logo.svg" 
            alt="Plates Logo" 
            className="w-14 h-14 object-contain rounded-[22.5%] shadow-sm hidden dark:block"
          />
        </div>
      </div>

      {/* Brand Label */}
      <div className="mt-7 flex flex-col items-center gap-1">
        <h1 className="text-xl font-bold font-display tracking-tight text-[#1A1A1A] dark:text-zinc-100">
          Plates
        </h1>
        {message ? (
          <p className="text-xs font-medium text-black/50 dark:text-zinc-400 font-sans-app animate-pulse">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
};
