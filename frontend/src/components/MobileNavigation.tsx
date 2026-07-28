import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart3, Camera, History, User } from 'lucide-react';

export const MobileNavigation: React.FC = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 px-4 flex items-center justify-around">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center text-xs space-y-1 ${
            isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`
        }
      >
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/analytics"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center text-xs space-y-1 ${
            isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`
        }
      >
        <BarChart3 size={20} />
        <span>Analytics</span>
      </NavLink>

      {/* Prominent Central Action Button: Scan */}
      <NavLink
        to="/scan"
        className="flex flex-col items-center justify-center -mt-6"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 text-slate-950 border-4 border-slate-950">
          <Camera size={26} className="font-bold" />
        </div>
      </NavLink>

      <NavLink
        to="/history"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center text-xs space-y-1 ${
            isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`
        }
      >
        <History size={20} />
        <span>History</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center text-xs space-y-1 ${
            isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`
        }
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </div>
  );
};
