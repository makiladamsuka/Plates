import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { ProfileIcon } from '../components/ProfileIcon';
import { MOCK_FRIENDS } from '../data/mockData';

// Some extra dummy search results
const SEARCH_POOL = [
  ...MOCK_FRIENDS.filter(f => f.id !== 'me'),
  { id: 's1', name: 'Adhen Ditha', username: '@adhen',    color: '#D9E8D3', balance: 0 },
  { id: 's2', name: 'Adhen Ditha', username: '@adhend',   color: '#FDD356', balance: 0 },
];

export function SearchFriends() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const results = SEARCH_POOL.filter(f =>
    query.length > 0 &&
    (f.name.toLowerCase().includes(query.toLowerCase()) ||
     f.username.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '24px 20px' }}>
      
      {/* Search bar header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: 'var(--surface-white)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <ChevronLeft size={20} color="var(--ink-black)" />
        </button>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: 'var(--surface-white)', borderRadius: '9999px', padding: '12px 16px',
        }}>
          <input
            type="text"
            placeholder="Search friends"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: '15px', fontFamily: 'inherit',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={16} color="var(--text-gray)" />
            </button>
          )}
        </div>
      </div>

      {/* Prompt */}
      {query.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '60px 0', fontSize: '15px' }}>
          Start typing to find friends
        </div>
      )}

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {results.map((person, idx) => (
          <div key={`${person.id}-${idx}`} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: 'var(--surface-white)', borderRadius: '20px', padding: '12px 16px',
          }}>
            <ProfileIcon name={person.name} color={person.color} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{person.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{person.username}</div>
            </div>
            <button style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'var(--ink-black)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
