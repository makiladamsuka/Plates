export type Friend = {
  id: string;
  name: string;
  username: string;
  color: string;
  balance: number; // positive = they owe you, negative = you owe them
  isPendingRequest?: boolean;
};

export type Participant = {
  friendId: string;
  share: number;
  paid?: boolean;
};

export type Bill = {
  id: string;
  title: string;
  category: string;
  total: number;
  createdAt: number;
  status: 'Pending' | 'Settled';
  participants: Participant[];
};

// Realistic friend data with profile colors from Figma palette
export const MOCK_FRIENDS: Friend[] = [
  { id: 'me',  name: 'You',         username: '@you',          color: '#E5E7EB', balance: 0 },
  { id: 'f1',  name: 'Adhen Ditha', username: '@adhenditha',   color: '#FCD3D3', balance: -1480,  isPendingRequest: true },
  { id: 'f2',  name: 'Ayan Munoz',  username: '@ayanmunoz',    color: '#FDD356', balance: 1200 },
  { id: 'f3',  name: 'Senu Perera', username: '@senup',        color: '#D9E8D3', balance: -560 },
  { id: 'f4',  name: 'Tharindu K',  username: '@thari_k',      color: '#4F7F3B', balance: 2000 },
  { id: 'f5',  name: 'Nethmi Silva',username: '@nethmi_s',     color: '#FCD3D3', balance: -300 },
  { id: 'f6',  name: 'Kavindu P',   username: '@kavindu_p',    color: '#E5E7EB', balance: 800 },
];

export const MOCK_BILLS: Bill[] = [
  {
    id: 'b1',
    title: 'Dinner at Senu',
    category: 'Restaurant',
    total: 4800,
    createdAt: Date.now() - 3600000 * 2,
    status: 'Pending',
    participants: [
      { friendId: 'me',  share: 1200 },
      { friendId: 'f2',  share: 1200 },
      { friendId: 'f3',  share: 1200 },
      { friendId: 'f4',  share: 1200 },
    ]
  },
  {
    id: 'b2',
    title: 'Late Keells',
    category: 'Grocery',
    total: 2100,
    createdAt: Date.now() - 3600000 * 24,
    status: 'Settled',
    participants: [
      { friendId: 'me',  share: 700,  paid: true },
      { friendId: 'f5',  share: 1400, paid: true },
    ]
  },
  {
    id: 'b3',
    title: 'Arcade Night',
    category: 'Entertainment',
    total: 3600,
    createdAt: Date.now() - 3600000 * 48,
    status: 'Pending',
    participants: [
      { friendId: 'me',  share: 1200 },
      { friendId: 'f2',  share: 1200 },
      { friendId: 'f6',  share: 1200 },
    ]
  },
];
