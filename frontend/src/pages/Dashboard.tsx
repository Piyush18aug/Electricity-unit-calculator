import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Camera, 
  Edit3, 
  BarChart2, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  Target, 
  Award, 
  ArrowUpRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMeter } from '../contexts/MeterContext';
import api from '../services/api';
import { AnalyticsData } from '../types';
import { formatCurrency } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const { selectedMeter } = useMeter();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    if (!selectedMeter) return;
    try {
      setLoading(true);
      const res = await api.get(`/analytics/dashboard/${selectedMeter.id}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMeter]);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-800/60 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Dashboard
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
              {data.property_name} • {data.meter_name}
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time energy consumption, bill estimates, and anomaly insights.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200"
          >
            <Edit3 size={18} />
            <span>Add Manual Reading</span>
          </button>
        </div>
      </div>

      {/* Warning Banner for Awaiting Official Reading */}
      {data.cycle_status === 'AWAITING_OFFICIAL_READING' && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center space-x-3 mb-6">
          <AlertTriangle className="text-amber-400 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-amber-400 font-bold">Official meter reading due</h3>
            <p className="text-amber-200/80 text-sm">
              Your billing cycle scheduled end date has passed. Please submit an official meter reading to close the cycle and start a new one.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today Consumption */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Consumption</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-black text-white">{data.today_kwh} <span className="text-lg font-normal text-slate-400">kWh</span></h2>
            <div className="flex items-center space-x-1 mt-2 text-xs font-semibold">
              {data.today_vs_avg_pct >= 0 ? (
                <span className="text-rose-400 flex items-center"><TrendingUp size={14} className="mr-0.5" /> +{data.today_vs_avg_pct}%</span>
              ) : (
                <span className="text-emerald-400 flex items-center"><TrendingDown size={14} className="mr-0.5" /> {data.today_vs_avg_pct}%</span>
              )}
              <span className="text-slate-400 font-normal">vs daily average</span>
            </div>
          </div>
        </motion.div>

        {/* Estimated Cycle Bill (Detailed Breakdown) */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card p-5 flex flex-col justify-between row-span-2 md:col-span-2 lg:col-span-1"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {data.missing_components?.length > 0 ? "Partial Estimated Bill So Far" : "Estimated Bill So Far"}
              </span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                {data.currency_code}
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-3xl font-black text-white">{formatCurrency(data.month_to_date_cost, data.currency_code)}</h2>
              <p className="text-[11px] text-slate-400 mt-1">Based on <strong className="text-slate-200">{data.month_to_date_kwh} kWh</strong> consumed</p>
              {data.missing_components?.length > 0 && (
                <p className="text-[10px] text-amber-400 mt-1 leading-tight">
                  <AlertTriangle size={10} className="inline mr-1" />
                  Some electricity-provider charges are not included in this estimate.
                </p>
              )}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 space-y-1 border-t border-slate-800 pt-3">
            <div className="flex justify-between"><span>Energy Charge:</span> <span className="text-slate-200">{formatCurrency(data.mtd_energy_charge, data.currency_code)}</span></div>
            <div className="flex justify-between"><span>Fixed Charge:</span> <span className="text-slate-200">{formatCurrency(data.mtd_fixed_charge, data.currency_code)}</span></div>
            <div className="flex justify-between"><span>Wheeling Charge:</span> <span className="text-slate-200">{formatCurrency(data.mtd_wheeling_charge, data.currency_code)}</span></div>
            
            {/* Conditional display for Fuel Adjustment */}
            {data.missing_components?.includes("Fuel Adjustment") ? (
              <div className="flex justify-between text-amber-500/80 italic"><span>Fuel Adjustment:</span> <span>Not configured</span></div>
            ) : (
              <div className="flex justify-between"><span>Fuel Adjustment:</span> <span className="text-slate-200">{formatCurrency(data.mtd_fuel_adjustment, data.currency_code)}</span></div>
            )}
            
            <div className="flex justify-between"><span>Electricity Duty:</span> <span className="text-slate-200">{formatCurrency(data.mtd_electricity_duty, data.currency_code)}</span></div>
            {data.mtd_additional_charge > 0 && (
              <div className="flex justify-between"><span>Other Charges:</span> <span className="text-slate-200">{formatCurrency(data.mtd_additional_charge, data.currency_code)}</span></div>
            )}
          </div>
        </motion.div>

        {/* Monthly Target Progress -> Current Billing Cycle */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card p-5"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Billing Cycle</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Target size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-emerald-400 mb-1 font-semibold">{new Date(data.cycle_start_date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} – {new Date(data.cycle_end_date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</p>
            <h2 className="text-3xl font-black text-white">{data.month_to_date_kwh} <span className="text-lg font-normal text-slate-400">kWh</span></h2>
            
            <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.target_progress_pct > 100 ? 'bg-rose-500' : data.target_progress_pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, data.target_progress_pct)}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3 text-xs">
              <span className="text-slate-400">Days Remaining:</span>
              <strong className="text-slate-200">{data.days_remaining} days</strong>
            </div>
          </div>
        </motion.div>

        {/* Projected End-of-Cycle Bill */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card p-5 relative overflow-hidden"
        >
          {data.forecast_confidence && (
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg ${
              data.forecast_confidence === 'Low' ? 'bg-rose-500/20 text-rose-400' :
              data.forecast_confidence === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {data.forecast_confidence} Confidence
            </div>
          )}
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1"><Sparkles size={12}/> Forecast</span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-slate-400 mb-1">Projected End-of-Cycle Bill</p>
            <h2 className="text-3xl font-black text-white">{formatCurrency(data.estimated_month_end_bill, data.currency_code)}</h2>
            <p className="text-[11px] text-slate-400 mt-2">Projected usage: <strong className="text-slate-200">{data.projected_month_end_kwh} kWh</strong></p>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid: Energy Score & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular Energy Score Card */}
        <div className="glass-card p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Award className="text-emerald-400" size={18} />
              Energy Efficiency Score
            </h3>
            <span className="text-xs text-slate-400 font-mono">0 - 100</span>
          </div>

          <div className="my-6 relative flex items-center justify-center">
            {/* Circular Gauge */}
            <div className="w-40 h-40 rounded-full border-8 border-slate-800 flex items-center justify-center relative">
              <div className="text-center">
                <span className="text-4xl font-black text-white">{data.energy_score}</span>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mt-1">{data.energy_rating}</p>
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-800/50 rounded-xl p-3 text-xs text-slate-300">
            Recommended Daily Limit: <strong className="text-emerald-400 font-bold">{data.recommended_daily_kwh} kWh/day</strong> to remain within monthly target.
          </div>
        </div>

        {/* Smart AI Insights & Anomaly Alerts */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={18} />
                Smart Electricity Insights
              </h3>
              <span className="text-xs text-slate-400">Live Calculations</span>
            </div>

            <div className="space-y-3">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly Warning Banner if any */}
          {data.anomalies.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-rose-300">Unusual High Usage Spike Detected</h4>
                <p className="text-xs text-rose-200/80">
                  Recent reading on {data.anomalies[0].date} recorded {data.anomalies[0].consumption} kWh ({data.anomalies[0].pct_above}% above average).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
