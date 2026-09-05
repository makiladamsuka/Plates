import { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  size?: number;
}

export function Avatar({
  src,
  name,
  className = 'w-11 h-11',
  fallbackClassName,
  size,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image source changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = (name || 'U').trim()[0]?.toUpperCase() || 'U';

  const style = size ? { width: size, height: size } : undefined;

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        style={style}
        className={`${className} rounded-full object-cover shrink-0 shadow-2xs`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`${className} ${
        fallbackClassName || 'bg-zinc-200 dark:bg-zinc-800 text-[#1A1A1A] dark:text-zinc-100'
      } rounded-full flex items-center justify-center font-bold text-base shrink-0 select-none border border-black/5 dark:border-white/5 shadow-2xs`}
    >
      <span>{initial}</span>
    </div>
  );
}
