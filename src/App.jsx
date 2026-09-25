import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, Link } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import {
  Trophy, Users, Lock, ShoppingBag, Wifi, WifiOff,
  Loader2, Timer, Gavel, RefreshCw, Zap, ArrowRight,
  Crown, ChevronDown, Pause, Play, LogOut, Shield,
  CheckCircle2, XCircle, AlertTriangle, Sparkles
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ---------------------------------------------------------------------------
// API configuration
// ---------------------------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_URL || "https://auction-backend-eta.vercel.app";

const socket = io(API_BASE, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (n) => {
  const val = (n || 0) / 100000;
  return `₹${val.toFixed(2)}L`;
};

const fmtCompact = (n) => {
  const val = (n || 0) / 100000;
  if (val >= 100) return `₹${(val / 100).toFixed(1)}Cr`;
  return `₹${val.toFixed(1)}L`;
};

// ---------------------------------------------------------------------------
// Connection Badge
// ---------------------------------------------------------------------------
const ConnectionBadge = ({ connected }) => (
  <div className={`conn-badge ${connected ? 'conn-live' : 'conn-offline'}`}>
    {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
    {connected ? 'Live' : 'Reconnecting…'}
  </div>
);

// ---------------------------------------------------------------------------
// Landing Page — choose Junior or Admin
// ---------------------------------------------------------------------------
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-bg flex items-center justify-center p-6 bg-mesh">
      <div className="w-full max-w-md animate-scale-in" style={{ animationDelay: '0.1s' }}>
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 mb-6 animate-float">
            <Gavel size={36} className="text-amber-400" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-2">
            <span className="text-gradient-gold">FLUX</span>
            <span className="text-white/90"> AUCTION</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Real-time bidding. Zero race conditions.</p>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/join')}
            className="w-full glass-card-strong p-6 text-left group hover:border-amber-500/30 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Users size={22} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Join as Team</h3>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">Enter the auction room & bid</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
          </button>

          <button
            onClick={() => navigate('/admin-login')}
            className="w-full glass-card-strong p-6 text-left group hover:border-red-500/30 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Shield size={22} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Admin Panel</h3>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">Control the auction flow</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-8 font-medium">
          Built with ⚡ by FLUX
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Join Page
// ---------------------------------------------------------------------------
const JoinPage = ({ setUser, isAdmin = false }) => {
  const [formData, setFormData] = useState({ name: isAdmin ? 'ADMIN' : '', token: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!formData.token.trim()) return toast.error('Enter a session token');
    if (!isAdmin && !formData.name.trim()) return toast.error('Enter your team name');
    if (loading) return; // prevent double-click

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/join`, {
        name: isAdmin ? 'ADMIN' : formData.name.toUpperCase().trim(),
        token: formData.token.toUpperCase().trim(),
      });
      const userData = { ...res.data, sessionToken: formData.token.toUpperCase().trim() };
      localStorage.setItem('auction_user', JSON.stringify(userData));
      setUser(userData);
      navigate(isAdmin ? '/admin-panel' : '/auction');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed — check server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg flex items-center justify-center p-6 bg-mesh">
      <div className="w-full max-w-sm animate-scale-in">
        <button
          onClick={() => navigate('/')}
          className="text-slate-600 text-xs font-bold mb-6 hover:text-slate-400 transition-colors flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="glass-card-strong p-8">
          <div className="flex justify-center mb-5">
            <div className={`p-4 rounded-2xl ${isAdmin ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
              {isAdmin ? <Shield size={28} className="text-red-400" /> : <Gavel size={28} className="text-amber-400" />}
            </div>
          </div>

          <h1 className={`text-2xl font-black mb-1 text-center tracking-tight ${isAdmin ? 'text-red-400' : 'text-gradient-gold'}`}>
            {isAdmin ? 'ADMIN ACCESS' : 'JOIN AUCTION'}
          </h1>
          <p className="text-slate-500 text-xs text-center mb-6 font-medium">
            {isAdmin ? 'Enter your room token to control the auction' : 'Enter your team name & room token'}
          </p>

          <div className="space-y-3">
            {!isAdmin && (
              <input
                id="input-team-name"
                className="input-dark"
                placeholder="Team Name"
                maxLength={20}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                autoComplete="off"
              />
            )}
            <input
              id="input-session-token"
              className="input-dark"
              placeholder="Session Token"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              autoComplete="off"
            />
            <button
              id="btn-join"
              onClick={handleJoin}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-sm tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${isAdmin
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black'
                }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>ENTER <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Auction Page (Junior / Team view)
// ---------------------------------------------------------------------------
const AuctionPage = ({
  user, components, teams, activeItemId, timerEndsAt, timeLeft,
  bidIncrement, connected, handleAction, btnLoading, logout
}) => {
  const activeItem = components.find((c) => c._id === activeItemId);
  const isWinning = activeItem && user && activeItem.highestBidderName === user.name;
  const timeIsUp = false; // Timer removed
  const timerPercent = 100;

  // Fresh user data from leaderboard
  const myTeam = teams.find((t) => t._id === user._id);
  const myPurse = myTeam?.purse ?? user.purse;
  const mySquad = myTeam?.squad ?? user.squad ?? [];

  const nextBid = activeItem
    ? (activeItem.currentBid || activeItem.basePrice || 0) + bidIncrement
    : 0;
  const canBid = activeItem && !isWinning && !timeIsUp && myPurse >= nextBid && !btnLoading;

  return (
    <div className="page-bg p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto glass-card-strong p-5 mb-6 animate-slide-up">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-amber-400 tracking-wider">{user.name}</span>
              <ConnectionBadge connected={connected} />
            </div>
            <p className="text-[10px] text-slate-600 font-semibold">Room: {user.sessionToken}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Budget</p>
            <h2 className="text-2xl md:text-3xl font-mono font-black text-gradient-green">{fmt(myPurse)}</h2>
            <button
              id="btn-logout"
              onClick={logout}
              className="text-[10px] text-slate-600 hover:text-red-400 transition-colors mt-1 font-bold flex items-center gap-1 ml-auto"
            >
              <LogOut size={10} /> Exit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="glass-card p-6 h-fit order-2 lg:order-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-black text-xs mb-4 text-blue-400 flex items-center gap-2 uppercase tracking-wider">
            <Trophy size={14} /> Leaderboard
          </h3>
          <div className="space-y-1">
            {teams.filter(t => !t.isAdmin).map((t, i) => (
              <div
                key={t._id}
                className={`lb-row ${t._id === user._id ? 'lb-row-highlight' : ''} ${i === 0 ? 'lb-row-first' : ''}`}
              >
                <span className="text-xs font-bold flex items-center gap-2 truncate">
                  {i === 0 && <Crown size={12} className="text-amber-400 flex-shrink-0" />}
                  <span className="text-slate-500 font-mono text-[10px] w-4">{i + 1}</span>
                  <span className="truncate">{t.name}</span>
                </span>
                <span className="font-mono text-emerald-400 text-xs font-bold flex-shrink-0">{fmtCompact(t.purse)}</span>
              </div>
            ))}
            {teams.filter(t => !t.isAdmin).length === 0 && (
              <p className="text-center text-xs text-slate-600 py-4">No teams yet</p>
            )}
          </div>
        </div>

        {/* Main Area */}
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
          {/* Live Auction Card */}
          <div
            className={`glass-card-strong p-8 md:p-10 relative overflow-hidden transition-all duration-500 animate-scale-in ${isWinning ? 'winning-glow' : activeItem ? 'border-blue-500/30' : ''
              }`}
          >
            {activeItem ? (
              <>
                {/* Live indicator */}
                <div className="flex justify-center items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Live Auction</span>
                </div>

                {/* Item name */}
                <h2 className="text-3xl md:text-5xl font-black mb-8 text-center truncate tracking-tight">
                  {activeItem.name}
                </h2>

                {/* Bid info */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
                  <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Current Bid</p>
                    <p className="text-2xl md:text-3xl font-mono font-black text-gradient-green">
                      {fmt(activeItem.currentBid || activeItem.basePrice)}
                    </p>
                  </div>
                  <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Highest Bidder</p>
                    <p className={`text-lg md:text-2xl font-black truncate ${isWinning ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                      {activeItem.highestBidderName || '---'}
                      {isWinning && <span className="text-xs ml-1 opacity-60">(You!)</span>}
                    </p>
                  </div>
                </div>

                {/* Bid button */}
                <button
                  id="btn-place-bid"
                  disabled={!canBid}
                  onClick={() => handleAction(
                    'place_bid',
                    {
                      userId: user._id,
                      componentId: activeItemId,
                      bidAmount: nextBid,
                      sessionToken: user.sessionToken,
                    },
                    'bid'
                  )}
                  className="btn-bid w-full py-5 md:py-6 text-xl md:text-2xl flex items-center justify-center gap-3"
                >
                  {btnLoading === 'bid' ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : isWinning ? (
                    <><CheckCircle2 size={22} /> YOU'RE WINNING</>
                  ) : timeIsUp ? (
                    <><AlertTriangle size={22} /> TIME'S UP</>
                  ) : myPurse < nextBid ? (
                    <><XCircle size={22} /> NOT ENOUGH BUDGET</>
                  ) : (
                    <><Zap size={22} /> BID {fmt(bidIncrement)}</>
                  )}
                </button>
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-600 gap-3">
                <Gavel size={40} className="opacity-30 animate-float" />
                <p className="font-black uppercase tracking-[0.2em] text-xs">Waiting for next item…</p>
                <p className="text-[10px] text-slate-700 font-medium">The admin will start the auction</p>
              </div>
            )}
          </div>

          {/* My Squad */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-black text-xs mb-4 text-pink-400 flex items-center gap-2 uppercase tracking-wider">
              <ShoppingBag size={14} /> Your Squad ({mySquad.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {components.filter((c) => mySquad.includes(c._id)).map((item) => (
                <div key={item._id} className="squad-chip">
                  <span className="truncate max-w-[120px]">{item.name}</span>
                  <span className="text-emerald-400 font-mono ml-1">{fmtCompact(item.currentBid)}</span>
                </div>
              ))}
              {mySquad.length === 0 && (
                <p className="text-xs text-slate-600 py-2 w-full text-center">No items won yet — start bidding!</p>
              )}
            </div>
          </div>

          {/* Recent Sales (All Teams) */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="font-black text-xs mb-4 text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 size={14} /> Recent Sales
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {components.filter(c => c.isSold).reverse().map((item) => (
                <div key={item._id} className="item-card item-card-sold p-3">
                  <h4 className="font-black uppercase text-[10px] truncate mb-2">{item.name}</h4>
                  <div className="space-y-1">
                    <div className="sold-badge w-full justify-center">
                      {item.highestBidderName}
                    </div>
                    <p className="text-center text-[10px] text-slate-400 font-mono">{fmt(item.currentBid)}</p>
                  </div>
                </div>
              ))}
              {components.filter(c => c.isSold).length === 0 && (
                <p className="text-xs text-slate-600 py-2 w-full col-span-full text-center">No items sold yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Admin Panel
// ---------------------------------------------------------------------------
const AdminPanel = ({
  user, components, teams, activeItemId, btnLoading, bidIncrement,
  connected, handleAction, logout
}) => {
  const [incrementInput, setIncrementInput] = useState(bidIncrement);
  const [showSetup, setShowSetup] = useState(components.length === 0);
  const [itemsText, setItemsText] = useState('');
  const [settingUp, setSettingUp] = useState(false);
  const [forceSellFor, setForceSellFor] = useState(null);
  const [forceWinnerId, setForceWinnerId] = useState('');
  const [forcePrice, setForcePrice] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  // Sync increment input when bidIncrement changes from server
  useEffect(() => {
    setIncrementInput(bidIncrement);
  }, [bidIncrement]);

  const nonAdminTeams = useMemo(() => teams.filter((t) => !t.isAdmin), [teams]);

  const submitRoomSetup = async (useDefault = false) => {
    if (settingUp) return; // prevent double-click

    let items = [];
    if (!useDefault) {
      items = itemsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(',');
          const name = (parts[0] || '').trim();
          const basePrice = Number((parts[1] || '0').trim()) || 0;
          return { name, basePrice };
        })
        .filter((it) => it.name.length > 0);

      if (items.length === 0) return toast.error('Add at least one item: "Item Name, BasePrice"');
    }

    setSettingUp(true);
    try {
      const res = await axios.post(`${API_BASE}/api/room/setup`, {
        token: user.sessionToken,
        adminId: user._id,
        items,
      });
      toast.success(`Room ready with ${res.data.count} items!`);
      setShowSetup(false);
      setItemsText('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Room setup failed');
    } finally {
      setSettingUp(false);
    }
  };

  const submitForceSell = (item) => {
    if (!forceWinnerId) return toast.error('Pick a team first');
    handleAction('force_sell', {
      sessionToken: user.sessionToken,
      adminId: user._id,
      componentId: item._id,
      winnerUserId: forceWinnerId,
      price: Number(forcePrice) || item.currentBid || item.basePrice || 0,
    }, `force-${item._id}`);
    setForceSellFor(null);
    setForceWinnerId('');
    setForcePrice('');
  };

  const handleIncrementBlur = () => {
    const val = Number(incrementInput);
    if (val >= 1000) {
      handleAction('set_bid_increment', {
        sessionToken: user.sessionToken,
        adminId: user._id,
        amount: val,
      }, 'inc');
    }
  };

  const activeItem = components.find((c) => c._id === activeItemId);
  const unsoldCount = components.filter((c) => !c.isSold).length;
  const soldCount = components.filter((c) => c.isSold).length;

  return (
    <div className="page-bg p-4 md:p-6">
      {/* Admin Header */}
      <div className="glass-card-strong p-5 mb-6 border-red-500/20 animate-slide-up">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h1 className="font-black text-red-400 uppercase tracking-tight flex items-center gap-2 text-lg">
              <Shield size={18} /> Admin: {user.sessionToken}
            </h1>
            <ConnectionBadge connected={connected} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bid increment config */}
            <div className="flex items-center gap-1 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
              <Zap size={12} className="text-slate-500" />
              <input
                id="input-increment"
                type="number"
                step={50000}
                value={incrementInput}
                onChange={(e) => setIncrementInput(e.target.value)}
                onBlur={handleIncrementBlur}
                className="w-24 bg-transparent text-xs font-mono font-bold text-center outline-none text-white"
              />
            </div>

            {/* Setup/Restart button */}
            <button
              id="btn-setup-room"
              onClick={() => setShowSetup((s) => !s)}
              className="btn-ghost px-3 py-2 text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> {components.length === 0 ? 'Setup Room' : 'Restart'}
            </button>

            {/* Logout */}
            <button
              id="btn-admin-logout"
              onClick={logout}
              className="btn-ghost px-3 py-2 text-xs flex items-center gap-1.5 hover:text-red-400 hover:border-red-500/20"
            >
              <LogOut size={12} /> Exit
            </button>
          </div>
        </div>
      </div>

      {/* Room Setup */}
      {showSetup && (
        <div className="glass-card p-6 mb-6 border-blue-500/20 animate-scale-in">
          <h3 className="font-black text-xs mb-4 text-blue-400 uppercase tracking-wider">
            {components.length === 0 ? '⚡ Setup Room' : '🔄 Restart Room'}
          </h3>

          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <h4 className="font-bold text-amber-400 mb-2 text-sm flex items-center gap-2">
              <Sparkles size={16} /> Quick Start
            </h4>
            <p className="text-xs text-slate-400 mb-3">Load the default tech stack (React, Node, AI/ML, IoT, etc.)</p>
            <button
              onClick={() => submitRoomSetup(true)}
              disabled={settingUp}
              className="btn-primary w-full sm:w-auto px-5 py-3 text-xs flex items-center justify-center gap-2"
            >
              {settingUp ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
              Start with Default Tech Stack
            </button>
          </div>

          <h4 className="font-bold text-slate-300 mb-2 text-xs uppercase tracking-wider">Or Custom Setup</h4>
          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            One item per line: <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-amber-400">Name, BasePrice</code>
            {components.length > 0 && (
              <span className="text-red-400/70"> — This will wipe all items, bids, and reset every team's purse/squad.</span>
            )}
          </p>
          <textarea
            id="textarea-items"
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            rows={5}
            placeholder={'React.js, 500000\nNode.js, 500000\nPython Flask, 500000\nArduino Uno, 500000'}
            className="w-full p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs outline-none focus:border-blue-500/50 transition-colors text-white resize-y"
          />
          <div className="flex gap-2 mt-3">
            <button
              id="btn-create-items"
              onClick={() => submitRoomSetup(false)}
              disabled={settingUp}
              className="btn-ghost px-5 py-3 text-xs flex items-center gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
            >
              {settingUp ? <Loader2 className="animate-spin" size={14} /> : 'Save Custom Items'}
            </button>
            <button
              onClick={() => setShowSetup(false)}
              className="btn-ghost px-5 py-3 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {components.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Items</p>
            <p className="text-2xl font-mono font-black text-white">{components.length}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Unsold</p>
            <p className="text-2xl font-mono font-black text-amber-400">{unsoldCount}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Sold</p>
            <p className="text-2xl font-mono font-black text-emerald-400">{soldCount}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Teams Sidebar */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="glass-card p-5 sticky top-4">
            <h3 className="font-black text-xs mb-3 text-blue-400 flex items-center gap-2 uppercase tracking-wider">
              <Users size={14} /> Teams ({nonAdminTeams.length})
            </h3>
            <div className="space-y-2">
              {nonAdminTeams.map((t) => (
                <div key={t._id} className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-black text-amber-400 truncate">{t.name}</span>
                    <span className="font-mono text-emerald-400 text-[10px] font-bold">{fmtCompact(t.purse)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {components.filter((c) => t.squad?.includes(c._id)).map((item) => (
                      <span key={item._id} className="squad-chip text-[8px]">{item.name}</span>
                    ))}
                  </div>
                </div>
              ))}
              {nonAdminTeams.length === 0 && (
                <p className="text-[10px] text-slate-600 text-center py-4">No teams joined yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="lg:col-span-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* Currently Live Item */}
          {activeItem && (
            <div className="glass-card-strong p-6 mb-6 border-blue-500/30 animate-scale-in">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Currently Live</span>
              </div>
              <h2 className="text-2xl font-black mb-3">{activeItem.name}</h2>
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className="font-mono font-bold text-emerald-400">
                  Bid: {fmt(activeItem.currentBid || activeItem.basePrice)}
                </span>
                <span className="text-amber-400 font-bold">
                  {activeItem.highestBidderName || 'No bids'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  id="btn-mark-sold"
                  onClick={() => handleAction('finish_bid', {
                    componentId: activeItem._id,
                    sessionToken: user.sessionToken,
                    adminId: user._id,
                  }, activeItem._id)}
                  disabled={!activeItem.highestBidder || btnLoading === activeItem._id}
                  className="btn-success px-5 py-3 text-xs flex items-center gap-2"
                >
                  {btnLoading === activeItem._id
                    ? <Loader2 className="animate-spin" size={14} />
                    : <CheckCircle2 size={14} />}
                  Mark Sold
                </button>
                <button
                  id="btn-skip-item"
                  onClick={() => handleAction('skip_item', {
                    sessionToken: user.sessionToken,
                    adminId: user._id,
                  }, `skip-${activeItem._id}`)}
                  className="btn-ghost px-4 py-3 text-xs"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          <h3 className="font-black text-xs mb-4 text-slate-500 flex items-center gap-2 uppercase tracking-wider">
            <ShoppingBag size={14} /> Inventory ({unsoldCount} available)
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {components.map((item) => {
              const isActive = activeItemId === item._id;
              const isThisLoading = btnLoading === item._id || btnLoading === `force-${item._id}`;

              return (
                <div
                  key={item._id}
                  className={`item-card ${isActive ? 'item-card-active' : ''} ${item.isSold ? 'item-card-sold' : ''}`}
                >
                  <h4 className="font-black uppercase text-xs truncate mb-3">{item.name}</h4>

                  {item.isSold ? (
                    <div className="space-y-1.5">
                      <div className="sold-badge w-full justify-center">
                        <CheckCircle2 size={10} /> Sold → {item.highestBidderName}
                      </div>
                      <p className="text-center text-[10px] text-slate-500 font-mono">{fmt(item.currentBid)}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {!isActive && (
                        <button
                          id={`btn-start-${item._id}`}
                          onClick={() => handleAction('start_item_auction', {
                            id: item._id,
                            sessionToken: user.sessionToken,
                            adminId: user._id,
                          }, item._id)}
                          disabled={activeItemId !== null || isThisLoading}
                          className={`btn-primary w-full py-2.5 text-[10px] flex items-center justify-center gap-1 ${activeItemId ? 'opacity-20' : ''
                            }`}
                        >
                          {isThisLoading ? <Loader2 className="animate-spin" size={12} /> : <><Gavel size={11} /> Start</>}
                        </button>
                      )}

                      {isActive && (
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-blue-400 bg-blue-500/10 rounded-lg py-1.5 border border-blue-500/20">
                            ⚡ LIVE NOW
                          </p>
                        </div>
                      )}

                      {/* Force sell */}
                      {forceSellFor === item._id ? (
                        <div className="p-2.5 bg-black/30 rounded-xl space-y-1.5 border border-amber-500/20">
                          <select
                            value={forceWinnerId}
                            onChange={(e) => setForceWinnerId(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-lg text-[10px] p-1.5 outline-none text-white"
                          >
                            <option value="">Pick team…</option>
                            {nonAdminTeams.map((t) => (
                              <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder={`Price (${item.basePrice})`}
                            value={forcePrice}
                            onChange={(e) => setForcePrice(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-lg text-[10px] p-1.5 outline-none font-mono text-white"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => submitForceSell(item)}
                              disabled={isThisLoading}
                              className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-[10px] font-black text-white transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setForceSellFor(null)}
                              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black text-white transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setForceSellFor(item._id); setForceWinnerId(''); setForcePrice(''); }}
                          className="w-full py-1.5 bg-amber-600/10 border border-amber-600/20 text-amber-500 rounded-lg text-[9px] font-bold hover:bg-amber-600/20 transition-colors"
                        >
                          Force Sell
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main App — socket wiring, state management
// ---------------------------------------------------------------------------
function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auction_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [components, setComponents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);
  const [timerEndsAt, setTimerEndsAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [bidIncrement, setBidIncrement] = useState(200000);
  const [connected, setConnected] = useState(socket.connected);
  const [btnLoading, setBtnLoading] = useState(null);

  // Refs to avoid stale closures in socket callbacks
  const userRef = useRef(user);
  userRef.current = user;
  const activeItemIdRef = useRef(activeItemId);
  activeItemIdRef.current = activeItemId;

  const fetchLeaderboard = useCallback(async (sessionToken) => {
    try {
      const res = await axios.get(`${API_BASE}/api/leaderboard/${sessionToken}`);
      setTeams(res.data.sort((a, b) => b.purse - a.purse));

      // Update the current user's local purse/squad from server truth
      const me = res.data.find((x) => x._id === userRef.current?._id);
      if (me) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, purse: me.purse, squad: me.squad };
          localStorage.setItem('auction_user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.error('Leaderboard fetch failed:', e);
    }
  }, []);

  const fetchComponents = useCallback(async (sessionToken) => {
    try {
      const res = await axios.get(`${API_BASE}/api/components/${sessionToken}`);
      setComponents(res.data);
    } catch (e) {
      console.error('Components fetch failed:', e);
    }
  }, []);

  // Socket event wiring
  useEffect(() => {
    if (!user) return;

    fetchComponents(user.sessionToken);
    fetchLeaderboard(user.sessionToken);

    const joinRoom = () => socket.emit('join_room', user.sessionToken);
    joinRoom();

    const onConnect = () => {
      setConnected(true);
      joinRoom();
      // Re-fetch everything on reconnect
      fetchComponents(user.sessionToken);
      fetchLeaderboard(user.sessionToken);
    };
    const onDisconnect = () => setConnected(false);

    const onSyncState = ({ activeItemId: aid, bidIncrement: bi, timerEndsAt: te }) => {
      setActiveItemId(aid || null);
      setBidIncrement(bi || 200000);
      setTimerEndsAt(te || null);
    };

    const onNewItemLive = ({ itemId, timerEndsAt: te }) => {
      setActiveItemId(itemId);
      setTimerEndsAt(te);
      fetchComponents(user.sessionToken);
      toast('New item is LIVE! 🔥', { icon: '⚡', duration: 3000 });
    };

    // Patch just the changed item — keeps it snappy
    const onBidUpdated = ({ componentId, currentBid, highestBidderName, highestBidderId }) => {
      setComponents((prev) =>
        prev.map((c) =>
          c._id === componentId
            ? { ...c, currentBid, highestBidderName, highestBidder: highestBidderId }
            : c
        )
      );
    };

    const onBidRejected = ({ reason }) => {
      toast.error(reason || 'Bid rejected');
      setBtnLoading(null);
    };

    const onItemSold = (data) => {
      if (!data.componentId || data.componentId === activeItemIdRef.current) {
        setActiveItemId(null);
        setTimerEndsAt(null);
      }
      fetchComponents(user.sessionToken);
      fetchLeaderboard(user.sessionToken);
      toast.success(`${data.winnerName} bought ${data.itemName} for ${fmt(data.price)}!`, { duration: 5000 });
    };

    const onItemSkipped = () => {
      setActiveItemId(null);
      setTimerEndsAt(null);
      fetchComponents(user.sessionToken);
    };

    const onIncrementUpdated = (amt) => setBidIncrement(amt);

    const onRoomReset = () => {
      setActiveItemId(null);
      setTimerEndsAt(null);
      fetchComponents(user.sessionToken);
      fetchLeaderboard(user.sessionToken);
      toast('Room has been reset by the admin 🔄', { duration: 4000 });
    };

    const onTeamJoined = () => {
      fetchLeaderboard(user.sessionToken);
    };

    const onTimerPaused = () => {
      setTimerEndsAt(null);
      toast('Timer paused ⏸️', { duration: 2000 });
    };

    const onTimerResumed = ({ timerEndsAt: te }) => {
      setTimerEndsAt(te);
      toast('Timer resumed ▶️', { duration: 2000 });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('sync_state', onSyncState);
    socket.on('new_item_live', onNewItemLive);
    socket.on('bid_updated', onBidUpdated);
    socket.on('bid_rejected', onBidRejected);
    socket.on('item_sold', onItemSold);
    socket.on('item_skipped', onItemSkipped);
    socket.on('increment_updated', onIncrementUpdated);
    socket.on('room_reset', onRoomReset);
    socket.on('team_joined', onTeamJoined);
    socket.on('timer_paused', onTimerPaused);
    socket.on('timer_resumed', onTimerResumed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sync_state', onSyncState);
      socket.off('new_item_live', onNewItemLive);
      socket.off('bid_updated', onBidUpdated);
      socket.off('bid_rejected', onBidRejected);
      socket.off('item_sold', onItemSold);
      socket.off('item_skipped', onItemSkipped);
      socket.off('increment_updated', onIncrementUpdated);
      socket.off('room_reset', onRoomReset);
      socket.off('team_joined', onTeamJoined);
      socket.off('timer_paused', onTimerPaused);
      socket.off('timer_resumed', onTimerResumed);
    };
  }, [user?.sessionToken, user?._id, fetchComponents, fetchLeaderboard]);

  // Local countdown timer
  useEffect(() => {
    if (!timerEndsAt) {
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(timerEndsAt) - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 250); // tick 4x/sec for smoother UX
    return () => clearInterval(id);
  }, [timerEndsAt]);

  // Action handler with loading state + auto-clear
  const handleAction = useCallback((action, payload, id) => {
    setBtnLoading(id);
    socket.emit(action, payload);
    // Auto-clear loading after a timeout in case no response
    setTimeout(() => setBtnLoading((cur) => (cur === id ? null : cur)), 3000);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auction_user');
    setUser(null);
    setComponents([]);
    setTeams([]);
    setActiveItemId(null);
    setTimerEndsAt(null);
    window.location.href = '/';
  }, []);

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
            />
          ) : <Navigate to="/admin-login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;