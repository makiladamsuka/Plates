const API_URL = 'http://localhost:3000/api';

export const api = {
  getBills: async (userId?: string) => {
    const url = userId ? `${API_URL}/bills?userId=${userId}` : `${API_URL}/bills`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch bills');
    return res.json();
  },

  getBill: async (id: string) => {
    const res = await fetch(`${API_URL}/bills/${id}`);
    if (!res.ok) throw new Error('Failed to fetch bill');
    return res.json();
  },

  createBill: async (billData: any) => {
    const res = await fetch(`${API_URL}/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(billData),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to create bill');
    }
    return res.json();
  },

  acceptBill: async (id: string, userId: string) => {
    const res = await fetch(`${API_URL}/bills/${id}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to accept bill');
    return res.json();
  },

  declineBill: async (id: string, userId: string) => {
    const res = await fetch(`${API_URL}/bills/${id}/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to decline bill');
    return res.json();
  },

  payBill: async (id: string, friendId: string) => {
    const res = await fetch(`${API_URL}/bills/${id}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ friendId }),
    });
    if (!res.ok) throw new Error('Failed to pay bill');
    return res.json();
  },
};
