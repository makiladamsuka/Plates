import { Trash2, AlertCircle, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  isLoading?: boolean;
  itemType?: 'friend' | 'bill';
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Delete',
  isBlocked = false,
  blockedReason,
  isLoading = false,
  itemType,
}: DeleteConfirmationModalProps) {
  void itemType;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[380px] bg-white dark:bg-zinc-900 rounded-[35px] p-6 shadow-2xl z-10 font-['Sora'] animate-in zoom-in-95 duration-200 border border-black/5 dark:border-white/10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Icon Header */}
        <div className="flex flex-col items-center text-center mt-2">
          {isBlocked ? (
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={30} strokeWidth={2.2} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
              <Trash2 size={28} strokeWidth={2.2} />
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
            {description}
          </p>

          {/* Blocked reason banner */}
          {isBlocked && blockedReason && (
            <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-[20px] text-left flex items-start gap-2.5 w-full">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 leading-normal">
                {blockedReason}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          {isBlocked ? (
            <button
              onClick={onClose}
              className="w-full py-3.5 px-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[25px] font-semibold text-sm hover:bg-black dark:hover:bg-white active:scale-98 transition-all cursor-pointer shadow-md"
            >
              Got it
            </button>
          ) : (
            <>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="w-full py-3.5 px-5 bg-red-600 hover:bg-red-700 text-white rounded-[25px] font-semibold text-sm active:scale-98 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>{confirmText}</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full py-3.5 px-5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-[25px] font-semibold text-sm active:scale-98 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
