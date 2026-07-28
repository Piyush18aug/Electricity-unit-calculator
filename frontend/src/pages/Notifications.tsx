import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import api from '../services/api';
import { NotificationItem } from '../types';

export const Notifications: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Notification Center</h1>
        <p className="text-slate-400 text-sm mt-1">Alerts on high electricity consumption spikes and bill budget targets.</p>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="glass-card p-4 flex items-start space-x-3">
            {n.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : n.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-200">{n.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
