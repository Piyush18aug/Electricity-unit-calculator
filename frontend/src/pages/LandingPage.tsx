import React from 'react';
import { Zap, ShieldCheck, BarChart2, Camera, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Navbar */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <span className="font-extrabold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            WattWise
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles size={14} />
          <span>Next-Gen Smart Electricity Analytics</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Understand Your Electricity. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-200 bg-clip-text text-transparent">
            Control Your Spending.
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Track meter readings, analyze electricity consumption, estimate bills with custom simple/slab tariffs, detect unusual usage spikes, and make smarter energy decisions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2"
          >
            <span>Start Managing Electricity</span>
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-base border border-slate-800"
          >
            Explore Demo Dashboard
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-16">
          <div className="glass-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera size={20} />
            </div>
            <h3 className="font-bold text-white text-lg">OCR Meter Scanning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Snap a meter photo with your phone or camera to automatically extract kWh readings using OpenCV vision algorithms.
            </p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <BarChart2 size={20} />
            </div>
            <h3 className="font-bold text-white text-lg">Smart Bill Forecasting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Project month-end electricity consumption and estimated bills accurately using custom slab tariffs and linear regression models.
            </p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-white text-lg">Anomaly Alerts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically detect sudden abnormal usage spikes above your daily average and receive instant smart notifications.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        © 2026 WattWise Smart Electricity Unit Management System. All rights reserved.
      </footer>
    </div>
  );
};
