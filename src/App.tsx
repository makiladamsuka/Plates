import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Home } from './views/Home';
import { Welcome } from './views/Welcome';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { NewBill } from './views/NewBill';
import { FriendsList } from './views/FriendsList';
import { FriendProfile } from './views/FriendProfile';
import { SearchFriends } from './views/SearchFriends';

// Pages that should hide the bottom nav (detail / flow pages)
const HIDE_NAV_PATHS = [
  '/friends/search',
  '/bills/new',
];

export default function App() {
  const location = useLocation();

  const hideNav =
    HIDE_NAV_PATHS.includes(location.pathname) ||
    (location.pathname.startsWith('/bills/') && location.pathname !== '/bills') ||
    (location.pathname.startsWith('/friends/') && location.pathname !== '/friends');

  return (
    <>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/welcome"   element={<Welcome />} />

        {/* Bills */}
        <Route path="/bills"     element={<BillsList />} />
        <Route path="/bills/new" element={<NewBill />} />
        <Route path="/bills/:id" element={<BillDetail />} />

        {/* Friends */}
        <Route path="/friends"          element={<FriendsList />} />
        <Route path="/friends/search"   element={<SearchFriends />} />
        <Route path="/friends/:id"      element={<FriendProfile />} />

        {/* Settings placeholder */}
        <Route path="/settings" element={<Home />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideNav && <BottomNav />}
    </>
  );
}
