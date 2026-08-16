import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '96px',
      left: '50%',
      width: '100%',
      maxWidth: '480px',
      transform: 'translateX(-50%)',
      pointerEvents: 'none', // So it doesn't block clicks on the page
      zIndex: 40,
    }}>
      <button
        onClick={onClick}
        style={{
          position: 'absolute',
          right: '24px',
          bottom: '0',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--ink-black)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'auto', // Re-enable clicks for the button
        }}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
