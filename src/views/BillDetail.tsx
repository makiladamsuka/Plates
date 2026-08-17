import React, { useState } from 'react';
import { ConfirmTransferModal } from '../components/ConfirmTransferModal';
import { ChevronLeft } from 'lucide-react';
import { MOCK_FRIENDS } from '../data/mockData';
import type { Bill } from '../data/mockData';

interface BillDetailProps {
  onBack: () => void;
  onSettle?: () => void;
  bill?: Bill;
}

const getTagColor = (category: string) => {
  switch (category) {
    case 'Restaurant':    return { bg: '#F6D6DA', text: '#7C3040' };
    case 'Grocery':       return { bg: '#D7ECD1', text: '#2D6A4F' };
    case 'Entertainment': return { bg: '#CDE1FF', text: '#1B4F8A' };
    default:              return { bg: '#E5E5EA', text: '#555' };
  }
};

const formatTime = (ts: number) => {
  const date = new Date(ts);
  const now  = new Date();
  if (date.toDateString() === now.toDateString()) {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `Today · ${hours}${ampm}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getFriendName = (friendId: string) => {
  if (friendId === 'me') return 'You';
  const friend = MOCK_FRIENDS.find(f => f.id === friendId);
  return friend?.name ?? friendId;
};

const getFriendColor = (friendId: string) => {
  if (friendId === 'me') return '#E5E5EA';
  return MOCK_FRIENDS.find(f => f.id === friendId)?.color ?? '#D9D9D9';
};

export function BillDetail({ onBack, onSettle, bill }: BillDetailProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  if (!bill) return null;

  const myShare = bill.participants.find(p => p.friendId === 'me')?.share ?? 0;
  const tag = getTagColor(bill.category);

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-44 font-['Sora']">

      {/* ── Top Bar ── */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.10)]
                     flex items-center justify-center shrink-0 cursor-pointer
                     active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="text-[#1A1A1A] ml-[-1px]" />
        </button>
        <h1 className="text-[18px] font-semibold text-[#1A1A1A] truncate flex-1">
          {bill.title}
        </h1>
        <span
          className={`shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full
                      ${bill.status === 'Pending'
                        ? 'bg-[#F5C744]/20 text-[#7A5C00]'
                        : 'bg-[#4C8C3C]/15 text-[#2D5A26]'}`}
        >
          {bill.status}
        </span>
      </div>

      <div className="px-4 max-w-[480px] mx-auto flex flex-col gap-3">

        {/* ── Meta Card ── */}
        <div className="bg-white rounded-[20px] px-5 py-4 shadow-[0_1px_6px_rgba(0,0,0,0.07)]
                        flex justify-between items-center">
          <div className="flex flex-col gap-1.5">
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full w-fit"
              style={{ backgroundColor: tag.bg, color: tag.text }}
            >
              {bill.category}
            </span>
            <span className="text-[12px] text-[#1A1A1A]/40">
              {formatTime(bill.createdAt)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#1A1A1A]/40 mb-0.5">Total</p>
            <p className="text-[28px] font-bold text-[#1A1A1A] tracking-tight leading-none">
              LKR {bill.total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── Split Section ── */}
        <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.07)]">
          <div className="px-5 pt-4 pb-2">
            <p className="text-[12px] font-semibold text-[#1A1A1A]/40 uppercase tracking-wider">
              Split
            </p>
          </div>

          {bill.participants.length === 0 && (
            <div className="px-5 pb-4 text-[13px] text-[#1A1A1A]/40">
              No participants listed.
            </div>
          )}

          {bill.participants.map((p, i) => {
            const name  = getFriendName(p.friendId);
            const color = getFriendColor(p.friendId);
            const isLast = i === bill.participants.length - 1;
            return (
              <div key={i}>
                <div className="px-5 py-3 flex items-center justify-between gap-3">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full shrink-0 opacity-60"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[14px] font-medium text-[#1A1A1A] truncate">
                      {name}
                    </span>
                  </div>
                  {/* Share */}
                  <span className="text-[16px] font-semibold text-[#1A1A1A] shrink-0">
                    LKR {p.share.toLocaleString()}
                  </span>
                </div>
                {!isLast && <div className="h-px bg-[#1A1A1A]/5 mx-5" />}
              </div>
            );
          })}

          {/* Per-person share callout */}
          {bill.participants.length > 1 && (
            <div className="px-5 pt-2 pb-4 flex justify-between items-center">
              <span className="text-[12px] text-[#1A1A1A]/40">Each person</span>
              <span className="text-[13px] font-semibold text-[#1A1A1A]/60">
                ≈ LKR {Math.round(bill.total / bill.participants.length).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Pay Button (Pending only) ── */}
      {bill.status === 'Pending' && (
        <div className="fixed bottom-[100px] left-0 w-full z-[55] flex justify-center px-5 pointer-events-none">
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            className="w-full max-w-[440px] h-[58px] bg-[#1A1A1A] rounded-full
                       flex items-center justify-center pointer-events-auto
                       shadow-[0_4px_20px_rgba(0,0,0,0.20)]
                       active:scale-[0.98] transition-transform duration-150 cursor-pointer"
          >
            <span className="text-[#EDEDF1] text-[16px] font-semibold tracking-wide">
              Pay  LKR {myShare.toLocaleString()}
            </span>
          </button>
        </div>
      )}

      <ConfirmTransferModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          if (onSettle) onSettle();
        }}
        amount={myShare}
        username="@senup"
      />
    </div>
  );
}
