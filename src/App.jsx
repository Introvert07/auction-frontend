import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { Trophy, Users, Lock, ShoppingBag, ArrowUpRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE = 'https://auction-backend-eta.vercel.app';
const socket = io(API_BASE);

// --- JOIN COMPONENT ---
const Join = ({ setUser, isAdmin = false }) => {
  const [formData, setFormData] = useState({ name: isAdmin ? "ADMIN" : "", token: "" });
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!formData.token || (!isAdmin && !formData.name)) return toast.error("Fill all fields");
    try {
      const res = await axios.post(`${API_BASE}/api/join`, {
        name: isAdmin ? "ADMIN" : formData.name.toUpperCase(),
        token: formData.token.toUpperCase()
      });
      const userData = { ...res.data, sessionToken: formData.token.toUpperCase() };
      setUser(userData);
      socket.emit('join_room', userData.sessionToken);
      navigate(isAdmin ? '/admin-panel' : '/auction');
    } catch (err) { toast.error("Login Failed"); }
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
          <button onClick={handleJoin} className={`w-full py-4 rounded-xl font-black text-black transition-all active:scale-95 ${isAdmin ? 'bg-red-500' : 'bg-yellow-500'}`}>ENTER</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [user, setUser] = useState(null);
  const [components, setComponents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);

  const refreshData = async () => {
    if (!user) return;
    try {
      const [cRes, tRes] = await Promise.all([
        axios.get(`${API_BASE}/api/components`),
        axios.get(`${API_BASE}/api/leaderboard/${user.sessionToken}`)
      ]);
      setComponents(cRes.data);
      const sortedTeams = tRes.data.sort((a,b) => b.purse - a.purse);
      setTeams(sortedTeams);
      
      const me = sortedTeams.find(x => x._id === user._id);
      if(me) setUser(prev => ({ ...prev, purse: me.purse, squad: me.squad }));
    } catch (e) { console.error("Refresh Error"); }
  };

  useEffect(() => {
    if (user) {
      refreshData();
      socket.on('new_item_live', (id) => { setActiveItemId(id); refreshData(); });
      socket.on('bid_updated', refreshData);
      socket.on('item_sold', (data) => { setActiveItemId(null); refreshData(); toast.success(`${data.winnerName} BOUGHT IT!`); });
      socket.on('item_skipped', () => { setActiveItemId(null); refreshData(); });
      return () => { socket.off(); };
    }
  }, [user]);

  const activeItem = components.find(c => c._id === activeItemId);

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
                <div className="text-right"><p className="text-[10px] text-green-500 font-bold uppercase">Budget Left</p><h2 className="text-2xl font-mono font-black text-green-400">₹{(user.purse/100000).toFixed(2)}L</h2></div>
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
                                <button onClick={() => socket.emit('place_bid', { userId: user._id, componentId: activeItemId, bidAmount: (activeItem.currentBid || 0) + 200000, sessionToken: user.sessionToken })}
                                    className="w-full py-6 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-2xl transition-all active:scale-95">BID +2,00,000</button>
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
                    <h1 className="font-black text-red-500 uppercase tracking-tighter flex items-center gap-2"><Lock size={18}/> SESSION: {user.sessionToken}</h1>
                    <button onClick={() => window.location.href='/'} className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold">LOGOUT</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {components.map(item => {
                        const isActive = activeItemId === item._id;
                        const hasBidder = item.highestBidder;
                        return (
                            <div key={item._id} className={`p-5 rounded-2xl border transition-all ${isActive ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-xl' : 'bg-slate-950 border-white/5'}`}>
                                <h4 className="font-black uppercase truncate mb-4">{item.name}</h4>
                                {item.isSold ? (
                                    <div className="text-[10px] text-green-500 font-bold bg-green-500/5 p-2 rounded text-center">SOLD: {item.highestBidderName}</div>
                                ) : isActive ? (
                                    <div className="space-y-2">
                                        <button onClick={() => socket.emit('finish_bid', {componentId: item._id, sessionToken: user.sessionToken})} 
                                            disabled={!hasBidder} className={`w-full py-3 rounded-xl text-xs font-black ${hasBidder ? 'bg-green-600' : 'bg-slate-800 text-slate-600'}`}>MARK SOLD</button>
                                        <button onClick={() => socket.emit('skip_item', {sessionToken: user.sessionToken})} 
                                            className="w-full py-2 bg-slate-800 rounded-xl text-xs font-black">SKIP</button>
                                    </div>
                                ) : (
                                    <button onClick={() => socket.emit('start_item_auction', {id: item._id, sessionToken: user.sessionToken})} 
                                        disabled={activeItemId !== null} className={`w-full py-3 rounded-xl text-xs font-black ${activeItemId ? 'opacity-20' : 'bg-blue-600'}`}>START</button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
          ) : <Navigate to="/admin-login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;