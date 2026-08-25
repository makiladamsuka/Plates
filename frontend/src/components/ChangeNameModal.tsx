import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChangeNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  currentName: string;
  onNameUpdated: (newName: string) => void;
}

export function ChangeNameModal({
  isOpen,
  onClose,
  session,
  currentName,
  onNameUpdated,
}: ChangeNameModalProps) {
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !session?.user?.id) return;
    setIsSaving(true);

    try {
      // 1. Update profiles table
      await supabase
        .from('profiles')
        .update({ full_name: name.trim() })
        .eq('id', session.user.id);

      // 2. Update auth user metadata
      await supabase.auth.updateUser({
        data: { full_name: name.trim() },
      });

      onNameUpdated(name.trim());
      setSuccess(true);

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 600);
    } catch (err) {
      console.error('Error updating name:', err);
      alert('Failed to update name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-['Sora']">
      <div className="bg-white dark:bg-zinc-900 rounded-[35px] max-w-sm w-full p-6 relative shadow-2xl border border-black/5 dark:border-white/5">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black/60 dark:text-zinc-400 cursor-pointer transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100 mb-4">
          Change Name
        </h2>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-[20px] text-sm font-medium outline-none border border-transparent focus:border-amber-400 transition-colors"
            />
          </div>

          {success && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-full">
              <Check size={14} />
              <span>Name updated successfully!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="w-full py-3.5 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[24px] font-semibold text-sm cursor-pointer active:scale-[0.98] transition-transform shadow-xs disabled:opacity-50 mt-1"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
