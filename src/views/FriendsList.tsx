import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { FilterPills } from '../components/FilterPills';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { ProfileIcon } from '../components/ProfileIcon';
import { SliderButton } from '../components/SliderButton';
import { MOCK_FRIENDS } from '../data/mockData';
import type { Friend } from '../data/mockData';

export function FriendsList() {
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  const pendingRequests = MOCK_FRIENDS.filter(f => f.isPendingRequest);
  const activeFriends = MOCK_FRIENDS.filter(f => !f.isPendingRequest && f.id !== 'me');

  const getFriendBalance = (friend: Friend) => friend.balance;

  return (
    <div style={{ padding: '24px 20px 120px', display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>Friends</h1>
        <button style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Search size={18} color="var(--ink-black)" />
        </button>
      </div>

      <FilterPills
        options={['All', 'Pending']}
        activeOption={activeFilter}
        onChange={setActiveFilter}
      />

      {/* ── Friend Request card (only shown in All tab if there are pending) ── */}
      {activeFilter === 'All' && pendingRequests.length > 0 && (
        <div style={{ marginTop: '20px', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', display: 'block', marginBottom: '10px' }}>
            Friend Request
          </span>
          {pendingRequests.map(req => (
            <div key={req.id} style={{
              backgroundColor: 'var(--ink-black)',
              borderRadius: '28px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* Request pill — strictly matches Figma pink pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: 'var(--pastel-pink)', borderRadius: '9999px', padding: '8px 16px 8px 8px',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '15px', color: 'var(--ink-black)'
                }}>
                  {req.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink-black)' }}>{req.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-black)', opacity: 0.7 }}>{req.username}</div>
                </div>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#8A5A5A', whiteSpace: 'nowrap' }}>
                  WANTS TO ADD YOU
                </span>
              </div>

              {/* Slider */}
              <SliderButton
                text="Slide to approve"
                onSlideComplete={() => { /* handle accept */ }}
              />
              <button style={{
                color: '#6b7280', fontSize: '14px', fontWeight: 600,
                textAlign: 'center', paddingTop: '4px',
              }}>
                Decline
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Friends list ── */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(activeFilter === 'Pending' ? pendingRequests : activeFriends).map(friend => {
          const balance = getFriendBalance(friend);
          const owesYou = balance > 0;

          return (
            <div
              key={friend.id}
              onClick={() => navigate(`/friends/${friend.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: 'var(--surface-white)',
                borderRadius: '20px', padding: '14px 16px',
                cursor: 'pointer',
              }}
            >
              <ProfileIcon name={friend.name} color={friend.color} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{friend.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{friend.username}</div>
              </div>
              {friend.isPendingRequest ? null : balance !== 0 ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '15px', fontWeight: 700,
                    color: owesYou ? 'var(--deep-green)' : 'var(--ink-black)',
                  }}>
                    {owesYou ? '+' : '-'} LKR {Math.abs(balance).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>
                    {owesYou ? 'owes you' : 'you owe'}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <FloatingActionButton onClick={() => navigate('/friends/search')} />
    </div>
  );
}
