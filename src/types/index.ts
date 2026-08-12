export type CategoryType = 'Restaurant' | 'Grocery' | 'Shopping' | 'Utilities' | 'Travel';

export type BillStatus = 'Pending' | 'Settled';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  share: number;
  paid: boolean;
}

export interface Bill {
  id: string;
  title: string;
  category: CategoryType;
  date: string;
  amount: number;
  currency: string;
  status: BillStatus;
  creator: string;
  peopleCount: number;
  participants: Participant[];
  createdAt: number;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  balance: number;
  isPendingRequest?: boolean;
}

export type TabType = 'home' | 'bills' | 'friends' | 'settings';

export type SortOption = 'all' | 'highest' | 'lowest' | 'oldest';

export type ThemeMode = 'dark' | 'light';

