import { Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  onSearchClick?: () => void;
}

export function Header({ title, onSearchClick }: HeaderProps) {
  return (
    <div className="flex-row items-center justify-between" style={{ paddingBottom: '16px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{title}</h1>
      {onSearchClick && (
        <button onClick={onSearchClick} style={{ padding: '8px' }}>
          <Search size={24} color="var(--ink-black)" />
        </button>
      )}
    </div>
  );
}
