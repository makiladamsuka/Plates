import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './utils/supabase';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =============== BILLS ROUTES ===============

// Fetch all bills (optionally filter by userId)
app.get('/api/bills', async (req, res) => {
  try {
    const { userId } = req.query;
    
    let query = supabase
      .from('bills')
      .select('*, participants(*)');

    const { data, error } = await query;
      
    if (error) throw error;

    // Filter bills where user is a participant if userId is provided
    let filteredData = data;
    if (userId) {
      filteredData = (data || []).filter((bill: any) => 
        bill.creator_id === userId ||
        (bill.participants || []).some((p: any) => p.friend_id === userId)
      );
    }

    res.json(filteredData || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch a specific bill
app.get('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('bills')
      .select('*, participants(*)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new bill
app.post('/api/bills', async (req, res) => {
  try {
    const { title, category, total, status, creatorId, participants } = req.body;
    
    // Create the bill
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert([{ 
        title, 
        category, 
        total, 
        status: status || 'Pending',
        creator_id: creatorId || null
      }])
      .select()
      .single();
      
    if (billError) throw billError;
    
    // Create participants if provided
    if (participants && participants.length > 0) {
      const participantInserts = participants.map((p: any) => {
        const isCreator = creatorId && p.friendId === creatorId;
        return {
          bill_id: bill.id,
          friend_id: p.friendId,
          share: p.share,
          paid: p.paid || false,
          accepted: isCreator ? true : false // Creator auto-accepts; friends need to accept!
        };
      });
      
      const { error: partError } = await supabase
        .from('participants')
        .insert(participantInserts);
        
      if (partError) throw partError;
    }
    
    // Fetch complete bill with participants
    const { data: completeBill, error: fetchError } = await supabase
      .from('bills')
      .select('*, participants(*)')
      .eq('id', bill.id)
      .single();
      
    if (fetchError) throw fetchError;
    
    res.status(201).json(completeBill);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Accept incoming bill request
app.post('/api/bills/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const { data, error } = await supabase
      .from('participants')
      .update({ accepted: true })
      .eq('bill_id', id)
      .eq('friend_id', userId)
      .select();
      
    if (error) throw error;
    res.json({ message: 'Bill accepted', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Decline incoming bill request
app.post('/api/bills/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('bill_id', id)
      .eq('friend_id', userId);
      
    if (error) throw error;
    res.json({ message: 'Bill declined' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Settle user's share (Pay)
app.post('/api/bills/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body;
    
    const { data, error } = await supabase
      .from('participants')
      .update({ paid: true })
      .eq('bill_id', id)
      .eq('friend_id', friendId)
      .select();
      
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =============== FRIENDS ROUTES ===============

// Search profiles by name or email
app.get('/api/profiles/search', async (req, res) => {
  try {
    const { q, userId } = req.query;
    if (!q || (q as string).trim().length < 1) {
      return res.json([]);
    }

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);
    
    if (userId) {
      query = query.neq('id', userId as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get friends list for a user
app.get('/api/friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('friends')
      .select(`
        friend_id,
        created_at,
        profiles:friend_id (
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    res.json(data?.map(d => d.profiles) || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add a friend
app.post('/api/friends', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    const { data, error } = await supabase
      .from('friends')
      .insert({ user_id: userId, friend_id: friendId, status: 'pending' })
      .select();
    
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Already friends' });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a friend
app.delete('/api/friends', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', friendId);
    
    if (error) throw error;
    res.json({ message: 'Friend removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
