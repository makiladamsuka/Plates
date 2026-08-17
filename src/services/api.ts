const API_URL = 'http://localhost:3000/api';

export const api = {
  getBills: async () => {
    const res = await fetch(`${API_URL}/bills`);
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
    if (!res.ok) throw new Error('Failed to create bill');
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
