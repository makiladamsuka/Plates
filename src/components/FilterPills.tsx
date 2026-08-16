interface FilterPillsProps {
  options: string[];
  activeOption: string;
  onChange: (option: string) => void;
}

export function FilterPills({ options, activeOption, onChange }: FilterPillsProps) {
  return (
    <div 
      className="flex-row items-center gap-2 no-scrollbar" 
      style={{ overflowX: 'auto', paddingBottom: '8px' }}
    >
      {options.map(option => {
        const isActive = option === activeOption;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: isActive ? 'var(--ink-black)' : 'transparent',
              color: isActive ? 'var(--surface-white)' : 'var(--text-gray)',
              border: isActive ? '1px solid var(--ink-black)' : '1px solid var(--border-color)',
              fontSize: '14px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
