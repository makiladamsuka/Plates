import { X, AlertCircle } from 'lucide-react';

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
      <div className="relative w-full max-w-[360px] bg-white dark:bg-zinc-900 rounded-[32px] p-7 shadow-2xl z-10 font-['Sora'] animate-in zoom-in-95 duration-150 border border-black/5 dark:border-white/10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Content */}
        <div className="flex flex-col text-left pt-1">
          {/* Title in app display serif */}
          <h3 className="text-2xl font-bold text-[#1A1A1A] dark:text-zinc-100 font-display tracking-tight pr-6">
            {title}
          </h3>

          {/* Clean Description */}
          <p className="text-[13.5px] text-black/60 dark:text-zinc-400 mt-2.5 leading-relaxed">
            {description}
          </p>

          {/* Blocked reason banner */}
          {isBlocked && blockedReason && (
            <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-[20px] text-left flex items-start gap-2.5 w-full">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-300 leading-normal">
                {blockedReason}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-7 flex items-center gap-2.5">
          {isBlocked ? (
            <button
              onClick={onClose}
              className="w-full py-3.5 px-5 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[22px] font-semibold text-sm active:scale-98 transition-all cursor-pointer"
            >
              Got it
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-[22px] font-semibold text-sm active:scale-98 transition-all cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-[22px] font-semibold text-sm active:scale-98 transition-all cursor-pointer shadow-sm text-center flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
