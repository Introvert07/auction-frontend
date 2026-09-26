import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import useAuctionSocket from './hooks/useAuctionSocket';
import LandingPage from './pages/LandingPage';
import JoinPage from './pages/JoinPage';
import AuctionPage from './pages/AuctionPage';
import AdminPanel from './pages/AdminPanel';

function App() {
  const {
    user, setUser,
    components, componentsLoaded,
    teams,
    activeItemId, timerEndsAt, timeLeft, bidIncrement,
    connected, btnLoading,
    handleAction, logout,
  } = useAuctionSocket();

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '0.75rem',
            fontWeight: 600,
            fontSize: '0.85rem',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#030712' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#030712' },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinPage setUser={setUser} />} />
        <Route path="/admin-login" element={<JoinPage setUser={setUser} isAdmin={true} />} />

        <Route path="/auction" element={
          user ? (
            <AuctionPage
              user={user}
              components={components}
              teams={teams}
              activeItemId={activeItemId}
              timerEndsAt={timerEndsAt}
              timeLeft={timeLeft}
              bidIncrement={bidIncrement}
              connected={connected}
              handleAction={handleAction}
              btnLoading={btnLoading}
              logout={logout}
            />
          ) : <Navigate to="/" />
        } />

        <Route path="/admin-panel" element={
          user && user.name === 'ADMIN' ? (
            <AdminPanel
              user={user}
              components={components}
              teams={teams}
              activeItemId={activeItemId}
              btnLoading={btnLoading}
              bidIncrement={bidIncrement}
              connected={connected}
              handleAction={handleAction}
              logout={logout}
              timeLeft={timeLeft}
              componentsLoaded={componentsLoaded}
            />
          ) : <Navigate to="/admin-login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
