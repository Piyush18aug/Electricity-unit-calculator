import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { MeterProvider } from '../contexts/MeterContext';

export const MainLayout: React.FC = () => {
  const { token, loading, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user?.settings?.theme) {
      const theme = user.settings.theme;
      const html = document.documentElement;
      
      if (theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('theme-light');
      } else {
        html.classList.remove('theme-light');
      }
    }
  }, [user?.settings?.theme]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Loading WattWise Dashboard...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <MeterProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex">
        {/* Desktop & Mobile Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
          } pb-6`}
        >
          <Header setMobileMenuOpen={setMobileMenuOpen} />
          <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </MeterProvider>
  );
};
