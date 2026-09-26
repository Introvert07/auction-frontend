import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, Users, Shield, ArrowRight } from 'lucide-react';

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

export default LandingPage;
