import type { Bill, Friend } from '../types';

export const INITIAL_BILLS: Bill[] = [
  {
    id: 'b1',
    title: 'Dinner at Senu',
    category: 'Restaurant',
    date: 'Today 11pm',
    amount: 4800,
    currency: 'LKR',
    status: 'Pending',
    creator: 'Asgan',
    peopleCount: 4,
    createdAt: Date.now() - 3600000,
    participants: [
      { id: 'p1', name: 'Asgan (Host)', share: 1200, paid: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { id: 'p2', name: 'You', share: 1200, paid: false, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      { id: 'p3', name: 'Chamod', share: 1200, paid: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { id: 'p4', name: 'Kasun', share: 1200, paid: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'b2',
    title: 'Late Night Keells',
    category: 'Grocery',
    date: 'Yesterday 1pm',
    amount: 2300,
    currency: 'LKR',
    status: 'Settled',
    creator: 'You',
    peopleCount: 2,
    createdAt: Date.now() - 86400000,
    participants: [
      { id: 'p2', name: 'You', share: 1150, paid: true, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      { id: 'p5', name: 'Nimal', share: 1150, paid: true, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'b3',
    title: 'Uber to Galle Fort',
    category: 'Travel',
    date: '3 days ago',
    amount: 8500,
    currency: 'LKR',
    status: 'Pending',
    creator: 'Saritha',
    peopleCount: 3,
    createdAt: Date.now() - 259200000,
    participants: [
      { id: 'p6', name: 'Saritha', share: 2833, paid: true, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
      { id: 'p2', name: 'You', share: 2833, paid: false, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      { id: 'p3', name: 'Chamod', share: 2834, paid: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'b4',
    title: 'Weekly Groceries',
    category: 'Grocery',
    date: '5 days ago',
    amount: 14200,
    currency: 'LKR',
    status: 'Settled',
    creator: 'You',
    peopleCount: 4,
    createdAt: Date.now() - 432000000,
    participants: [
      { id: 'p2', name: 'You', share: 3550, paid: true },
      { id: 'p1', name: 'Asgan', share: 3550, paid: true },
      { id: 'p4', name: 'Kasun', share: 3550, paid: true },
      { id: 'p5', name: 'Nimal', share: 3550, paid: true },
    ],
  },
];

export const INITIAL_FRIENDS: Friend[] = [
  {
    id: 'f1',
    name: 'Asgan Mohamed',
    username: '@asgan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    balance: -1200, // You owe Asgan 1200
  },
  {
    id: 'f2',
    name: 'Chamod Fernando',
    username: '@chamod',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    balance: 0,
  },
  {
    id: 'f3',
    name: 'Kasun Perera',
    username: '@kasun_p',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    balance: 1150, // Kasun owes you 1150
  },
  {
    id: 'f4',
    name: 'Saritha Wickramasinghe',
    username: '@saritha',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    balance: -2833, // You owe Saritha
  },
  {
    id: 'f5',
    name: 'Dilshan Silva',
    username: '@dilshan_s',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    balance: 0,
    isPendingRequest: true,
  },
];
