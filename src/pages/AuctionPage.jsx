import React from 'react';
import {
  Trophy, ShoppingBag, Loader2, Gavel, Zap, Crown,
  LogOut, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import { fmt, fmtCompact } from '../utils/format';
import ConnectionBadge from '../components/ConnectionBadge';

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

export default AuctionPage;
