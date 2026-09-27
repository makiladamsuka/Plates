import { ChevronLeft } from 'lucide-react';

interface SwipeBackIndicatorProps {
  isSwiping: boolean;
  progress: number;
}

export function SwipeBackIndicator({ isSwiping, progress }: SwipeBackIndicatorProps) {
  if (!isSwiping || progress <= 0.05) return null;

  const opacity = Math.min(1, progress * 1.3);
  const translateX = Math.min(28, progress * 28);
  const scale = 0.8 + progress * 0.25;

  return (
    <div
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none transition-transform"
      style={{
        transform: `translateY(-50%) translateX(${translateX}px) scale(${scale})`,
        opacity,
      }}
    >
      <div className="w-10 h-10 rounded-full bg-black/80 dark:bg-zinc-800/90 text-white flex items-center justify-center shadow-lg backdrop-blur-md border border-white/20">
        <ChevronLeft size={22} strokeWidth={2.5} />
      </div>
    </div>
  );
}
