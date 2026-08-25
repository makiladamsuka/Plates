import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { supabase } from './utils/supabase.js';
import { authenticate } from './middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Security HTTP Headers with CSP configured for Supabase & Google OAuth
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "https://accounts.google.com"],
        connectSrc: [
          "'self'",
          "https://*.supabase.co",
          "wss://*.supabase.co",
          "https://accounts.google.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.googleusercontent.com",
          "https://*.supabase.co",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
      },
    },
  })
);

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

// Step 1: Participant marks payment as sent (awaiting creator confirmation)
app.post('/api/bills/:id/send-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body;
    
    const { data, error } = await supabase
      .from('participants')
      .update({ payment_sent: true, accepted: true, paid: false })
      .eq('bill_id', id)
      .eq('friend_id', friendId)
      .select();
      
    if (error) throw error;

    res.json({ message: 'Payment marked as sent, awaiting creator confirmation', data });
  } catch (err: any) {
    handleError(res, err);
  }
});

// Step 2: Creator confirms receipt of payment
app.post('/api/bills/:id/confirm-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body;
    
    const { data, error } = await supabase
      .from('participants')
      .update({ paid: true, payment_sent: true, accepted: true })
      .eq('bill_id', id)
      .eq('friend_id', friendId)
      .select();
      
    if (error) throw error;

    // Check if all participants are paid
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

    res.json({ message: 'Payment confirmed by creator', data, allPaid });
  } catch (err: any) {
    handleError(res, err);
  }
});

// Step 2 Alternate: Creator declines receipt of payment (not received)
app.post('/api/bills/:id/decline-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body;
    
    const { data, error } = await supabase
      .from('participants')
      .update({ payment_sent: false, paid: false })
      .eq('bill_id', id)
      .eq('friend_id', friendId)
      .select();
      
    if (error) throw error;

    res.json({ message: 'Payment receipt declined', data });
  } catch (err: any) {
    handleError(res, err);
  }
});

// Settle user's share (Legacy direct Pay endpoint)
app.post('/api/bills/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body;
    
    const { data, error } = await supabase
      .from('participants')
      .update({ paid: true, payment_sent: true })
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

// Delete a bill (Creator can delete anytime; Participants can only remove settled bills)
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const effectiveUserId = (req as any).user?.id || req.body?.userId || req.query?.userId;

    if (!effectiveUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // 1. Fetch the bill and its participants
    const { data: bill, error: fetchErr } = await supabase
      .from('bills')
      .select('*, participants(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const isCreator = bill.creator_id === effectiveUserId;
    const isParticipant = (bill.participants || []).some((p: any) => p.friend_id === effectiveUserId);

    if (!isCreator && !isParticipant) {
      return res.status(403).json({ error: 'You are not authorized to modify this bill' });
    }

    if (isCreator) {
      // Bill owner / creator can delete without any problem
      const { error: partErr } = await supabase
        .from('participants')
        .delete()
        .eq('bill_id', id);
      if (partErr) throw partErr;

      const { error: billErr } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);
      if (billErr) throw billErr;

      return res.json({ message: 'Bill deleted successfully', isCreator: true });
    } else {
      // Non-creator participant: cannot delete unsettled bills
      const isSettled = bill.status === 'Settled';
      const myPart = (bill.participants || []).find((p: any) => p.friend_id === effectiveUserId);
      const isMySharePaid = myPart?.paid === true;

      if (!isSettled && !isMySharePaid) {
        return res.status(403).json({
          error: 'Only the bill creator can delete an unsettled bill. You can only remove bills once they are settled.'
        });
      }

      // Remove this participant's record from the settled bill
      const { error: partErr } = await supabase
        .from('participants')
        .delete()
        .eq('bill_id', id)
        .eq('friend_id', effectiveUserId);
      if (partErr) throw partErr;

      return res.json({ message: 'Settled bill removed from your list', isCreator: false });
    }
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
    res.json(data?.map((d: any) => d.profiles) || []);
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
// Accept a friend request
app.post('/api/friends/accept', async (req, res) => {
  try {
    const { requesterId, friendId } = req.body;
    
    if (!requesterId || !friendId) {
      return res.status(400).json({ error: 'requesterId and friendId are required' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    const supabaseUrl = process.env.SUPABASE_URL || 'https://rvxyaepqrvtmprfjhtld.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_9h1vRM946kBiK5gBKZTUBQ_8DeObQYA';
    const dbClient = token
      ? createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
      : supabase;

    // 1. Try Supabase RPC first
    const { error: rpcErr } = await dbClient.rpc('accept_friend_request', {
      p_requester_id: requesterId,
      p_friend_id: friendId
    });

    if (rpcErr) {
      // Fallback: direct table updates
      const { error: e1 } = await dbClient
        .from('friends')
        .update({ status: 'accepted' })
        .eq('user_id', requesterId)
        .eq('friend_id', friendId);

      if (e1) console.warn('Direct friend update notice:', e1);

      const { error: e2 } = await dbClient
        .from('friends')
        .upsert({
          user_id: friendId,
          friend_id: requesterId,
          status: 'accepted'
        }, { onConflict: 'user_id,friend_id' });

      if (e2) console.warn('Direct reciprocal friend upsert notice:', e2);
    }

    res.json({ message: 'Friend request accepted successfully' });
  } catch (err: any) {
    handleError(res, err);
  }
});

// Remove a friend (Only allowed if all shared bills are settled)
app.delete('/api/friends', async (req, res) => {
  try {
    const effectiveUserId = (req as any).user?.id || req.body?.userId;
    const { friendId } = req.body;

    if (!effectiveUserId || !friendId) {
      return res.status(400).json({ error: 'User ID and Friend ID are required' });
    }

    // 1. Fetch all bills involving both users
    const { data: bills, error: billsErr } = await supabase
      .from('bills')
      .select('id, title, status, creator_id, participants(*)');

    if (billsErr) throw billsErr;

    const sharedBills = (bills || []).filter((b: any) => {
      const parts = b.participants || [];
      const isUserInvolved = b.creator_id === effectiveUserId || parts.some((p: any) => p.friend_id === effectiveUserId);
      const isFriendInvolved = b.creator_id === friendId || parts.some((p: any) => p.friend_id === friendId);
      return isUserInvolved && isFriendInvolved;
    });

    // Check for any unsettled shared bill or unpaid balance between them
    const unsettledBills = sharedBills.filter((b: any) => {
      if (b.status === 'Settled') return false;

      const isUserCreator = b.creator_id === effectiveUserId;
      const isFriendCreator = b.creator_id === friendId;
      const friendPart = (b.participants || []).find((p: any) => p.friend_id === friendId);
      const userPart = (b.participants || []).find((p: any) => p.friend_id === effectiveUserId);

      // If user is creator and friend hasn't paid
      if (isUserCreator && friendPart && !friendPart.paid) return true;
      // If friend is creator and user hasn't paid
      if (isFriendCreator && userPart && !userPart.paid) return true;
      // If general bill is not settled
      if (b.status !== 'Settled') {
        if ((friendPart && !friendPart.paid) || (userPart && !userPart.paid)) {
          return true;
        }
      }
      return false;
    });

    if (unsettledBills.length > 0) {
      return res.status(400).json({
        error: `Cannot delete friend: You have ${unsettledBills.length} unsettled bill(s) with this friend. Please settle all bills before deleting.`,
        unsettledBills: unsettledBills.map((b: any) => ({ id: b.id, title: b.title, status: b.status }))
      });
    }

    // 2. Perform friend deletion from both directions if all bills are settled
    const { error: delErr1 } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', effectiveUserId)
      .eq('friend_id', friendId);

    if (delErr1) throw delErr1;

    // Delete reciprocal link
    await supabase
      .from('friends')
      .delete()
      .eq('user_id', friendId)
      .eq('friend_id', effectiveUserId);

    res.json({ message: 'Friend removed successfully' });
  } catch (err: any) {
    handleError(res, err);
  }
});

// Delete user account (Only allowed if all debts and payments with all friends are 0 / settled)
app.delete('/api/account', async (req, res) => {
  try {
    const effectiveUserId = (req as any).user?.id || req.body?.userId;

    if (!effectiveUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    const supabaseUrl = process.env.SUPABASE_URL || 'https://rvxyaepqrvtmprfjhtld.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_9h1vRM946kBiK5gBKZTUBQ_8DeObQYA';
    const dbClient = token
      ? createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
      : supabase;

    // 1. Fetch all bills involving this user
    const { data: bills, error: billsErr } = await dbClient
      .from('bills')
      .select('id, title, status, creator_id, participants(*)');

    if (billsErr) throw billsErr;

    const userBills = (bills || []).filter((b: any) => {
      const parts = b.participants || [];
      return b.creator_id === effectiveUserId || parts.some((p: any) => p.friend_id === effectiveUserId);
    });

    // 2. Check for any unsettled bill or unpaid participant share
    const unsettledBills = userBills.filter((b: any) => {
      if (b.status === 'Settled') return false;

      const isCreator = b.creator_id === effectiveUserId;
      const parts = b.participants || [];

      if (isCreator) {
        // If user is creator, all participants must be paid for the bill to be settled
        const hasUnpaidParticipants = parts.some((p: any) => !p.paid);
        if (hasUnpaidParticipants) return true;
      } else {
        // If user is a participant, user's own share must be paid
        const userPart = parts.find((p: any) => p.friend_id === effectiveUserId);
        if (userPart && !userPart.paid) return true;
      }

      return false;
    });

    if (unsettledBills.length > 0) {
      return res.status(400).json({
        error: `Cannot delete account: You have ${unsettledBills.length} unsettled bill(s). Please settle all payments and debts with all friends first.`,
        unsettledCount: unsettledBills.length,
      });
    }

    // 3. Clean up database records
    // A. Delete user's participant entries in other bills
    await dbClient.from('participants').delete().eq('friend_id', effectiveUserId);

    // B. Delete bills created by this user (and their participants)
    const userCreatedBillIds = (bills || []).filter((b: any) => b.creator_id === effectiveUserId).map((b: any) => b.id);
    if (userCreatedBillIds.length > 0) {
      await dbClient.from('participants').delete().in('bill_id', userCreatedBillIds);
      await dbClient.from('bills').delete().eq('creator_id', effectiveUserId);
    }

    // C. Delete all friend relationships (both directions)
    await dbClient.from('friends').delete().eq('user_id', effectiveUserId);
    await dbClient.from('friends').delete().eq('friend_id', effectiveUserId);

    // D. Delete profile from profiles table
    await dbClient.from('profiles').delete().eq('id', effectiveUserId);

    // E. Attempt Supabase Auth admin delete if available
    try {
      if (supabase.auth.admin && typeof supabase.auth.admin.deleteUser === 'function') {
        await supabase.auth.admin.deleteUser(effectiveUserId);
      }
    } catch (authErr) {
      console.warn('Auth admin delete notice:', authErr);
    }

    res.json({ success: true, message: 'Account and associated records deleted successfully' });
  } catch (err: any) {
    handleError(res, err);
  }
});

// Serve static frontend files in production
const possibleDistPaths = [
  path.join(__dirname, '../../frontend/dist'),
  path.join(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.join(__dirname, '../../dist'),
  path.join(__dirname, '../dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), '../dist')
];
const frontendDistPath = possibleDistPaths.find(p => fs.existsSync(p)) || path.resolve(process.cwd(), 'frontend/dist');
console.log(`📦 Serving static frontend from: ${frontendDistPath} (exists: ${fs.existsSync(frontendDistPath)})`);
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// Express 5 compatible catch-all route using regex /.*/
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

app.listen(port, () => {
  console.log(`🔒 Security-hardened server running on port ${port}`);
});
