import { useRef, useState, useEffect } from 'react';
import { X, Edit2, Search, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  session?: any;
}

export function NewBillModal({ isOpen, onClose, onSuccess, session: propSession }: NewBillModalProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [billName, setBillName] = useState('');
  const [tag, setTag] = useState('Restaurant');
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFriends, setUserFriends] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingLoadingFriends] = useState(false);
  const [isEditingSplits, setIsEditingSplits] = useState(false);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [userId, setUserId] = useState<string>(() => propSession?.user?.id || '');
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(() => propSession?.user?.user_metadata || null);

  useEffect(() => {
    const initUser = async () => {
      let s = propSession;
      if (!s) {
        const { data } = await supabase.auth.getSession();
        s = data.session;
      }
      if (s?.user) {
        setUserId(s.user.id);
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .eq('id', s.user.id)
            .maybeSingle();

          setCurrentUserProfile(prof || s.user.user_metadata || null);
        } catch (e) {
          console.warn('Error fetching user profile in NewBillModal:', e);
          setCurrentUserProfile(s.user.user_metadata || null);
        }
      }
    };
    initUser();
  }, [propSession, isOpen]);

  // Fetch accepted friends when modal opens or userId is available
  useEffect(() => {
    if (!userId || !isOpen) return;
    const fetchAcceptedFriends = async () => {
      setIsLoadingLoadingFriends(true);
      try {
        const { data: friendRows } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', userId)
          .or('status.eq.accepted,status.is.null');

        if (friendRows && friendRows.length > 0) {
          const friendIds = friendRows.map((f: any) => f.friend_id);
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', friendIds);
          
          setUserFriends(profs || []);
        } else {
          setUserFriends([]);
        }
      } catch (err) {
        console.error('Error fetching user friends for bill:', err);
      } finally {
        setIsLoadingLoadingFriends(false);
      }
    };
    fetchAcceptedFriends();
  }, [userId, isOpen]);

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

  const allParticipants = [
    { 
      id: userId || 'me', 
      name: 'You', 
      username: currentUserProfile?.email || '@you', 
      avatar_url: currentUserProfile?.avatar_url || currentUserProfile?.picture || null,
      color: '#E5E7EB' 
    }, 
    ...selectedFriends.map(f => ({ 
      id: f.id, 
      name: f.full_name || f.name, 
      username: f.email || '', 
      avatar_url: f.avatar_url || null,
      color: '#D9D9D9' 
    }))
  ];

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
        creatorId: userId,
        participants: splits.map(s => ({ friendId: s.id === 'me' ? userId : s.id, share: s.share }))
      });
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error creating bill:', err);
      alert(err.message || 'Failed to create bill');
    } finally {
      setIsCreating(false);
    }
  };

  // Filter user's accepted friends by search query and unselected state
  const availableFriends = userFriends
    .filter(f => !selectedFriends.some(sf => sf.id === f.id))
    .filter(f => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (f.full_name || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q);
    });

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
              <h2 className="text-[#1A1A1A] text-2xl font-bold font-display">New Bill</h2>
              <button onClick={handleClose} className="p-1 rounded-full transition-colors cursor-pointer">
                <X size={24} className="text-black" />
              </button>
            </div>

            {/* Amount Input */}
            <div className="flex justify-center items-center gap-2 mb-8 relative">
              <div className="flex items-baseline">
                <span className={`text-xl font-semibold mr-2 transition-colors ${amount ? 'text-black' : 'text-black/50'}`}>LKR</span>
                <input 
                  ref={amountInputRef}
                  type="text" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent text-black placeholder:text-black/50 text-[32px] font-semibold w-[140px] outline-none text-center"
                />
              </div>
              <button 
                onClick={() => amountInputRef.current?.focus()}
                className="absolute right-4 top-1.5 p-1.5 rounded-full transition-colors cursor-pointer"
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
                className="bg-transparent text-black placeholder:text-black/50 text-xl font-semibold text-center outline-none w-full border-b border-transparent focus:border-black/20 pb-1 transition-colors"
              />
              <button 
                onClick={() => nameInputRef.current?.focus()}
                className="absolute right-4 top-0 p-1 rounded-full transition-colors cursor-pointer"
              >
                <Edit2 size={16} className="text-black/50" />
              </button>
            </div>

            {/* Tags */}
            <div className="mb-10 pl-2">
              <h3 className="text-black text-[15px] font-medium mb-3">Select a Tag:</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTag('Restaurant')}
                  className="relative px-5 py-1.5 rounded-[30px] text-black text-[15px] font-medium transition-all bg-[#F6D6DA] cursor-pointer"
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
                  className="relative px-5 py-1.5 rounded-[30px] text-black text-[15px] font-medium transition-all bg-[#D7ECD1] cursor-pointer"
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
              className="w-full bg-[#1A1A1A] py-4 rounded-[30px] text-[#EDEDF1] text-lg font-semibold mt-auto transition-transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full flex-grow">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-[#1A1A1A] text-2xl font-bold font-display">Add Friends</h2>
              <button onClick={handleClose} className="p-1 rounded-full transition-colors cursor-pointer">
                <X size={24} className="text-black" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto overflow-x-hidden no-scrollbar pb-4 flex flex-col">
              {/* Search Bar */}
              <div className="flex justify-center mb-4 relative z-20">
                <div className="flex items-center bg-[#EDEDF1] rounded-[30px] px-4 py-2.5 w-full relative">
                  <Search size={18} className="text-black/60 mr-2 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search your friends..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-black placeholder:text-black/50 text-[15px] font-normal outline-none w-full"
                  />

                  {/* Search Dropdown Overlay */}
                  {searchQuery.trim() && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-full bg-[#EDEDF1] rounded-[20px] shadow-lg py-2 max-h-[200px] overflow-y-auto z-30 border border-black/10">
                      {availableFriends.map((friend) => (
                        <div 
                          key={friend.id} 
                          onClick={() => {
                            setSelectedFriends(prev => [...prev, friend]);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between px-4 py-2 cursor-pointer mx-1 rounded-[35px] hover:bg-zinc-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {friend.avatar_url ? (
                              <img src={friend.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#D9D9D9] shrink-0 flex items-center justify-center font-bold text-xs">
                                {(friend.full_name || 'F')[0]}
                              </div>
                            )}
                            <div className="flex flex-col truncate">
                              <span className="text-[#1A1A1A] text-xs font-semibold leading-tight truncate">{friend.full_name}</span>
                              <span className="text-black/60 text-[10px] truncate">{friend.email}</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-[#1A1A1A] bg-[#D9D9D9] px-2.5 py-1 rounded-full shrink-0 ml-2">
                            Add +
                          </span>
                        </div>
                      ))}
                      {availableFriends.length === 0 && (
                        <div className="px-4 py-3 text-center text-black/50 text-xs">No matching friends found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Friends Chips */}
              <div className="mb-4 pl-1 min-h-[70px]">
                <h3 className="text-black text-[13px] font-semibold mb-2">Selected ({selectedFriends.length}):</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {selectedFriends.length === 0 ? (
                    <span className="text-black/40 text-xs font-normal italic">Tap friends below to add them</span>
                  ) : (
                    selectedFriends.map(friend => (
                      <div key={friend.id} className="flex flex-col items-center relative shrink-0">
                        {friend.avatar_url ? (
                          <img src={friend.avatar_url} alt="" className="w-[40px] h-[40px] rounded-full object-cover mb-1" />
                        ) : (
                          <div className="w-[40px] h-[40px] rounded-full bg-[#E5E7EB] mb-1 flex items-center justify-center font-bold text-xs">
                            {(friend.full_name || 'F')[0]}
                          </div>
                        )}
                        <button 
                          onClick={() => setSelectedFriends(prev => prev.filter(sf => sf.id !== friend.id))}
                          className="absolute -top-1 -right-1 bg-[#EDEDF1] rounded-full p-0.5 border border-black/10 shadow-sm cursor-pointer"
                        >
                          <X size={10} className="text-black" />
                        </button>
                        <span className="text-[#1A1A1A] text-xs font-medium whitespace-nowrap">{(friend.full_name || '').split(' ')[0]}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Accepted Friends List */}
              <div className="flex-grow">
                <h3 className="text-black text-[13px] font-semibold mb-2 pl-1">Your Friends:</h3>
                {isLoadingFriends ? (
                  <div className="text-center py-6 text-black/50 text-xs">Loading friends...</div>
                ) : availableFriends.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {availableFriends.map((friend) => (
                      <div 
                        key={friend.id} 
                        onClick={() => setSelectedFriends(prev => [...prev, friend])}
                        className="flex items-center justify-between p-2.5 bg-[#EDEDF1] hover:bg-zinc-200 rounded-[20px] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#D9D9D9] shrink-0 flex items-center justify-center text-xs font-bold">
                              {(friend.full_name || 'F')[0]}
                            </div>
                          )}
                          <div className="flex flex-col truncate">
                            <span className="text-[#1A1A1A] text-xs font-semibold leading-tight truncate">{friend.full_name}</span>
                            <span className="text-black/60 text-[10px] truncate">{friend.email}</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#1A1A1A] bg-[#D9D9D9] px-2.5 py-1 rounded-full shrink-0">
                          Add +
                        </span>
                      </div>
                    ))}
                  </div>
                ) : userFriends.length === 0 ? (
                  <div className="text-center py-6 text-black/50 text-xs">
                    No accepted friends yet. Add friends from the Friends tab first!
                  </div>
                ) : (
                  <div className="text-center py-6 text-black/50 text-xs">
                    No matching friends found.
                  </div>
                )}
              </div>

            </div>

            {/* Next Button */}
            <button 
              onClick={() => setStep(3)}
              disabled={selectedFriends.length === 0}
              className="w-full bg-[#1A1A1A] py-4 rounded-[30px] text-[#EDEDF1] text-lg font-semibold mt-auto transition-transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full flex-grow">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#1A1A1A] text-2xl font-bold font-display">Review</h2>
              <button onClick={handleClose} className="p-1 rounded-full transition-colors cursor-pointer">
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
                    ? "bg-[#1A1A1A] text-white px-3 py-1.5 rounded-[20px] text-xs font-medium" 
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
                {splits.map(participant => {
                  const initial = (participant.name || 'U').trim()[0]?.toUpperCase() || 'U';

                  return (
                    <div key={participant.id} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 min-w-0">
                        {participant.avatar_url ? (
                          <img 
                            src={participant.avatar_url} 
                            alt={participant.name} 
                            className="w-10 h-10 rounded-full object-cover shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0 flex items-center justify-center font-bold text-xs text-zinc-800 dark:text-zinc-200">
                            {initial}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-[#1A1A1A] text-sm font-semibold leading-tight truncate">{participant.name}</span>
                          <span className="text-black/60 text-[10px] font-normal truncate">{participant.username?.split('@')[0]}</span>
                        </div>
                      </div>
                      {isEditingSplits ? (
                        <div className="flex items-center">
                          <input 
                            type="number" 
                            value={customSplits[participant.id] !== undefined ? customSplits[participant.id] : participant.share.toFixed(2)}
                            onChange={(e) => {
                              setCustomSplits(prev => ({...prev, [participant.id]: e.target.value}));
                            }}
                            className={`w-32 text-right bg-transparent border-b ${participant.isCustom ? 'border-black font-semibold' : 'border-black/20'} outline-none text-[#1A1A1A] text-base no-spinners`}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      ) : (
                        <span className="text-[#1A1A1A] text-base font-semibold whitespace-nowrap ml-2 shrink-0">
                          LKR {participant.share.toFixed(2)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total Amount */}
              <div className="mt-auto pt-6 text-center w-full border-t border-black/5">
                <div className="text-[#1A1A1A] text-2xl font-bold font-display">LKR {parsedAmount}</div>
              </div>
            </div>

            {/* Confirm Button */}
            <button 
              onClick={handleConfirm}
              disabled={isCreating}
              className={`w-full bg-[#1A1A1A] py-4 rounded-[30px] text-[#EDEDF1] text-lg font-semibold mt-6 transition-transform active:scale-[0.98] cursor-pointer ${isCreating ? 'opacity-50' : ''}`}
            >
              {isCreating ? 'Creating...' : 'Confirm'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
