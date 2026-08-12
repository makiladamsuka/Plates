import React, { useState } from 'react';
import type { Bill, CategoryType } from '../types';
import { X, Plus, Users, Utensils, ShoppingBag, Car, Zap } from 'lucide-react';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
}

export const NewBillModal: React.FC<NewBillModalProps> = ({ isOpen, onClose, onCreate }) => {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[412px] bg-[#1a1a1a] text-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-['Sora']">Create New Bill</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Bill Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner at Ministry of Crab"
              className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Total Amount (LKR)</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="4800"
                className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Split Between</label>
              <div className="flex items-center bg-white/10 border border-white/10 rounded-2xl px-3 py-2.5">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(parseInt(e.target.value) || 2)}
                  className="w-full bg-transparent text-white font-bold text-sm focus:outline-none"
                />
                <span className="text-xs text-gray-400 shrink-0">People</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.type;
                return (
                  <button
                    key={cat.type}
                    type="button"
                    onClick={() => setCategory(cat.type)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#f5c744] text-black border-[#f5c744] font-bold'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-[#f5c744] hover:bg-yellow-400 text-black py-3.5 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Request Split</span>
          </button>
        </form>
      </div>
    </div>
  );
};
