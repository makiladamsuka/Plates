import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { MOCK_FRIENDS, MOCK_BILLS } from '../data/mockData';
import { ProfileIcon } from '../components/ProfileIcon';

export function FriendProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const friend = MOCK_FRIENDS.find(f => f.id === id);

  if (!friend) return null;

  // Bills shared with this friend
  const sharedBills = MOCK_BILLS.filter(b =>
    b.participants.some(p => p.friendId === id)
  );

  const balance = friend.balance;
  const owesYou = balance > 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '24px 20px 100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
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
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{friend.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{friend.username}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            fontSize: '18px', fontWeight: 800,
            color: owesYou ? 'var(--deep-green)' : 'var(--ink-black)',
          }}>
            {owesYou ? '+' : '-'} LKR {Math.abs(balance).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Profile icon centered */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
        <ProfileIcon name={friend.name} color={friend.color} size={80} />
      </div>

      {/* Shared bills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)' }}>Shared Bills</span>
        {sharedBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-gray)' }}>
            No shared bills yet
          </div>
        ) : sharedBills.map(bill => {
          return (
            <div
              key={bill.id}
              onClick={() => navigate(`/bills/${bill.id}`)}
              style={{
                backgroundColor: 'var(--surface-white)', borderRadius: '20px', padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{bill.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '2px' }}>
                  {new Date(bill.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>LKR {bill.total.toLocaleString()}</div>
                <div style={{
                  fontSize: '11px', fontWeight: 600, marginTop: '2px',
                  color: bill.status === 'Pending' ? '#c17a00' : 'var(--deep-green)',
                }}>
                  {bill.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
