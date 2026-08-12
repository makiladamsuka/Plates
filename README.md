# Plates 🍽️

**Plates** is a modern, responsive bill-splitting and expense-sharing web application built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**.

---

## 🌟 Features

- 📊 **Dashboard Overview (`HomeView`)**: Real-time summary of net balance (owed vs. owing), quick action buttons, pending requests, and recent transaction feeds.
- 💳 **Bills Management (`BillsView`)**:
  - Filter and search bills by category, creator, or title.
  - Sort by total amount (Highest / Lowest) or date (Oldest / Newest).
  - Track bill status (**Pending** vs. **Settled**).
- 👥 **Friends & Balances (`FriendsView`)**:
  - Manage friend lists with individual balance tracking.
  - Accept pending friend requests.
  - Add new friends by `@username`.
- ⚙️ **Settings (`SettingsView`)**: Profile management, linked payment methods, and theme/notification preferences.
- 💬 **Interactive Modals**:
  - **Bill Request Breakdown**: Inspect per-person cost share, settle/approve bills, or decline requests.
  - **New Bill Creator**: Quickly create and distribute new bill requests among participants.
  - **Toast System**: Instant visual notifications on status updates.

---

## 🚀 Getting Started & Setup

### 📋 Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or `pnpm`/`yarn`

---

### 💻 Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/makiladamsuka/Plates.git
   cd Plates
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The local development server will start (usually at `http://localhost:5173`).

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview the production build**:
   ```bash
   npm run preview
   ```

---

## 🛠️ Project Structure

```text
Plates/
├── public/              # Static assets
├── src/
│   ├── components/      # UI components (Header, Dock, BillCard, Modals)
│   ├── views/           # Page views (HomeView, BillsView, FriendsView, SettingsView)
│   ├── data/            # Mock dataset (INITIAL_BILLS, INITIAL_FRIENDS)
│   ├── types/           # TypeScript interfaces & type definitions
│   ├── App.tsx          # Main application component & layout state
│   ├── main.tsx         # React root entry point
│   └── index.css        # Global CSS & Tailwind CSS rules
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📜 Available Scripts

- `npm run dev` - Launches Vite dev server with Hot Module Replacement (HMR).
- `npm run build` - Compiles TypeScript and builds production assets into `dist/`.
- `npm run lint` - Runs Oxlint to check code quality.
- `npm run preview` - Previews the production build locally.
