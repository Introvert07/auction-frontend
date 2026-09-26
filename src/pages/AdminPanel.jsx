import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Shield, Zap, RefreshCw, Sparkles, Loader2, Users,
  ShoppingBag, CheckCircle2, Gavel, LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fmt, fmtCompact } from '../utils/format';
import ConnectionBadge from '../components/ConnectionBadge';
import { API_BASE } from '../api';

const AdminPanel = ({
  user, components, teams, activeItemId, btnLoading, bidIncrement,
  connected, handleAction, logout, componentsLoaded
}) => {
  const [incrementInput, setIncrementInput] = useState(bidIncrement);
  // FIX: don't decide this from `components.length` at first render — `components`
  // in the parent always starts as [] before the API fetch resolves, so this used
  // to force the Setup panel open on every admin refresh, even mid-auction.
  // We now wait for the initial fetch to actually finish (componentsLoaded) before
  // deciding, and only auto-open it once, the first time we learn the room is empty.
  const [showSetup, setShowSetup] = useState(false);
  const hasAutoOpenedSetup = useRef(false);

  useEffect(() => {
    if (componentsLoaded && !hasAutoOpenedSetup.current) {
      hasAutoOpenedSetup.current = true;
      if (components.length === 0) {
        setShowSetup(true);
      }
    }
  }, [componentsLoaded, components.length]);

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

    // FIX: guard against accidental wipes — if the room already has items/progress,
    // require an explicit confirmation before deleting everyone's squads & purses.
    if (components.length > 0) {
      const confirmed = window.confirm(
        `This room already has ${components.length} item(s) and team progress.\n\n` +
        `Continuing will WIPE all items, bids, and reset every team's purse/squad back to default.\n\n` +
        `Are you sure you want to continue?`
      );
      if (!confirmed) return;
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
            {/* FIX: this warning used to only show next to the custom-items textarea,
                so clicking Quick Start on an already-active room gave no warning at all. */}
            {components.length > 0 && (
              <p className="text-[11px] text-red-400/80 mb-3">
                ⚠️ This room already has {components.length} item(s) — starting again will wipe all items, bids, and reset every team's purse/squad.
              </p>
            )}
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

export default AdminPanel;
