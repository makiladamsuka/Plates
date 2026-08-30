import { X, Check, Eye, UserPlus, Receipt } from 'lucide-react';

export interface LiveAlert {
  id: string;
  type: 'friend' | 'bill' | 'payment_received';
  title: string;
  subtitle: string;
  amount?: number;
  avatarUrl?: string;
  name: string;
  rawData: any;
}

interface LiveNotificationPopupProps {
  alert: LiveAlert | null;
  onAccept: () => void;
  onReview: () => void;
  onDismiss: () => void;
}

export function LiveNotificationPopup({
  alert,
  onAccept,
  onReview,
  onDismiss,
}: LiveNotificationPopupProps) {
  if (!alert) return null;

  const isFriend = alert.type === 'friend';
  const isPaymentReceived = alert.type === 'payment_received';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[440px] px-4 pointer-events-auto animate-in fade-in slide-in-from-top-6 duration-300 font-['Sora']">
      <div className="w-full bg-[#1A1A1A] dark:bg-zinc-900 text-white rounded-[28px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-white/10 flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
        
        {/* Glow Accent */}
        <div 
          className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-25 ${
            isFriend || isPaymentReceived ? 'bg-[#4C8C3C]' : 'bg-[#F5C744]'
          }`} 
        />

        {/* Top Row: Icon/Avatar, Info & Close Button */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar / Icon Badge */}
            <div className="relative shrink-0">
              {alert.avatarUrl ? (
                <img
                  src={alert.avatarUrl}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover border border-white/15"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center font-bold text-base text-white border border-white/15">
                  {(alert.name || 'U').substring(0, 1).toUpperCase()}
                </div>
              )}
              
              <div 
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-black ${
                  isFriend || isPaymentReceived ? 'bg-[#4C8C3C] text-white' : 'bg-[#F5C744]'
                }`}
              >
                {isFriend ? <UserPlus size={11} strokeWidth={2.5} /> : <Receipt size={11} strokeWidth={2.5} />}
              </div>
            </div>

            {/* Texts */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isFriend ? 'bg-[#4C8C3C]/30 text-[#85E070]' :
                  isPaymentReceived ? 'bg-[#4C8C3C]/30 text-[#85E070]' :
                  'bg-[#F5C744]/25 text-[#F5C744]'
                }`}>
                  {isFriend ? 'New Friend Request' : isPaymentReceived ? 'Payment Sent' : 'New Bill Request'}
                </span>
              </div>
              <h4 className="text-white text-base font-bold leading-snug truncate mt-0.5">
                {alert.title}
              </h4>
              <p className="text-white/60 text-xs truncate">
                {alert.subtitle}
              </p>
            </div>
          </div>

          {/* Dismiss (X) */}
          <button
            onClick={onDismiss}
            title="Dismiss to Waiting on You"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10 relative z-10">
          <button
            onClick={onAccept}
            className={`flex-1 h-10 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm ${
              isFriend || isPaymentReceived
                ? 'bg-[#4C8C3C] hover:bg-[#437d35] text-white' 
                : 'bg-[#F5C744] hover:bg-[#ebd538] text-black'
            }`}
          >
            <Check size={15} strokeWidth={2.5} />
            <span>{isPaymentReceived ? 'Confirm Receipt' : 'Accept Now'}</span>
          </button>

          <button
            onClick={onReview}
            className="px-4 h-10 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Eye size={14} />
            <span>Review</span>
          </button>

          <button
            onClick={onDismiss}
            className="px-3 h-10 rounded-full text-white/50 hover:text-white/80 text-xs font-normal transition-colors cursor-pointer"
          >
            Later
          </button>
        </div>

      </div>
    </div>
  );
}
