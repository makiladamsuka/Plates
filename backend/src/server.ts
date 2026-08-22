import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { supabase } from './utils/supabase';
import { authenticate } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security HTTP Headers
app.use(helmet());

// CORS configuration - Restrict allowed origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiter: Max 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', apiLimiter);

// Enforce JWT authentication on API endpoints
app.use('/api/', authenticate);

// Helper function for safe error responses
const handleError = (res: express.Response, err: any) => {
  console.error('API Error:', err);
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  return res.status(500).json({ error: err.message || 'Internal Server Error' });
};

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
    let filteredData = data || [];
    if (userId) {
      filteredData = filteredData.filter((bill: any) => 
        bill.creator_id === userId ||
        (bill.participants || []).some((p: any) => p.friend_id === userId)
      );
    }

    // Enrich participants with profile information (full_name, avatar_url, email)
    const allFriendIds = Array.from(new Set(
      filteredData.flatMap((b: any) => (b.participants || []).map((p: any) => p.friend_id))
    ));

    let profilesMap: Record<string, any> = {};
    if (allFriendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', allFriendIds);
      
      (profiles || []).forEach((prof: any) => {
        profilesMap[prof.id] = prof;
      });
    }

    const enrichedBills = filteredData.map((b: any) => ({
      ...b,
      participants: (b.participants || []).map((p: any) => ({
        ...p,
        profile: profilesMap[p.friend_id] || null,
        full_name: profilesMap[p.friend_id]?.full_name || null,
        avatar_url: profilesMap[p.friend_id]?.avatar_url || null
      }))
    }));

    res.json(enrichedBills);
  } catch (err: any) {
    handleError(res, err);
  }
});

// Fetch a specific bill
app.get('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: bill, error } = await supabase
      .from('bills')
      .select('*, participants(*)')
      .eq('id', id)
      .single();
      
    if (error) throw error;

    // Enrich participants with profile information
    const friendIds = (bill.participants || []).map((p: any) => p.friend_id);
    let profilesMap: Record<string, any> = {};
    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', friendIds);
      
      (profiles || []).forEach((prof: any) => {
        profilesMap[prof.id] = prof;
      });
    }

    const enrichedBill = {
      ...bill,
      participants: (bill.participants || []).map((p: any) => ({
        ...p,
        profile: profilesMap[p.friend_id] || null,
        full_name: profilesMap[p.friend_id]?.full_name || null,
        avatar_url: profilesMap[p.friend_id]?.avatar_url || null
      }))
    };

    res.json(enrichedBill);
  } catch (err: any) {
    handleError(res, err);
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
          paid: isCreator ? true : (p.paid || false),
          accepted: isCreator ? true : false
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

    // Enrich participants with profile information
    const friendIds = (completeBill.participants || []).map((p: any) => p.friend_id);
    let profilesMap: Record<string, any> = {};
    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', friendIds);
      
      (profiles || []).forEach((prof: any) => {
        profilesMap[prof.id] = prof;
      });
    }

    const enrichedBill = {
      ...completeBill,
      participants: (completeBill.participants || []).map((p: any) => ({
        ...p,
        profile: profilesMap[p.friend_id] || null,
        full_name: profilesMap[p.friend_id]?.full_name || null,
        avatar_url: profilesMap[p.friend_id]?.avatar_url || null
      }))
    };
    
    res.status(201).json(enrichedBill);
  } catch (err: any) {
    handleError(res, err);
  }
});

// Accept incoming bill request
app.post('/api/bills/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const { data, error } = await supabase
      .from('participants')
      .update({ accepted: true, paid: false })
      .eq('bill_id', id)
      .eq('friend_id', userId)
      .select();
      
    if (error) throw error;

    await supabase
      .from('bills')
      .update({ status: 'Pending' })
      .eq('id', id);

    res.json({ message: 'Bill accepted', data, status: 'Pending' });
  } catch (err: any) {
    handleError(res, err);
  }
});

// Decline incoming bill request
app.post('/api/bills/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const { error } = await supabase
      .from('participants')
      .update({ accepted: false, paid: false })
      .eq('bill_id', id)
      .eq('friend_id', userId);
      
    if (error) throw error;

    await supabase
      .from('bills')
      .update({ status: 'Rejected' })
      .eq('id', id);

    res.json({ message: 'Bill declined' });
  } catch (err: any) {
    handleError(res, err);
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

    const { data: parts } = await supabase
      .from('participants')
      .select('paid')
      .eq('bill_id', id);

    const allPaid = parts && parts.length > 0 && parts.every((p: any) => p.paid === true);
    if (allPaid) {
      await supabase
        .from('bills')
        .update({ status: 'Settled' })
        .eq('id', id);
    }

    res.json({ message: 'Share paid', data, allPaid });
  } catch (err: any) {
    handleError(res, err);
  }
});

// =============== FRIENDS ROUTES ===============

// Search profiles by name or email with input sanitization
app.get('/api/profiles/search', async (req, res) => {
  try {
    const { q, userId } = req.query;
    if (!q || (q as string).trim().length < 1) {
      return res.json([]);
    }

    // Strip special control characters to prevent filter injection
    const sanitizedQ = (q as string).replace(/[,()%.]/g, '').trim();
    if (sanitizedQ.length < 1) {
      return res.json([]);
    }

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .or(`full_name.ilike.%${sanitizedQ}%,email.ilike.%${sanitizedQ}%`)
      .limit(10);
    
    if (userId) {
      query = query.neq('id', userId as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    handleError(res, err);
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
    handleError(res, err);
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
    handleError(res, err);
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
    handleError(res, err);
  }
});

// Serve static frontend files in production
const possibleDistPaths = [
  path.join(__dirname, '../../frontend/dist'),
  path.join(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist')
];
const frontendDistPath = possibleDistPaths.find(p => fs.existsSync(p)) || path.resolve(process.cwd(), 'frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`🔒 Security-hardened server running on port ${port}`);
});
