# Plates — Monorepo

Split-bill dining app with a **React/Vite frontend** and **Node.js/Express backend**, structured for independent deployment on DigitalOcean App Platform.

## 📁 Project Structure

```
Plates/
├── frontend/          # Vite + React + Tailwind CSS app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── backend/           # Node.js + Express REST API
│   ├── src/
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🚀 Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

### Backend
```bash
cd backend
npm install
npm run dev        # → http://localhost:3001
```

## 🌊 DigitalOcean Deployment

### Frontend (Static Site)
- **Source Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_URL` (your backend service URL)

### Backend (Web Service)
- **Source Directory:** `backend`
- **Run Command:** `npm start`
- **Environment Variables:**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `API_SECRET_KEY`
  - `PORT` (DigitalOcean sets this automatically)

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS 4, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| Deployment | DigitalOcean App Platform |
