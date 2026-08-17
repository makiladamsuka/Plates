import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FriendDetailProps {
  friendId: string;
  onBack: () => void;
  onBillClick?: (billId: string) => void;
}

export function FriendDetail({ friendId, onBack, onBillClick }: FriendDetailProps) {
  const [friend, setFriend] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriend = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('id', friendId)
          .single();
        
        if (error) throw error;
        setFriend(data);
      } catch (err) {
        console.error('Error fetching friend profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriend();
  }, [friendId]);

  if (loading) return <div className="min-h-screen bg-[#EDEDF1] flex items-center justify-center font-['Sora']">Loading...</div>;
  if (!friend) return null;

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-32 relative overflow-hidden">
      
      {/* Header Area */}
      <div className="pt-6 px-6 relative">
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center -ml-2 mb-4"
        >
          <ChevronLeft size={32} strokeWidth={2.5} className="text-[#1A1A1A]" />
        </button>

        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-[#1A1A1A] text-2xl font-bold font-display">{friend.full_name || friend.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              {friend.avatar_url ? (
                <img src={friend.avatar_url} alt="" className="w-[50px] h-[50px] rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-[50px] h-[50px] rounded-full bg-[#D9D9D9] opacity-30 shrink-0" />
              )}
              <span className="text-black text-[15px] font-normal">{friend.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Bills placeholder */}
      <div className="px-5 mt-8 flex flex-col gap-3">
        <div className="text-center text-black/50 mt-10">
          No shared bills with {friend.full_name?.split(' ')[0]}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] left-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative">
          <button 
            className="absolute bottom-0 right-6 w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform"
          >
            <Plus size={32} strokeWidth={2.5} className="text-[#EDEDF1]" />
          </button>
        </div>
      </div>

    </div>
  );
}
