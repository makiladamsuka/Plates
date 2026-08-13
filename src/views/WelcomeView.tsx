import React from 'react';
import { ArrowRight } from 'lucide-react';

interface WelcomeViewProps {
  onEnter: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onEnter }) => {
  return (
    <div className="bg-[#ededf1] min-h-screen relative font-['Sora'] flex flex-col items-center justify-center p-[25px]">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <h1 className="text-[64px] font-bold text-[#1a1a1a] tracking-tight mb-[10px]">
          Plates
        </h1>
        <p className="text-[18px] text-[#1a1a1a]/70 text-center mb-[40px] max-w-[250px]">
          Split bills seamlessly with your friends.
        </p>
      </div>

      <button
        onClick={onEnter}
        className="w-full bg-[#1a1a1a] text-[#ededf1] rounded-[30px] h-[60px] flex items-center justify-center gap-[10px] text-[18px] font-bold active:scale-[0.99] transition-transform mb-[40px] shadow-xl"
      >
        <span>Get Started</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
