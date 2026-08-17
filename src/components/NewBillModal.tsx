import React, { useRef, useState, useEffect } from 'react';
import { X, Edit2, Search, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewBillModal({ isOpen, onClose, onSuccess }: NewBillModalProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [billName, setBillName] = useState('');
  const [tag, setTag] = useState('Restaurant');
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isEditingSplits, setIsEditingSplits] = useState(false);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
  }, []);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const parsedAmount = parseInt(amount) || 0;

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setAmount('');
    setBillName('');
    setTag('Restaurant');
    setSelectedFriends([]);
    setSearchQuery('');
    setIsEditingSplits(false);
    setCustomSplits({});
    onClose();
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const allParticipants = [{ id: userId, name: 'You', username: '@you', color: '#E5E7EB' }, ...selectedFriends.map(f => ({ id: f.id, name: f.full_name || f.name, username: f.email || '', color: '#D9D9D9' }))];

  // Calculate dynamic splits
  const calculateSplits = () => {
    let customTotal = 0;
    let customCount = 0;
    
    for (const id in customSplits) {
      const val = parseFloat(customSplits[id]);
      if (!isNaN(val) && customSplits[id] !== '') {
        customTotal += val;
        customCount++;
      }
    }
    
    const remainingTotal = Math.max(0, parsedAmount - customTotal);
    const remainingParticipantsCount = Math.max(1, allParticipants.length - customCount);
    const equalShare = remainingTotal / remainingParticipantsCount;
    
    return allParticipants.map(p => {
      const customVal = customSplits[p.id];
      const isCustom = customVal !== undefined && customVal !== '';
      const shareValue = isCustom ? parseFloat(customVal) || 0 : equalShare;
      return { ...p, share: shareValue, isCustom };
    });
  };

  const splits = calculateSplits();

  const handleConfirm = async () => {
    setIsCreating(true);
    try {
      await api.createBill({
        title: billName || 'New Bill',
        category: tag || 'Other',
        total: parsedAmount,
        participants: splits.map(s => ({ friendId: s.id, share: s.share }))
      });
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error creating bill:', err);
      alert('Failed to create bill');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-[400px] bg-[#D9D9D9] rounded-[30px] p-6 relative flex flex-col min-h-[483px] max-h-[90vh]">
        
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
                  className="relative px-5 py-1.5 rounded-[30px] text-black text-[15px] font-normal font-['Sora'] transition-all bg-[#F6D6DA]"
                >
                  Restaurant
                  {tag === 'Restaurant' && (
                    <div className="absolute -bottom-1.5 -right-1.5 bg-[#EDEDF1] rounded-full p-[1px]">
                      <CheckCircle2 size={16} className="fill-black text-[#EDEDF1]" />
                    </div>
                  )}
                </button>
                <button 
                  onClick={() => setTag('Grocery')}
                  className="relative px-5 py-1.5 rounded-[30px] text-black text-[15px] font-normal font-['Sora'] transition-all bg-[#D7ECD1]"
                >
                  Grocery
                  {tag === 'Grocery' && (
                    <div className="absolute -bottom-1.5 -right-1.5 bg-[#EDEDF1] rounded-full p-[1px]">
                      <CheckCircle2 size={16} className="fill-black text-[#EDEDF1]" />
                    </div>
                  )}
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
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-[#1A1A1A] text-2xl font-semibold font-['Sora']">Add Friends</h2>
              <button onClick={handleClose} className="p-1  rounded-full transition-colors">
                <X size={24} className="text-black" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto overflow-x-hidden no-scrollbar pb-4 flex flex-col">
              {/* Search Bar */}
              <div className="flex justify-center mb-8 relative z-20">
              <div className="flex items-center bg-[#EDEDF1] rounded-[30px] px-4 py-2.5 w-full max-w-[260px] relative">
                <Search size={18} className="text-black/60 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search Friends" 
                  value={searchQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    setSearchQuery(q);
                    if (q.trim().length >= 1) {
                      supabase
                        .from('profiles')
                        .select('id, full_name, email, avatar_url')
                        .neq('id', userId)
                        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
                        .limit(10)
                        .then(({ data }) => setSearchResults(data || []));
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  className="bg-transparent text-black placeholder:text-black/50 text-[15px] font-light font-['Sora'] outline-none w-full"
                />

                {/* Search Dropdown */}
                {searchQuery && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[277px] bg-[#EDEDF1] rounded-[20px] shadow-lg py-2 max-h-[200px] overflow-y-auto">
                    {searchResults.filter(f => !selectedFriends.some(sf => sf.id === f.id)).map((friend) => {
                      return (
                        <div 
                          key={friend.id} 
                          onClick={() => {
                            setSelectedFriends(prev => [...prev, friend]);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="flex items-center px-4 py-2  cursor-pointer mx-2 rounded-[35px]"
                        >
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt="" className="w-8 h-8 rounded-full mr-3 shrink-0 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full mr-3 shrink-0 bg-[#D9D9D9]"></div>
                          )}
                          <div className="flex flex-col flex-grow">
                            <span className="text-[#1A1A1A] text-[10px] font-semibold font-['Sora'] leading-tight">{friend.full_name}</span>
                            <span className="text-black text-[8px] font-light font-['Sora'] mt-0.5">{friend.email}</span>
                          </div>
                        </div>
                      );
                    })}
                    {searchResults.filter(f => !selectedFriends.some(sf => sf.id === f.id)).length === 0 && (
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
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt="" className="w-[45px] h-[45px] rounded-full object-cover mb-2" />
                      ) : (
                        <div className="w-[45px] h-[45px] rounded-full bg-[#D9D9D9] mb-2"></div>
                      )}
                      <button 
                        onClick={() => setSelectedFriends(prev => prev.filter(sf => sf.id !== friend.id))}
                        className="absolute -top-1.5 -right-1.5 bg-[#EDEDF1] rounded-full p-0.5 border border-black/10 shadow-sm transition-opacity "
                      >
                        <X size={12} className="text-black" />
                      </button>
                      <span className="text-[#1A1A1A] text-sm font-normal font-['Sora'] whitespace-nowrap">{(friend.full_name || '').split(' ')[0]}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Friends - hidden when using real data */}

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
              
              {/* Edit Splits Button */}
              <button 
                onClick={() => setIsEditingSplits(!isEditingSplits)}
                className={`absolute top-2 right-4 transition-all z-10 ${
                  isEditingSplits 
                    ? "bg-[#1A1A1A] text-white px-3 py-1.5 rounded-[20px] text-xs font-medium font-['Sora']" 
                    : "p-1 rounded-full hover:bg-black/5"
                }`}
              >
                {isEditingSplits ? (
                  "Done"
                ) : (
                  <Edit2 size={16} className="text-black/50" />
                )}
              </button>

              <div className="w-full space-y-4 mb-6 mt-4">
                {splits.map(participant => (
                  <div key={participant.id} className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#D9D9D9]"></div>
                      <div className="flex flex-col">
                        <span className="text-[#1A1A1A] text-sm font-semibold font-['Sora'] leading-tight">{participant.name}</span>
                        <span className="text-black/60 text-[10px] font-light font-['Sora']">{participant.username}</span>
                      </div>
                    </div>
                    {isEditingSplits ? (
                      <div className="flex items-center">
                        <span className="text-[#1A1A1A] text-base font-normal font-['Sora'] mr-1">LKR</span>
                        <input 
                          type="number" 
                          value={customSplits[participant.id] !== undefined ? customSplits[participant.id] : participant.share.toFixed(2)}
                          onChange={(e) => {
                            setCustomSplits(prev => ({...prev, [participant.id]: e.target.value}));
                          }}
                          className={`w-24 text-right bg-transparent border-b ${participant.isCustom ? 'border-black font-semibold' : 'border-black/20'} outline-none text-[#1A1A1A] text-base font-['Sora'] no-spinners`}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    ) : (
                      <span className="text-[#1A1A1A] text-base font-normal font-['Sora']">
                        LKR {participant.share.toFixed(2)}
                      </span>
                    )}
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
              disabled={isCreating}
              className={`w-full bg-[#1A1A1A] py-4 rounded-[30px] text-[#EDEDF1] text-lg font-semibold font-['Sora'] mt-6 transition-transform  active:scale-[0.98] ${isCreating ? 'opacity-50' : ''}`}
            >
              {isCreating ? 'Creating...' : 'Confirm'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
