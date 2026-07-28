import React from 'react';
import { Home, Zap, ChevronDown, Bell, Menu } from 'lucide-react';
import { useMeter } from '../contexts/MeterContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({ setMobileMenuOpen }) => {
  const { properties, meters, selectedProperty, selectedMeter, setSelectedProperty, setSelectedMeter } = useMeter();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Property and Meter Selectors */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Hamburger Menu (Mobile Only) */}
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
          <Home className="w-4 h-4 text-emerald-400" />
          <select
            value={selectedProperty?.id || ''}
            onChange={(e) => {
              const prop = properties.find((p) => p.id === Number(e.target.value));
              if (prop) setSelectedProperty(prop);
            }}
            className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
          <Zap className="w-4 h-4 text-cyan-400" />
          <select
            value={selectedMeter?.id || ''}
            onChange={(e) => {
              const meter = meters.find((m) => m.id === Number(e.target.value));
              if (meter) setSelectedMeter(meter);
            }}
            className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer"
          >
            {meters.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Header Quick Actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
        </button>
      </div>
    </header>
  );
};
