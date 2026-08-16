import { useState } from 'react';
import { X, Search, Pencil } from 'lucide-react';
import { ProfileIcon } from '../components/ProfileIcon';
import { MOCK_FRIENDS } from '../data/mockData';

type Step = 1 | 2 | 3;

interface NewBillOverlayProps {
  onClose: () => void;
}

export function NewBillOverlay({ onClose }: NewBillOverlayProps) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [amount, setAmount] = useState('');
  const [billName, setBillName] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Step 2 state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const friends = MOCK_FRIENDS.filter(f => f.id !== 'me' && !f.isPendingRequest);
  const filteredFriends = searchQuery.length > 0
    ? friends.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends;

  const toggleFriend = (id: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totalPeople = selectedFriendIds.length + 1;
  const totalAmount = parseFloat(amount) || 0;
  const sharePerPerson = totalPeople > 0 ? Math.round(totalAmount / totalPeople) : 0;

  // The 2 progress line widths for Step 1 vs Step 2 (assuming 2 steps for creation before review)
  // From Figma screenshot, it looks like a 2-segment progress or handle at the top
  const progressColors = [
    step >= 1 ? '#FFFFFF' : '#444444',
    step >= 2 ? '#FFFFFF' : '#444444',
  ];

  return (
    /* Full-screen overlay — dimmed background */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      {/* Dim backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      />

      {/* The floating dark card */}
      <div
        style={{
          position: 'relative',
          width: '360px',
          marginTop: '168px',
          backgroundColor: '#1C1C1C',
          borderRadius: '24px',
          padding: '0',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* ── Progress bar row at VERY TOP ── */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', paddingTop: '12px' }}>
          {progressColors.map((color, i) => (
            <div key={i} style={{
              width: '60px', height: '4px',
              backgroundColor: color,
              borderRadius: '9999px',
            }} />
          ))}
        </div>

        <div style={{ padding: '20px 24px 0' }}>
          {/* Step title + X close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>
              {step === 1 ? 'New Bill' : step === 2 ? 'Add Friends' : 'Review'}
            </span>
            <button onClick={onClose} style={{ padding: '4px' }}>
              <X size={24} color="rgba(255,255,255,0.7)" />
            </button>
          </div>
        </div>

        {/* ══ STEP 1 ══ */}
        {step === 1 && (
          <div style={{ padding: '0 24px 28px' }}>
            {/* Amount input — matches Figma frame 108:254: rounded rect, centered, pencil icon at right */}
            <div style={{
              backgroundColor: '#2C2C2C',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '12px',
              position: 'relative',
            }}>
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>LKR</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{
                  fontSize: '32px', fontWeight: 800, color: 'white',
                  background: 'transparent', border: 'none', outline: 'none',
                  width: '120px', textAlign: 'center', fontFamily: 'inherit',
                }}
              />
              {/* lucide/pencil — Figma id 108:232, 15×15px */}
              <Pencil size={15} color="rgba(255,255,255,0.35)" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Bill name input — matches Figma frame 108:260, pencil icon at right (id 108:258) */}
            <div style={{
              backgroundColor: '#2C2C2C',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <input
                type="text"
                placeholder="Bill Name"
                value={billName}
                onChange={e => setBillName(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '15px', fontFamily: 'inherit', color: 'white',
                }}
              />
              {/* lucide/pencil — Figma id 108:258, 15×15px */}
              <Pencil size={15} color="rgba(255,255,255,0.35)" />
            </div>

            {/* Select a Tag */}
            <div style={{ marginBottom: '28px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '10px' }}>
                Select a Tag:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Restaurant', 'Grocery', 'Entertainment', 'Travel'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    style={{
                      padding: '8px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
                      backgroundColor: selectedTag === tag ? 'var(--yellow)' : '#2C2C2C',
                      color: selectedTag === tag ? 'var(--ink-black)' : 'rgba(255,255,255,0.8)',
                      border: 'none',
                      transition: 'all 0.15s',
                    }}
                  >{tag}</button>
                ))}
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={() => { if (amount && billName) setStep(2); }}
              style={{
                width: '100%', height: '55px', borderRadius: '9999px',
                backgroundColor: amount && billName ? 'var(--yellow)' : '#3A3A3A',
                color: amount && billName ? 'var(--ink-black)' : '#888888',
                fontSize: '18px', fontWeight: 700,
                transition: 'all 0.15s',
              }}
            >Next</button>
          </div>
        )}

        {/* ══ STEP 2 ══ */}
        {step === 2 && (
          <div style={{ padding: '0 24px 28px' }}>
            {/* Search bar */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: '9999px',
              padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '14px',
            }}>
              <Search size={18} color="rgba(255,255,255,0.5)" />
              <input
                type="text"
                placeholder="Search Friends"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '14px', fontFamily: 'inherit', color: 'white',
                }}
              />
            </div>

            {/* Selected: avatars row */}
            {selectedFriendIds.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px' }}>
                  Selected:
                </span>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {selectedFriendIds.map(fid => {
                    const f = MOCK_FRIENDS.find(x => x.id === fid)!;
                    return (
                      <div key={fid} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
                        <ProfileIcon name={f.name} color={f.color} size={40} />
                        <button
                          onClick={() => toggleFriend(fid)}
                          style={{
                            position: 'absolute', top: -4, right: -4,
                            width: '16px', height: '16px', borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <X size={10} color="#141414" />
                        </button>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                          {f.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Friends label */}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '10px' }}>
              Recent Friends:
            </span>

            {/* Friend rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {filteredFriends.slice(0, 4).map(f => {
                const isSelected = selectedFriendIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFriend(f.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      backgroundColor: isSelected ? 'rgba(253,211,86,0.15)' : 'rgba(255,255,255,0.07)',
                      borderRadius: '9999px', padding: '8px 14px',
                      border: isSelected ? '1px solid rgba(253,211,86,0.4)' : '1px solid transparent',
                      textAlign: 'left',
                    }}
                  >
                    <ProfileIcon name={f.name} color={f.color} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{f.username}</div>
                    </div>
                    {/* circle-plus / circle-minus icon */}
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--yellow)' : 'rgba(255,255,255,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected ? (
                        <div style={{ width: '8px', height: '2px', backgroundColor: 'var(--yellow)', borderRadius: '1px' }} />
                      ) : (
                        <>
                          <div style={{ position: 'absolute', width: '8px', height: '2px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '1px' }} />
                          <div style={{ position: 'absolute', width: '2px', height: '8px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '1px' }} />
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { if (selectedFriendIds.length > 0) setStep(3); }}
              style={{
                width: '100%', height: '55px', borderRadius: '9999px',
                backgroundColor: selectedFriendIds.length > 0 ? 'var(--yellow)' : 'rgba(255,255,255,0.15)',
                color: selectedFriendIds.length > 0 ? 'var(--ink-black)' : 'rgba(255,255,255,0.4)',
                fontSize: '18px', fontWeight: 700,
              }}
            >Next</button>
          </div>
        )}

        {/* ══ STEP 3 – Review ══ */}
        {step === 3 && (
          <div style={{ padding: '0 24px 28px' }}>
            {/* Friends review panel (matches "Search island" frame: 277×292) */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: '20px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              {/* You row */}
              <div style={{
                display: 'flex', alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderRadius: '9999px', padding: '8px 14px',
                marginBottom: '8px',
              }}>
                <ProfileIcon name="You" color="#E5E7EB" size={32} />
                <div style={{ flex: 1, marginLeft: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>You</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>@you</div>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--yellow)' }}>
                  LKR {sharePerPerson.toLocaleString()}
                </span>
              </div>

              {/* Selected friends rows */}
              {selectedFriendIds.map(fid => {
                const f = MOCK_FRIENDS.find(x => x.id === fid)!;
                return (
                  <div key={fid} style={{
                    display: 'flex', alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderRadius: '9999px', padding: '8px 14px',
                    marginBottom: '8px',
                  }}>
                    <ProfileIcon name={f.name} color={f.color} size={32} />
                    <div style={{ flex: 1, marginLeft: '10px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{f.username}</div>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>
                      LKR {sharePerPerson.toLocaleString()}
                    </span>
                  </div>
                );
              })}

              {/* Total */}
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                marginTop: '8px', paddingTop: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                  {billName}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>
                  LKR {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%', height: '55px', borderRadius: '9999px',
                backgroundColor: 'var(--yellow)',
                color: 'var(--ink-black)',
                fontSize: '18px', fontWeight: 700,
              }}
            >Confirm</button>
          </div>
        )}
      </div>
    </div>
  );
}
