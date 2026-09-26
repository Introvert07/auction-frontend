import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Gavel, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE } from '../api';

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

export default JoinPage;
