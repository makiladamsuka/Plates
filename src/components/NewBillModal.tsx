import React, { useState } from 'react';
import type { Bill, CategoryType } from '../types';
import { X, Plus, Users, Utensils, ShoppingBag, Car, Zap } from 'lucide-react';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  isDark?: boolean;
}

export const NewBillModal: React.FC<NewBillModalProps> = ({ isOpen, onClose, onCreate, isDark = true }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Restaurant');
  const [peopleCount, setPeopleCount] = useState(3);

  if (!isOpen) return null;

  const categories: { type: CategoryType; icon: React.FC<{ className?: string }> }[] = [
    { type: 'Restaurant', icon: Utensils },
    { type: 'Grocery', icon: ShoppingBag },
    { type: 'Travel', icon: Car },
    { type: 'Utilities', icon: Zap },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const numAmount = parseFloat(amount);
    const eachShare = Math.round(numAmount / peopleCount);

    onCreate({
      title,
      category,
      date: 'Just now',
      amount: numAmount,
      currency: 'LKR',
      status: 'Pending',
      creator: 'You',
      peopleCount,
      participants: [
        { id: 'p-you', name: 'You (Host)', share: eachShare, paid: true },
        ...Array.from({ length: peopleCount - 1 }).map((_, i) => ({
          id: `p-${i}`,
          name: `Friend ${i + 1}`,
          share: eachShare,
          paid: false,
        })),
      ],
    });

    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4">
      <div className={`w-full max-w-[412px] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl relative border ${
        isDark ? 'bg-[#14151b] text-white border-white/10' : 'bg-white text-[#0f1015] border-black/10'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-base font-bold font-['Sora'] ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>Create New Bill</h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white' : 'bg-black/5 hover:bg-black/10 text-neutral-500 hover:text-black'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Bill Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner at Ministry of Crab"
              className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#f5c744] ${
                isDark ? 'bg-white/5 border-white/10 text-white placeholder-neutral-500' : 'bg-neutral-100 border-black/10 text-black placeholder-neutral-400'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Total Amount (LKR)</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="4800"
                className={`w-full border rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#f5c744] ${
                  isDark ? 'bg-white/5 border-white/10 text-white placeholder-neutral-500' : 'bg-neutral-100 border-black/10 text-black placeholder-neutral-400'
                }`}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Split Between</label>
              <div className={`flex items-center border rounded-xl px-3 py-2 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-neutral-100 border-black/10'
              }`}>
                <Users className={`w-3.5 h-3.5 mr-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(parseInt(e.target.value) || 2)}
                  className={`w-full bg-transparent font-bold text-xs focus:outline-none ${isDark ? 'text-white' : 'text-black'}`}
                />
                <span className={`text-[10px] shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>People</span>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.type;
                return (
                  <button
                    key={cat.type}
                    type="button"
                    onClick={() => setCategory(cat.type)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#f5c744] text-black border-[#f5c744] font-bold'
                        : isDark
                          ? 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                          : 'bg-neutral-100 border-black/10 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-[#f5c744] hover:bg-yellow-400 text-black py-2.5 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Request Split</span>
          </button>
        </form>
      </div>
    </div>
  );
};


