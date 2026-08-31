import { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, AlertCircle, Loader2, AtSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanUsername, generateUniqueUsername, isUsernameAvailable } from '../lib/usernameUtils';

interface SetUsernameModalProps {
  isOpen: boolean;
  session: any;
  onUsernameSet: (username: string) => void;
  canClose?: boolean;
  onClose?: () => void;
}

export function SetUsernameModal({
  isOpen,
  session,
  onUsernameSet,
  canClose = false,
  onClose,
}: SetUsernameModalProps) {
  const [username, setUsername] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const checkDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const userId = session?.user?.id;
  const fullName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'User';

  // Automatically generate and suggest a username when the modal opens
  useEffect(() => {
    if (!isOpen || !userId) return;

    const generateInitialSuggestion = async () => {
      try {
        setIsGenerating(true);
        const suggested = await generateUniqueUsername(fullName, supabase);
        setUsername(suggested);
        setIsAvailable(true);
        setErrorMessage(null);
      } catch (err) {
        console.warn('Error generating initial username suggestion:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    generateInitialSuggestion();
  }, [isOpen, userId, fullName]);

  // Handle user input changes and debounce availability check
  const handleInputChange = (val: string) => {
    const cleaned = cleanUsername(val);
    setUsername(cleaned);
    setErrorMessage(null);
    setIsAvailable(null);

    if (checkDebounceRef.current) {
      clearTimeout(checkDebounceRef.current);
    }

    if (!cleaned || cleaned.length < 3) {
      setIsChecking(false);
      if (cleaned.length > 0 && cleaned.length < 3) {
        setErrorMessage('Username must be at least 3 characters');
      }
      return;
    }

    setIsChecking(true);
    checkDebounceRef.current = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(cleaned, supabase, userId);
        setIsAvailable(available);
        if (!available) {
          setErrorMessage('This username is already taken');
        } else {
          setErrorMessage(null);
        }
      } catch (err) {
        console.warn('Error checking username:', err);
      } finally {
        setIsChecking(false);
      }
    }, 400);
  };

  // Quick regenerate suggestion
  const handleRegenerate = async () => {
    try {
      setIsGenerating(true);
      const suggested = await generateUniqueUsername(fullName, supabase);
      setUsername(suggested);
      setIsAvailable(true);
      setErrorMessage(null);
    } catch (err) {
      console.warn('Error regenerating username:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the selected username
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !username || username.length < 3 || isChecking || isAvailable === false) {
      return;
    }

    setIsSaving(true);
    try {
      // Double check availability before final save
      const available = await isUsernameAvailable(username, supabase, userId);
      if (!available) {
        setIsAvailable(false);
        setErrorMessage('This username is already taken');
        setIsSaving(false);
        return;
      }

      // Update profiles table in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase().trim() })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: { username: username.toLowerCase().trim() },
      });

      setSuccess(true);
      setTimeout(() => {
        onUsernameSet(username);
        setSuccess(false);
        if (onClose) onClose();
      }, 600);
    } catch (err: any) {
      console.error('Error saving username:', err);
      setErrorMessage(err.message || 'Failed to save username. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 font-['Sora']">
      <div className="bg-white dark:bg-zinc-900 rounded-[35px] max-w-md w-full p-7 relative shadow-2xl border border-black/5 dark:border-white/5 flex flex-col">
        
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-400/20 dark:bg-amber-400/15 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
          <AtSign size={28} strokeWidth={2.5} />
        </div>

        <h2 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100 mb-1.5">
          Choose your username
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
          Your unique username helps friends find you on Plates and split food tabs together.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Username
              </label>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isGenerating || isSaving}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={12} />
                <span>Suggest new</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-4 text-zinc-400 dark:text-zinc-500 font-bold text-base select-none">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="username"
                disabled={isSaving}
                autoFocus
                required
                className={`w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 pl-9 pr-12 py-3.5 rounded-[22px] text-base font-semibold outline-none border transition-all ${
                  errorMessage
                    ? 'border-red-500/60 focus:border-red-500'
                    : isAvailable
                    ? 'border-green-500/60 focus:border-green-500'
                    : 'border-transparent focus:border-amber-400'
                }`}
              />

              {/* Status indicator inside input */}
              <div className="absolute right-4 flex items-center">
                {isChecking || isGenerating ? (
                  <Loader2 size={18} className="animate-spin text-zinc-400" />
                ) : isAvailable && username.length >= 3 ? (
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <Check size={13} strokeWidth={3} />
                  </div>
                ) : errorMessage ? (
                  <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <AlertCircle size={13} strokeWidth={3} />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Validation Message */}
            <div className="mt-2 min-h-[20px] px-1">
              {errorMessage ? (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{errorMessage}</span>
                </p>
              ) : isAvailable && username.length >= 3 ? (
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check size={12} />
                  <span>Username is available!</span>
                </p>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Only lowercase letters, numbers, and underscores allowed.
                </p>
              )}
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-3.5 py-2 rounded-full">
              <Check size={14} />
              <span>Username confirmed!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isSaving ||
              isChecking ||
              isGenerating ||
              !username ||
              username.length < 3 ||
              isAvailable === false
            }
            className="w-full py-4 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[24px] font-bold text-base cursor-pointer active:scale-[0.98] transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Saving username...</span>
              </>
            ) : (
              <span>Confirm & Continue</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
