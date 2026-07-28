import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { Calendar, Filter, Zap, TrendingUp, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { useMeter } from '../contexts/MeterContext';
import { MeterReading } from '../types';
import { formatCurrency } from '../utils/formatters';

export const Analytics: React.FC = () => {
  const { selectedMeter } = useMeter();
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReadings = async () => {
    if (!selectedMeter) return;
    try {
      setLoading(true);
      const res = await api.get(`/meters/${selectedMeter.id}/readings`);
      setReadings(res.data.reverse()); // Chronological order
    } catch (err) {
      console.error('Failed to load readings history for analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [selectedMeter]);

  const chartData = readings.map((r) => ({
    date: new Date(r.captured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    kwh: r.consumption,
    reading: r.reading_value,
  }));

  // Calculate Monthly Aggregation for Bar Chart
  const monthlyDataMap = new Map<string, number>();
  readings.forEach(r => {
    const monthYear = new Date(r.captured_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    monthlyDataMap.set(monthYear, (monthlyDataMap.get(monthYear) || 0) + r.consumption);
  });
  
  const monthlyChartData = Array.from(monthlyDataMap, ([month, consumption]) => ({
    month,
    consumption: Math.round(consumption * 10) / 10
  })).slice(-12); // Max 12 months

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Electricity Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">
          Detailed historical consumption patterns, daily breakdown, and heatmap analytics.
        </p>
      </div>

      {/* Main Consumption Area Chart */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Zap className="text-emerald-400" size={20} />
            Daily Consumption Trend (kWh)
          </h3>
          <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-xl text-xs text-slate-400">
            <Calendar size={14} />
            <span>Last 60 Days</span>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="kwh" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorKwh)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Monthly Consumption Bar Chart */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <BarChart3 className="text-cyan-400" size={20} />
            Monthly Consumption Comparison
          </h3>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#1e293b' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
              />
              <Bar dataKey="consumption" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Consumption (kWh)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* GitHub Style Calendar Heatmap Representation */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-4">
          Calendar Electricity Heatmap
        </h3>
        <p className="text-xs text-slate-400">Usage intensity representation per recorded day.</p>
        
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2 pt-2">
          {readings.slice(-70).map((r, i) => {
            const intensity = r.consumption > 12 ? 'bg-rose-500' : r.consumption > 8 ? 'bg-amber-500' : r.consumption > 4 ? 'bg-emerald-500' : 'bg-slate-800';
            return (
              <div
                key={i}
                title={`${new Date(r.captured_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}: ${r.consumption} kWh`}
                className={`h-8 rounded-lg ${intensity} opacity-80 hover:opacity-100 transition cursor-pointer flex items-center justify-center text-[10px] font-mono text-slate-950 font-bold`}
              >
                {r.consumption > 0 ? Math.round(r.consumption) : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
