import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { Trophy, Users, Lock, ShoppingBag, ArrowUpRight, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE = 'https://auction-backend-3g08.onrender.com';
const socket = io(API_BASE);

// --- JOIN COMPONENT ---
const Join = ({ setUser, isAdmin = false }) => {
  const [formData, setFormData] = useState({ name: isAdmin ? "ADMIN" : "", token: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!formData.token || (!isAdmin && !formData.name)) return toast.error("Fill all fields");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/join`, {
        name: isAdmin ? "ADMIN" : formData.name.toUpperCase(),
        token: formData.token.toUpperCase()
      });
      const userData = { ...res.data, sessionToken: formData.token.toUpperCase() };
      
      // PERSISTENCE: Save to localStorage
      localStorage.setItem('auction_user', JSON.stringify(userData));
      
      setUser(userData);
      socket.emit('join_room', userData.sessionToken);
      navigate(isAdmin ? '/admin-panel' : '/auction');
    } catch (err) { 
        toast.error("Login Failed"); 
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#020617] flex items-center justify-center p-6 text-white font-sans">
      <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/10 w-full max-w-sm">
        <h1 className={`text-2xl font-black mb-6 text-center ${isAdmin ? 'text-red-500' : 'text-yellow-500'}`}>
          {isAdmin ? 'ADMIN ACCESS' : 'AUCTION JOIN'}
        </h1>
        <div className="space-y-4">
          {!isAdmin && <input className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 uppercase" placeholder="Team Name" onChange={(e)=>setFormData({...formData, name: e.target.value})} />}
          <input className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 uppercase" placeholder="Session Token" onChange={(e)=>setFormData({...formData, token: e.target.value})} />
          <button 
            onClick={handleJoin} 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black text-black transition-all active:scale-95 flex items-center justify-center gap-2 ${isAdmin ? 'bg-red-500' : 'bg-yellow-500'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'ENTER'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  // PERSISTENCE: Initialize state from localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auction_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [components, setComponents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);
  const [btnLoading, setBtnLoading] = useState(null);

  const refreshData = async () => {
    if (!user) return;
    try {
      const [cRes, tRes] = await Promise.all([
        axios.get(`${API_BASE}/api/components`),
        axios.get(`${API_BASE}/api/leaderboard/${user.sessionToken}`)
      ]);
      setComponents(cRes.data);
      setTeams(tRes.data.sort((a,b) => b.purse - a.purse));
      
      const me = tRes.data.find(x => x._id === user._id);
      if(me) {
        const updatedUser = { ...user, purse: me.purse, squad: me.squad };
        setUser(updatedUser);
        localStorage.setItem('auction_user', JSON.stringify(updatedUser));
      }
    } catch (e) { console.error("Refresh Error"); }
    finally { setBtnLoading(null); }
  };

  useEffect(() => {
    if (user) {
      // Re-join socket room on refresh
      socket.emit('join_room', user.sessionToken);
      
      refreshData();
      socket.on('new_item_live', (id) => { setActiveItemId(id); refreshData(); });
      socket.on('bid_updated', refreshData);
      socket.on('item_sold', (data) => { setActiveItemId(null); refreshData(); toast.success(`${data.winnerName} BOUGHT IT!`); });
      socket.on('item_skipped', () => { setActiveItemId(null); refreshData(); });
      return () => { socket.off(); };
    }
  }, [user?.sessionToken]); // Re-run if session token exists

  const activeItem = components.find(c => c._id === activeItemId);

  const handleAction = (action, payload, id) => {
    setBtnLoading(id);
    socket.emit(action, payload);
    setTimeout(() => setBtnLoading(null), 2000);
  };

  const logout = () => {
    localStorage.removeItem('auction_user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Join setUser={setUser} />} />
        <Route path="/admin-login" element={<Join setUser={setUser} isAdmin={true} />} />
        
        <Route path="/auction" element={
          user ? (
            <div className="min-h-screen bg-[#020617] text-white p-4">
              <div className="max-w-6xl mx-auto flex justify-between bg-slate-900 p-5 rounded-2xl border border-white/5 mb-6">
                <div><p className="text-[10px] text-yellow-500 font-bold uppercase">Team Name</p><h2 className="text-xl font-black">{user.name}</h2></div>
                <div className="text-right">
                    <p className="text-[10px] text-green-500 font-bold uppercase">Budget Left</p>
                    <h2 className="text-2xl font-mono font-black text-green-400">₹{(user.purse/100000).toFixed(2)}L</h2>
                    <button onClick={logout} className="text-[9px] text-slate-500 underline mt-1">Exit Session</button>
                </div>
              </div>

              <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 h-fit">
                    <h3 className="font-black text-xs mb-4 text-blue-400 flex items-center gap-2"><Users size={16}/> LEADERBOARD</h3>
                    {teams.map((t, i) => (
                        <div key={t._id} className={`flex justify-between p-3 rounded-xl mb-2 ${t._id === user._id ? 'bg-yellow-500/10 border border-yellow-500' : 'bg-black/20'}`}>
                            <span className="text-sm font-bold">{i+1}. {t.name}</span>
                            <span className="font-mono text-green-400">₹{(t.purse/100000).toFixed(2)}L</span>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] border-2 border-blue-600 shadow-2xl text-center">
                        {activeItem ? (
                            <>
                                <h2 className="text-5xl font-black mb-8">{activeItem.name}</h2>
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <p className="text-xs text-slate-500 uppercase">Current Bid</p>
                                        <p className="text-3xl font-mono font-black text-green-400">₹{activeItem.currentBid / 100000}L</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <p className="text-xs text-slate-500 uppercase">Highest Bidder</p>
                                        <p className="text-2xl font-black text-yellow-500 truncate">{activeItem.highestBidderName || "---"}</p>
                                    </div>
                                </div>
                                <button 
                                    disabled={btnLoading === 'bid'}
                                    onClick={() => handleAction('place_bid', { userId: user._id, componentId: activeItemId, bidAmount: (activeItem.currentBid || 0) + 200000, sessionToken: user.sessionToken }, 'bid')}
                                    className="w-full py-6 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                    {btnLoading === 'bid' ? <Loader2 className="animate-spin" /> : "BID +2,00,000"}
                                </button>
                            </>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-slate-600 font-black uppercase tracking-widest">Waiting for next auction...</div>
                        )}
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                        <h3 className="font-black text-xs mb-4 text-pink-500 flex items-center gap-2"><ShoppingBag size={18}/> YOUR SQUAD ({user.squad?.length || 0})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {components.filter(c => user.squad?.includes(c._id)).map(item => (
                                <div key={item._id} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                    <p className="text-xs font-black truncate">{item.name}</p>
                                    <p className="text-[10px] text-green-400 font-mono font-bold mt-1">₹{item.currentBid/100000}L</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            </div>
          ) : <Navigate to="/" />
        } />

        <Route path="/admin-panel" element={
          user && user.name === "ADMIN" ? (
            <div className="min-h-screen bg-[#020617] text-white p-6">
              <div className="flex justify-between items-center mb-8 bg-slate-900 p-5 rounded-2xl border border-red-500/20">
                <h1 className="font-black text-red-500 uppercase tracking-tighter flex items-center gap-2">
                  <Lock size={18}/> ADMIN CONTROL: {user.sessionToken}
                </h1>
                <button onClick={logout} className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold hover:bg-red-900 transition-colors">LOGOUT</button>
              </div>

              <div className="grid lg:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <h3 className="font-black text-xs mb-4 text-blue-400 flex items-center gap-2"><Users size={16}/> TEAMS STATUS</h3>
                  {teams.map((t) => (
                    <div key={t._id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-black text-yellow-500">{t.name}</span>
                        <span className="font-mono text-green-400 text-xs">₹{(t.purse/100000).toFixed(2)}L</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {components.filter(c => t.squad?.includes(c._id)).map(item => (
                          <span key={item._id} className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md border border-blue-500/20">{item.name}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-3">
                  <h3 className="font-black text-xs mb-4 text-slate-500 flex items-center gap-2"><ShoppingBag size={16}/> INVENTORY</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {components.map(item => {
                      const isActive = activeItemId === item._id;
                      const isThisLoading = btnLoading === item._id;
                      return (
                        <div key={item._id} className={`p-5 rounded-2xl border transition-all ${isActive ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-xl' : 'bg-slate-950 border-white/5'}`}>
                          <h4 className="font-black uppercase truncate mb-4 text-sm">{item.name}</h4>
                          {item.isSold ? (
                            <div className="space-y-1">
                              <div className="text-[10px] text-green-500 font-bold bg-green-500/5 p-2 rounded text-center border border-green-500/20">SOLD TO: {item.highestBidderName}</div>
                              <p className="text-center text-[9px] text-slate-500 font-mono">₹{item.currentBid/100000}L</p>
                            </div>
                          ) : isActive ? (
                            <div className="space-y-2">
                              <button 
                                onClick={() => handleAction('finish_bid', {componentId: item._id, sessionToken: user.sessionToken}, item._id)} 
                                disabled={!item.highestBidder || isThisLoading} 
                                className={`w-full py-3 rounded-xl text-xs font-black flex items-center justify-center ${item.highestBidder ? 'bg-green-600' : 'bg-slate-800 text-slate-600'}`}>
                                {isThisLoading ? <Loader2 className="animate-spin" size={16}/> : "MARK SOLD"}
                              </button>
                              <button onClick={() => handleAction('skip_item', {sessionToken: user.sessionToken}, item._id)} className="w-full py-2 bg-slate-800 rounded-xl text-xs font-black">SKIP</button>
                            </div>
                          ) : (
                            <button 
                                onClick={() => handleAction('start_item_auction', {id: item._id, sessionToken: user.sessionToken}, item._id)} 
                                disabled={activeItemId !== null || isThisLoading} 
                                className={`w-full py-3 rounded-xl text-xs font-black flex items-center justify-center ${activeItemId ? 'opacity-20' : 'bg-blue-600 hover:bg-blue-500'}`}>
                                {isThisLoading ? <Loader2 className="animate-spin" size={16}/> : "START"}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : <Navigate to="/admin-login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;