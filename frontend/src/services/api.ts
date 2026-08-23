import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper to get authentication headers with active Supabase session JWT bearer token.
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      headers['Authorization'] = 'Bearer guest-token';
    }
  } catch (err) {
    headers['Authorization'] = 'Bearer guest-token';
  }

  return headers;
}

export const api = {
  getBills: async (userId?: string) => {
    const headers = await getAuthHeaders();
    const url = userId ? `${API_URL}/bills?userId=${userId}` : `${API_URL}/bills`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch bills');
    return res.json();
  },

  getBill: async (id: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/bills/${id}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch bill');
    return res.json();
  },

  createBill: async (billData: any) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/bills`, {
      method: 'POST',
      headers,
      body: JSON.stringify(billData),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to create bill');
    }
    return res.json();
  },

  acceptBill: async (id: string, userId: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/bills/${id}/accept`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to accept bill');
    return res.json();
  },

  declineBill: async (id: string, userId: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/bills/${id}/decline`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to decline bill');
    return res.json();
  },

  payBill: async (id: string, friendId: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/bills/${id}/pay`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ friendId }),
    });
    if (!res.ok) throw new Error('Failed to pay bill');
    return res.json();
  },
};
