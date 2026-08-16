import { Link, useLocation } from 'react-router-dom';
import { Home, ReceiptText, Users, Hexagon } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    { id: 'home', icon: Home, path: '/' },
    { id: 'bills', icon: ReceiptText, path: '/bills' },
    { id: 'friends', icon: Users, path: '/friends' },
    { id: 'settings', icon: Hexagon, path: '/settings' },
  ];

  return (
    <div 
      className="flex-row justify-between items-center"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)',
        maxWidth: '432px',
        backgroundColor: 'var(--ink-black)',
        borderRadius: '9999px',
        padding: '16px 24px',
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPath === tab.path || (currentPath.startsWith(tab.path) && tab.path !== '/');
        
        return (
          <Link to={tab.path} key={tab.id} style={{ display: 'flex' }}>
            <Icon 
              size={24} 
              color={isActive ? 'var(--yellow)' : 'var(--text-gray)'} 
              style={{ transition: 'color 0.2s' }}
            />
          </Link>
        );
      })}
    </div>
  );
}
