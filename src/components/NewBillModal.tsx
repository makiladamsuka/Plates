import React, { useRef, useState } from 'react';
import { X, Edit2, Search } from 'lucide-react';
import { MOCK_FRIENDS } from '../data/mockData';
import type { Friend, Bill } from '../data/mockData';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBill?: (bill: Bill) => void;
}

export function NewBillModal({ isOpen, onClose, onAddBill }: NewBillModalProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [billName, setBillName] = useState('');
  const [tag, setTag] = useState('Restaurant');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  
  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1); // Reset state when closing
    setAmount('');
    setBillName('');
    setTag('Restaurant');
    setSearchQuery('');
    setSelectedFriends([]);
    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const splitAmount = (parsedAmount / (selectedFriends.length + 1)).toFixed(2);

  const handleConfirm = () => {
    if (onAddBill) {
      onAddBill({
        id: Math.random().toString(36).substring(2, 9),
        title: billName || 'New Bill',
        category: tag,
        total: parsedAmount,
        createdAt: Date.now(),
        status: 'Pending',
        participants: [
          { friendId: 'me', share: parseFloat(splitAmount) },
          ...selectedFriends.map(f => ({ friendId: f.id, share: parseFloat(splitAmount) }))
        ]
      });
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-[360px] bg-[#D9D9D9] rounded-[30px] p-6 relative flex flex-col h-[483px]">
        
        {/* Progress Bars */}
        <div className="flex gap-2 mb-6 w-full justify-center">
          <div className={`h-[5px] w-[80px] rounded-[30px] transition-colors ${step === 1 ? 'bg-[#F5C744]' : 'bg-[#1A1A1A]'}`}></div>
          <div className={`h-[5px] w-[80px] rounded-[30px] transition-colors ${step === 2 ? 'bg-[#F5C744]' : 'bg-[#1A1A1A]'}`}></div>
          <div className={`h-[5px] w-[80px] rounded-[30px] transition-colors ${step === 3 ? 'bg-[#F5C744]' : 'bg-[#1A1A1A]'}`}></div>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-full flex-grow">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[#1A1A1A] text-2xl font-semibold font-['Sora']">New Bill</h2>
              <button onClick={handleClose} className="p-1  rounded-full transition-colors">
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
                className="absolute right-8 top-1.5 p-1.5  rounded-full transition-colors"
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
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                className="bg-transparent text-black placeholder:text-black/50 text-xl font-semibold font-['Sora'] text-center outline-none w-full border-b border-transparent focus:border-black/20 pb-1 transition-colors"
              />
              <button 
                onClick={() => nameInputRef.current?.focus()}
                className="absolute right-8 top-0 p-1  rounded-full transition-colors"
              >
                <Edit2 size={16} className="text-black/50" />
              </button>
            </div>

            {/* Tags */}
            <div className="mb-10 pl-2">
              <h3 className="text-black text-[15px] font-normal font-['Sora'] mb-3">Select a Tag:</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTag('Restaurant')}
                  className={`px-5 py-1.5 rounded-[30px] text-black text-[15px] font-normal font-['Sora'] transition-all  border-2 ${tag === 'Restaurant' ? 'bg-[#F6D6DA] border-black/80 shadow-sm' : 'bg-[#F6D6DA]/50 border-transparent opacity-50 '}`}>
                  Restaurant
                </button>
                <button 
                  onClick={() => setTag('Grocery')}
                  className={`px-5 py-1.5 rounded-[30px] text-black text-[15px] font-normal font-['Sora'] transition-all  border-2 ${tag === 'Grocery' ? 'bg-[#D7ECD1] border-black/80 shadow-sm' : 'bg-[#D7ECD1]/50 border-transparent opacity-50 '}`}>
                  Grocery
                </button>
              </div>
            </div>

            {/* Next Button */}
            <button 
              onClick={() => setStep(2)}
              disabled={!amount || !billName}
              className="w-full bg-[#1A1A1A] py-4 rounded-[30px] text-[#EDEDF1] text-lg font-semibold font-['Sora'] mt-auto transition-transform  active:scale-[0.98] disabled:opacity-50 disabled:"
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
              <button onClick={handleClose} className="p-1  rounded-full transition-colors">
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
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[277px] bg-[#EDEDF1] rounded-[20px] shadow-lg py-2 max-h-[200px] overflow-y-auto">
                    {MOCK_FRIENDS.filter(f => f.id !== 'me' && (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.username.toLowerCase().includes(searchQuery.toLowerCase()))).map((friend) => {
                      const isSelected = selectedFriends.some(sf => sf.id === friend.id);
                      return (
                        <div 
                          key={friend.id} 
                          onClick={() => {
                            if (isSelected) {
                              setSelectedFriends(prev => prev.filter(sf => sf.id !== friend.id));
                            } else {
                              setSelectedFriends(prev => [...prev, friend]);
                              setSearchQuery(''); // Clear search on select
                            }
                          }}
                          className="flex items-center px-4 py-2  cursor-pointer mx-2 rounded-[35px]"
                        >
                          <div className="w-8 h-8 rounded-full mr-3 shrink-0" style={{ backgroundColor: friend.color }}></div>
                          <div className="flex flex-col flex-grow">
                            <span className="text-[#1A1A1A] text-[10px] font-semibold font-['Sora'] leading-tight">{friend.name}</span>
                            <span className="text-black text-[8px] font-light font-['Sora'] mt-0.5">{friend.username}</span>
                          </div>
                          <div className={`w-4 h-4 border-[1.5px] border-black rounded-full ml-2 shrink-0 flex items-center justify-center ${isSelected ? 'bg-black' : ''}`}>
                            {isSelected && <div className="w-2 h-2 bg-[#EDEDF1] rounded-full"></div>}
                          </div>
                        </div>
                      );
                    })}
                    {MOCK_FRIENDS.filter(f => f.id !== 'me' && (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.username.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                      <div className="px-4 py-3 text-center text-black/50 text-xs font-['Sora']">No friends found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Friends */}
            <div className="mb-8 pl-2 min-h-[90px]">
              <h3 className="text-black text-[15px] font-normal font-['Sora'] mb-4">Selected :</h3>
              <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar">
                {selectedFriends.length === 0 ? (
                  <span className="text-black/40 text-sm font-light font-['Sora'] italic mt-2">No friends selected yet</span>
                ) : (
                  selectedFriends.map(friend => (
                    <div key={friend.id} className="flex flex-col items-center relative shrink-0">
                      <div className="w-[45px] h-[45px] rounded-full overflow-hidden mb-2" style={{ backgroundColor: friend.color }}></div>
                      <button 
                        onClick={() => setSelectedFriends(prev => prev.filter(sf => sf.id !== friend.id))}
                        className="absolute -top-1.5 -right-1.5 bg-[#EDEDF1] rounded-full p-0.5 border border-black/10 shadow-sm transition-opacity "
                      >
                        <X size={12} className="text-black" />
                      </button>
                      <span className="text-[#1A1A1A] text-sm font-normal font-['Sora'] whitespace-nowrap">{friend.name.split(' ')[0]}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Friends (Mock for display) */}
            <div className="mb-10 pl-2">
              <h3 className="text-black text-[15px] font-normal font-['Sora'] mb-4">Recent Friends:</h3>
              <div className="flex gap-5 overflow-x-auto no-scrollbar">
                {MOCK_FRIENDS.filter(f => f.id !== 'me').slice(0, 3).map((friend) => {
                  const isSelected = selectedFriends.some(sf => sf.id === friend.id);
                  return (
                    <div 
                      key={`recent-${friend.id}`} 
                      onClick={() => !isSelected && setSelectedFriends(prev => [...prev, friend])}
                      className={`flex flex-col items-center cursor-pointer transition-opacity ${isSelected ? 'opacity-50 cursor-default' : ''}`}
                    >
                      <div className="w-[45px] h-[45px] rounded-full overflow-hidden mb-2" style={{ backgroundColor: friend.color }}></div>
                      <span className="text-[#1A1A1A] text-sm font-normal font-['Sora']">{friend.name.split(' ')[0]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Next Button */}
            <button 
              onClick={() => setStep(3)}
              disabled={selectedFriends.length === 0}
              className="w-full bg-[#1A1A1A] py-4 rounded-[30px] text-[#EDEDF1] text-lg font-semibold font-['Sora'] mt-auto transition-transform  active:scale-[0.98] disabled:opacity-50 disabled:"
            >
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full flex-grow">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#1A1A1A] text-2xl font-semibold font-['Sora']">Review</h2>
              <button onClick={handleClose} className="p-1  rounded-full transition-colors">
                <X size={24} className="text-black" />
              </button>
            </div>

            {/* Content Container */}
            <div className="bg-[#EDEDF1] rounded-[20px] p-5 flex flex-col items-center flex-grow overflow-y-auto relative">
              
              <div className="w-full space-y-4 mb-6">
                {/* You */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E5E7EB] rounded-full overflow-hidden shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="text-[#1A1A1A] text-sm font-semibold font-['Sora'] leading-tight">You</span>
                      <span className="text-black/60 text-[10px] font-light font-['Sora']">@you</span>
                    </div>
                  </div>
                  <span className="text-[#1A1A1A] text-base font-normal font-['Sora']">LKR {splitAmount}</span>
                </div>
                
                {/* Friends */}
                {selectedFriends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: friend.color }}></div>
                      <div className="flex flex-col">
                        <span className="text-[#1A1A1A] text-sm font-semibold font-['Sora'] leading-tight">{friend.name}</span>
                        <span className="text-black/60 text-[10px] font-light font-['Sora']">{friend.username}</span>
                      </div>
                    </div>
                    <span className="text-[#1A1A1A] text-base font-normal font-['Sora']">LKR {splitAmount}</span>
                  </div>
                ))}
              </div>

              {/* Total Amount */}
              <div className="mt-auto pt-6 text-center w-full border-t border-black/5">
                <div className="text-[#1A1A1A] text-2xl font-semibold font-['Sora']">LKR {parsedAmount}</div>
              </div>
            </div>

            {/* Confirm Button */}
            <button 
              onClick={handleConfirm}
              className="w-full bg-[#1A1A1A] py-4 rounded-[30px] text-[#EDEDF1] text-lg font-semibold font-['Sora'] mt-6 transition-transform  active:scale-[0.98]"
            >
              Confirm
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
