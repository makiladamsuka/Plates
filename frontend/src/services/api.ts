import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Proactively acquires a valid, non-expired Supabase JWT access token.
 */
async function getValidAccessToken(): Promise<string | null> {
  try {
    let { data: { session } } = await supabase.auth.getSession();

    // Check if session exists and is close to expiring (less than 60s remaining)
    const isExpiringSoon = session?.expires_at && (session.expires_at * 1000 - Date.now() < 60000);

    if (!session || isExpiringSoon) {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session) {
        session = data.session;
      }
    }

    return session?.access_token || null;
  } catch (err) {
    console.warn('[API Auth] Error fetching valid token:', err);
    return null;
  }
}

/**
 * Fetch wrapper that attaches the active bearer token and automatically
 * retries once with a fresh token if a 401 Unauthorized is returned.
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = await getValidAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkErr: any) {
    console.error(`[API Network Error] Failed to fetch from ${url}:`, networkErr);
    throw new Error(`Unable to connect to the backend server (${url}). Please check your connection and ensure the server is running.`);
  }

  // If 401 Unauthorized, refresh session and retry once
  if (res.status === 401) {
    try {
      const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
      if (!refreshErr && refreshData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${refreshData.session.access_token}`;
        res = await fetch(url, { ...options, headers });
      }
    } catch (retryErr) {
      console.warn('[API Auth] Refresh retry failed:', retryErr);
    }
  }

  return res;
}

export const api = {
  getBills: async (userId?: string) => {
    const url = userId ? `${API_URL}/bills?userId=${userId}` : `${API_URL}/bills`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to fetch bills');
    return res.json();
  },

  getBill: async (id: string) => {
    const res = await fetchWithAuth(`${API_URL}/bills/${id}`);
    if (!res.ok) throw new Error('Failed to fetch bill');
    return res.json();
  },

  createBill: async (billData: any) => {
    const res = await fetchWithAuth(`${API_URL}/bills`, {
      method: 'POST',
      body: JSON.stringify(billData),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to create bill');
    }
    return res.json();
  },

  acceptBill: async (id: string, userId: string) => {
    const res = await fetchWithAuth(`${API_URL}/bills/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to accept bill');
    return res.json();
  },

  declineBill: async (id: string, userId: string) => {
    const res = await fetchWithAuth(`${API_URL}/bills/${id}/decline`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to decline bill');
    return res.json();
  },

  sendPayment: async (id: string, friendId: string) => {
    const res = await fetchWithAuth(`${API_URL}/bills/${id}/send-payment`, {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
    if (!res.ok) throw new Error('Failed to send payment confirmation');
    return res.json();
  },

  confirmPayment: async (id: string, friendId: string) => {
    const res = await fetchWithAuth(`${API_URL}/bills/${id}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
    if (!res.ok) throw new Error('Failed to confirm payment receipt');
    return res.json();
  },

  declinePayment: async (id: string, friendId: string) => {
    const res = await fetchWithAuth(`${API_URL}/bills/${id}/decline-payment`, {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
    if (!res.ok) throw new Error('Failed to decline payment receipt');
    return res.json();
  },

  payBill: async (id: string, friendId: string) => {
    const res = await fetchWithAuth(`${API_URL}/bills/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
    if (!res.ok) throw new Error('Failed to pay bill');
    return res.json();
  },

  deleteBill: async (id: string, userId: string) => {
    const res = await fetchWithAuth(`${API_URL}/bills/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to delete bill');
    }
    return res.json();
  },

  acceptFriend: async (requesterId: string, friendId: string) => {
    const res = await fetchWithAuth(`${API_URL}/friends/accept`, {
      method: 'POST',
      body: JSON.stringify({ requesterId, friendId }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to accept friend request');
    }
    return res.json();
  },

  deleteFriend: async (userId: string, friendId: string) => {
    const res = await fetchWithAuth(`${API_URL}/friends`, {
      method: 'DELETE',
      body: JSON.stringify({ userId, friendId }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to remove friend');
    }
    return res.json();
  },

  deleteAccount: async (userId: string) => {
    const res = await fetchWithAuth(`${API_URL}/account`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to delete account');
    }
    return res.json();
  },
};
