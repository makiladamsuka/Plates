import React, { useRef, useState } from 'react';
import { X, Edit2, Search } from 'lucide-react';
import { api } from '../services/api';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewBillModal({ isOpen, onClose }: NewBillModalProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Restaurant');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1); // Reset step when closing so it opens back to step 1
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-[360px] bg-[#D9D9D9] rounded-[30px] p-6 relative flex flex-col">
        
        {/* Progress Bars */}
        <div className="flex gap-2 mb-6 w-full justify-center">
          <div className={`h-[5px] w-[80px] rounded-[30px] transition-colors ${step === 1 ? 'bg-[#F5C744]' : 'bg-[#1A1A1A]'}`}></div>
          <div className={`h-[5px] w-[80px] rounded-[30px] transition-colors ${step === 2 ? 'bg-[#F5C744]' : 'bg-[#1A1A1A]'}`}></div>
          <div className="h-[5px] w-[80px] bg-[#1A1A1A] rounded-[30px]"></div>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[#1A1A1A] text-2xl font-semibold font-['Sora']">New Bill</h2>
              <button onClick={handleClose} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                <X size={24} className="text-black" />
              </button>
            </div>

            {/* Amount Input */}
            <div className="flex justify-center items-center gap-2 mb-8 relative">
              <div className="flex items-baseline">
                <span className={`text-xl font-semibold font-['Sora'] mr-2 transition-colors ${amount ? 'text-black' : 'text-black/50'}`}>LKR</span>
                <input 
                  ref={amountInputRef}
                  type="text" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent text-black placeholder:text-black/50 text-[32px] font-semibold font-['Sora'] w-[120px] outline-none text-center"
                />
              </div>
              <button 
                onClick={() => amountInputRef.current?.focus()}
                className="absolute right-8 top-1.5 p-1.5 hover:bg-black/10 rounded-full transition-colors"
              >
                <Edit2 size={16} className="text-black/50" />
              </button>
            </div>

            {/* Bill Name Input */}
            <div className="flex justify-center mb-8 relative">
              <input 
                ref={nameInputRef}
                type="text" 
                placeholder="Bill Name" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent text-black placeholder:text-black/50 text-xl font-semibold font-['Sora'] text-center outline-none w-full border-b border-transparent focus:border-black/20 pb-1 transition-colors"
              />
              <button 
                onClick={() => nameInputRef.current?.focus()}
                className="absolute right-8 top-0 p-1 hover:bg-black/10 rounded-full transition-colors"
              >
                <Edit2 size={16} className="text-black/50" />
              </button>
            </div>

            {/* Tags */}
            <div className="mb-10 pl-2">
              <h3 className="text-black text-[15px] font-normal font-['Sora'] mb-3">Select a Tag:</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setCategory('Restaurant')}
                  className={`px-5 py-1.5 rounded-[30px] text-black text-[15px] font-normal font-['Sora'] transition-transform hover:scale-105 ${category === 'Restaurant' ? 'bg-[#F5C744]' : 'bg-[#F6D6DA]'}`}
                >
                  Restaurant
                </button>
                <button 
                  onClick={() => setCategory('Grocery')}
                  className={`px-5 py-1.5 rounded-[30px] text-black text-[15px] font-normal font-['Sora'] transition-transform hover:scale-105 ${category === 'Grocery' ? 'bg-[#F5C744]' : 'bg-[#D7ECD1]'}`}
                >
                  Grocery
                </button>
              </div>
            </div>

            {/* Next Button */}
            <button 
              onClick={() => setStep(2)}
              className="w-full bg-[#1A1A1A] py-4 rounded-[30px] text-[#EDEDF1] text-lg font-semibold font-['Sora'] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full flex-grow">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#1A1A1A] text-2xl font-semibold font-['Sora']">Add Friends</h2>
              <button onClick={handleClose} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                <X size={24} className="text-black" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex justify-center mb-8 relative z-20">
              <div className="flex items-center bg-[#EDEDF1] rounded-[30px] px-4 py-2.5 w-full max-w-[260px] relative">
                <Search size={18} className="text-black/60 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search Friends" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-black placeholder:text-black/50 text-[15px] font-light font-['Sora'] outline-none w-full"
                />

                {/* Search Dropdown */}
                {searchQuery && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[277px] bg-[#EDEDF1] rounded-[20px] shadow-lg py-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center px-4 py-2 hover:bg-black/5 cursor-pointer mx-2 rounded-[35px]">
                        <div className="w-8 h-8 bg-[#4C8C3C]/30 rounded-full mr-3 shrink-0"></div>
                        <div className="flex flex-col flex-grow">
                          <span className="text-[#1A1A1A] text-[10px] font-semibold font-['Sora'] leading-tight">Adhan Dilva</span>
                          <span className="text-black text-[8px] font-light font-['Sora'] mt-0.5">@adhandiva</span>
                        </div>
                        <div className="w-4 h-4 border-[1.5px] border-black rounded-full ml-2 shrink-0"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Friends */}
            <div className="mb-8 pl-2">
              <h3 className="text-black text-[15px] font-normal font-['Sora'] mb-4">Selected :</h3>
              <div className="flex gap-5">
                {/* Selected Friend 1 */}
                <div className="flex flex-col items-center relative group">
                  <div className="w-[45px] h-[45px] bg-[#4C8C3C] rounded-[15px] overflow-hidden mb-2"></div>
                  <button className="absolute -top-1.5 -right-1.5 bg-[#EDEDF1] rounded-full p-0.5 border border-black/10 shadow-sm opacity-100 transition-opacity hover:bg-white">
                    <X size={12} className="text-black" />
                  </button>
                  <span className="text-[#1A1A1A] text-sm font-normal font-['Sora']">Name</span>
                </div>
                {/* Selected Friend 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-[45px] h-[45px] bg-[#4C8C3C] rounded-[15px] overflow-hidden mb-2"></div>
                  <span className="text-[#1A1A1A] text-sm font-normal font-['Sora']">Name</span>
                </div>
              </div>
            </div>

            {/* Recent Friends */}
            <div className="mb-10 pl-2">
              <h3 className="text-black text-[15px] font-normal font-['Sora'] mb-4">Recent Friends:</h3>
              <div className="flex gap-5">
                {/* Recent Friend 1 */}
                <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-[45px] h-[45px] bg-[#4C8C3C] rounded-[15px] overflow-hidden mb-2"></div>
                  <span className="text-[#1A1A1A] text-sm font-normal font-['Sora']">Name</span>
                </div>
              </div>
            </div>

            {/* Create Button (Step 2) */}
            <button 
              onClick={async () => {
                if (isCreating) return;
                setIsCreating(true);
                try {
                  await api.createBill({
                    title: title || 'New Bill',
                    category,
                    total: parseFloat(amount) || 0,
                    status: 'Pending',
                    participants: [
                      { friendId: 'me', share: (parseFloat(amount) || 0) / 2 },
                      { friendId: 'Adhan Dilva', share: (parseFloat(amount) || 0) / 2 } // Mock friend
                    ]
                  });
                  onClose();
                } catch (error) {
                  console.error('Failed to create bill:', error);
                } finally {
                  setIsCreating(false);
                }
              }} 
              disabled={isCreating}
              className={`w-full bg-[#1A1A1A] py-4 rounded-[30px] text-[#EDEDF1] text-lg font-semibold font-['Sora'] mt-auto transition-transform hover:scale-[1.02] active:scale-[0.98] ${isCreating ? 'opacity-50' : ''}`}
            >
              {isCreating ? 'Creating...' : 'Create Bill'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
