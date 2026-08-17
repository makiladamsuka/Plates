import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './utils/supabase';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Fetch all bills
app.get('/api/bills', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*, participants(*)');
      
    if (error) throw error;
    res.json(data);
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
    const { title, category, total, status, participants } = req.body;
    
    // Create the bill
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert([{ title, category, total, status }])
      .select()
      .single();
      
    if (billError) throw billError;
    
    // Create participants if provided
    if (participants && participants.length > 0) {
      const participantInserts = participants.map((p: any) => ({
        bill_id: bill.id,
        friend_id: p.friendId,
        share: p.share,
        paid: p.paid || false
      }));
      
      const { error: partError } = await supabase
        .from('participants')
        .insert(participantInserts);
        
      if (partError) throw partError;
    }
    
    // Fetch the complete bill with participants
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

// Settle user's share (Pay)
app.post('/api/bills/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body; // e.g. 'me'
    
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
