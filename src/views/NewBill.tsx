import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { ProfileIcon } from '../components/ProfileIcon';
import { MOCK_FRIENDS } from '../data/mockData';

// Step type
type Step = 1 | 2 | 3;

export function NewBill() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1 data
  const [amount, setAmount] = useState('');
  const [billName, setBillName] = useState('');
  const [category, setCategory] = useState('Restaurant');

  // Step 2 — selected friends
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const friends = MOCK_FRIENDS.filter(f => f.id !== 'me' && !f.isPendingRequest);
  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFriend = (id: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totalPeople = selectedFriendIds.length + 1; // +1 for you
  const totalAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const sharePerPerson = totalPeople > 0 ? Math.round(totalAmount / totalPeople) : 0;

  const CATEGORIES = ['Restaurant', 'Grocery', 'Entertainment', 'Travel', 'Other'];

  const handleCreate = () => {
    // In a real app, push to state. For now just go back.
    navigate('/bills');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '24px 20px 120px' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button
          onClick={() => step === 1 ? navigate(-1) : setStep((step - 1) as Step)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: 'var(--surface-white)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <ChevronLeft size={20} color="var(--ink-black)" />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 600 }}>
          {step === 1 ? 'New Bill' : step === 2 ? "Who's splitting?" : 'Review & create'}
        </span>
        {/* Step dots */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: s === step ? '20px' : '8px',
              height: '8px',
              borderRadius: '9999px',
              backgroundColor: s === step ? 'var(--ink-black)' : 'var(--border-color)',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>
      </div>

      {/* ── STEP 1 – Bill details ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: 'var(--surface-white)', borderRadius: '28px', padding: '28px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 500 }}>Total Amount</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-gray)' }}>LKR</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{
                  fontSize: '48px', fontWeight: 800, color: 'var(--ink-black)',
                  border: 'none', outline: 'none', background: 'transparent',
                  width: '180px', textAlign: 'center', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Bill name */}
          <div style={{ backgroundColor: 'var(--surface-white)', borderRadius: '20px', padding: '18px 20px' }}>
            <input
              type="text"
              placeholder="Bill name (e.g. Dinner at Senu)"
              value={billName}
              onChange={e => setBillName(e.target.value)}
              style={{
                width: '100%', border: 'none', outline: 'none', background: 'transparent',
                fontSize: '16px', fontWeight: 500, fontFamily: 'inherit', color: 'var(--ink-black)',
              }}
            />
          </div>

          {/* Category pills */}
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', marginBottom: '10px', display: 'block' }}>Category</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '8px 16px', borderRadius: '9999px', fontSize: '14px', fontWeight: 600,
                    backgroundColor: category === cat ? 'var(--ink-black)' : 'var(--surface-white)',
                    color: category === cat ? 'white' : 'var(--ink-black)',
                    border: `1px solid ${category === cat ? 'var(--ink-black)' : 'var(--border-color)'}`,
                    transition: 'all 0.15s',
                  }}
                >{cat}</button>
              ))}
            </div>
          </div>

          <button
            onClick={() => amount && billName ? setStep(2) : null}
            style={{
              backgroundColor: amount && billName ? 'var(--ink-black)' : 'var(--border-color)',
              color: amount && billName ? 'white' : 'var(--text-gray)',
              borderRadius: '9999px', padding: '16px', fontSize: '16px', fontWeight: 700,
              width: '100%', marginTop: '8px',
            }}
          >Next</button>
        </div>
      )}

      {/* ── STEP 2 – Select Friends ── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search */}
          <div style={{
            backgroundColor: 'var(--surface-white)', borderRadius: '9999px',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <input
              type="text"
              placeholder="Search friends"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: '15px', fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X size={16} color="var(--text-gray)" />
              </button>
            )}
          </div>

          {/* Selected chips */}
          {selectedFriendIds.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedFriendIds.map(fid => {
                const f = MOCK_FRIENDS.find(x => x.id === fid)!;
                return (
                  <button
                    key={fid}
                    onClick={() => toggleFriend(fid)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      backgroundColor: f.color, borderRadius: '9999px', padding: '6px 12px 6px 6px',
                    }}
                  >
                    <ProfileIcon name={f.name} color="white" size={24} />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{f.name}</span>
                    <X size={12} color="var(--ink-black)" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Friends list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFriends.map(friend => {
              const isSelected = selectedFriendIds.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  onClick={() => toggleFriend(friend.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: 'var(--surface-white)', borderRadius: '20px', padding: '12px 16px',
                    border: isSelected ? '2px solid var(--ink-black)' : '2px solid transparent',
                    textAlign: 'left',
                  }}
                >
                  <ProfileIcon name={friend.name} color={friend.color} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{friend.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{friend.username}</div>
                  </div>
                  {/* Green checkmark when selected */}
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: isSelected ? 'var(--deep-green)' : 'var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background-color 0.15s',
                  }}>
                    {isSelected && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => selectedFriendIds.length > 0 ? setStep(3) : null}
            style={{
              backgroundColor: selectedFriendIds.length > 0 ? 'var(--ink-black)' : 'var(--border-color)',
              color: selectedFriendIds.length > 0 ? 'white' : 'var(--text-gray)',
              borderRadius: '9999px', padding: '16px', fontSize: '16px', fontWeight: 700, width: '100%',
            }}
          >Next ({selectedFriendIds.length} selected)</button>
        </div>
      )}

      {/* ── STEP 3 – Review ── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: 'var(--surface-white)', borderRadius: '28px', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{billName}</h2>
              <span style={{
                backgroundColor: 'var(--pastel-pink)', padding: '3px 12px', borderRadius: '9999px',
                fontSize: '12px', fontWeight: 700, marginTop: '8px', display: 'inline-block',
              }}>{category}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Total</span>
              <span style={{ fontSize: '28px', fontWeight: 800 }}>LKR {parseFloat(amount).toLocaleString()}</span>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />

            {/* You */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: 'var(--bg-color)', borderRadius: '9999px', padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ProfileIcon name="You" color="#E5E7EB" size={36} />
                <span style={{ fontSize: '15px', fontWeight: 600 }}>You</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>LKR {sharePerPerson.toLocaleString()}</span>
            </div>

            {/* Selected friends */}
            {selectedFriendIds.map(fid => {
              const friend = MOCK_FRIENDS.find(f => f.id === fid)!;
              return (
                <div key={fid} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-color)', borderRadius: '9999px', padding: '10px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ProfileIcon name={friend.name} color={friend.color} size={36} />
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{friend.name}</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>LKR {sharePerPerson.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleCreate}
            style={{
              backgroundColor: 'var(--ink-black)', color: 'white',
              borderRadius: '9999px', padding: '16px', fontSize: '16px', fontWeight: 700, width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >Create Bill</button>
        </div>
      )}
    </div>
  );
}
