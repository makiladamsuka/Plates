import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { MOCK_BILLS, MOCK_FRIENDS } from '../data/mockData';
import { ProfileIcon } from '../components/ProfileIcon';
import { SliderButton } from '../components/SliderButton';

export function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bill = MOCK_BILLS.find(b => b.id === id);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!bill) return null;

  const myShare = bill.participants.find(p => p.friendId === 'me')?.share || 0;
  const isPending = bill.status === 'Pending';

  const getFriend = (fid: string) => fid === 'me'
    ? { id: 'me', name: 'You', username: '@you', color: '#E5E7EB', balance: 0 }
    : MOCK_FRIENDS.find(f => f.id === fid);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '24px 20px 40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: 'var(--surface-white)',
            border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <ChevronLeft size={20} color="var(--ink-black)" />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink-black)' }}>{bill.title}</span>
        {isPending && (
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              backgroundColor: 'var(--yellow)', color: 'var(--ink-black)',
              padding: '5px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
            }}>Pending</span>
          </div>
        )}
      </div>

      {/* White card */}
      <div style={{
        backgroundColor: 'var(--surface-white)', borderRadius: '28px', padding: '24px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', lineHeight: 1.2 }}>{bill.title}</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{
            backgroundColor: bill.category === 'Restaurant' ? 'var(--pastel-pink)' : bill.category === 'Grocery' ? 'var(--pastel-green)' : '#e0e0f0',
            color: 'var(--ink-black)', padding: '3px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
          }}>{bill.category}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
            {new Date(bill.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 500 }}>Total</span>
          <span style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink-black)' }}>
            LKR {bill.total.toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {bill.participants.map((p) => {
            const friend = getFriend(p.friendId);
            if (!friend) return null;
            return (
              <div key={p.friendId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: 'var(--bg-color)', borderRadius: '9999px', padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ProfileIcon name={friend.name} color={friend.color} size={36} />
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{friend.name}</span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700 }}>LKR {p.share.toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', marginBottom: '20px' }} />

        {!showConfirm ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 700 }}>Your Share</span>
            {isPending ? (
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  backgroundColor: 'var(--ink-black)', color: 'white',
                  padding: '13px 22px', borderRadius: '9999px',
                  fontSize: '15px', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >Pay LKR {myShare.toLocaleString()}</button>
            ) : (
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--deep-green)' }}>Settled</span>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--ink-black)', borderRadius: '24px', padding: '20px',
            color: 'white', display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Confirm Transfer</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--yellow)' }}>LKR {myShare.toLocaleString()}</span>
            </div>
            <SliderButton text="Slide to approve" onSlideComplete={() => navigate('/bills')} />
            <button onClick={() => setShowConfirm(false)}
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}>
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
