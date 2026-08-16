interface ProfileIconProps {
  name: string;
  color: string;
  size?: number;
}

export function ProfileIcon({ name, color, size = 40 }: ProfileIconProps) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: `${size * 0.4}px`,
        color: 'var(--ink-black)',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
