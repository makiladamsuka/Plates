import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { FilterPills } from '../components/FilterPills';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { ProfileIcon } from '../components/ProfileIcon';
import { NewBillOverlay } from '../components/NewBillOverlay';
import { MOCK_BILLS, MOCK_FRIENDS } from '../data/mockData';

type SortOption = 'All' | 'Highest' | 'Lowest' | 'Oldest';

export function BillsList() {
  const [activeFilter, setActiveFilter] = useState<SortOption>('All');
  const [showNewBill, setShowNewBill] = useState(false);
  const navigate = useNavigate();

  const sorted = [...MOCK_BILLS].sort((a, b) => {
    if (activeFilter === 'Highest') return b.total - a.total;
    if (activeFilter === 'Lowest') return a.total - b.total;
    if (activeFilter === 'Oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // All = newest first
  });

  const myId = 'me';

  return (
    <div style={{ padding: '24px 20px 120px', display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>Bills</h1>
        <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={18} color="var(--ink-black)" />
        </button>
      </div>

      {/* Filter Pills */}
      <FilterPills
        options={['All', 'Highest', 'Lowest', 'Oldest']}
        activeOption={activeFilter}
        onChange={(o) => setActiveFilter(o as SortOption)}
      />

      {/* Bill Cards — dark rounded cards like Figma */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sorted.map(bill => {
          const myShare = bill.participants.find(p => p.friendId === myId)?.share || 0;
          const others = bill.participants.filter(p => p.friendId !== myId);

          return (
            <div
              key={bill.id}
              onClick={() => navigate(`/bills/${bill.id}`)}
              style={{
                backgroundColor: 'var(--ink-black)',
                borderRadius: '28px',
                padding: '20px',
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Bill name row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  {bill.category} · {new Date(bill.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                </span>
                <span style={{
                  backgroundColor: bill.status === 'Pending' ? 'var(--yellow)' : 'var(--pastel-green)',
                  color: 'var(--ink-black)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {bill.status}
                </span>
              </div>

              <span style={{ fontSize: '20px', fontWeight: 700 }}>{bill.title}</span>

              {/* Participant rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {others.map(p => {
                  const friend = MOCK_FRIENDS.find(f => f.id === p.friendId);
                  if (!friend) return null;
                  return (
                    <div key={p.friendId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ProfileIcon name={friend.name} color={friend.color} size={28} />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{friend.name}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>LKR {p.share.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Your Share yellow pill */}
              {myShare > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--yellow)',
                  color: 'var(--ink-black)',
                  borderRadius: '9999px',
                  padding: '12px 16px',
                  marginTop: '4px',
                }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Your Share</span>
                  <span style={{ fontWeight: 800, fontSize: '16px' }}>LKR {myShare.toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <FloatingActionButton onClick={() => setShowNewBill(true)} />
      {showNewBill && <NewBillOverlay onClose={() => setShowNewBill(false)} />}
    </div>
  );
}
