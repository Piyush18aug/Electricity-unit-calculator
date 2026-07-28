import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { useMeter } from '../contexts/MeterContext';
import api from '../services/api';
import { AnalyticsData, MeterReading } from '../types';
import { formatCurrency } from '../utils/formatters';

export const Reports: React.FC = () => {
  const { selectedMeter, selectedProperty } = useMeter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!selectedMeter) return;
      try {
        setLoading(true);
        const [analyticsRes, readingsRes] = await Promise.all([
          api.get(`/analytics/dashboard/${selectedMeter.id}`),
          api.get(`/meters/${selectedMeter.id}/readings`)
        ]);
        setData(analyticsRes.data);
        setReadings(readingsRes.data);
      } catch (err) {
        console.error('Failed to fetch report data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedMeter]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Generating Monthly Electricity Report...
      </div>
    );
  }

  const startDateFormatted = data.cycle_start_date ? new Date(data.cycle_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
  const endDateFormatted = data.cycle_end_date ? new Date(data.cycle_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Monthly Electricity Report</h1>
          <p className="text-slate-400 text-sm mt-1">Exportable formal monthly summary statement.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center space-x-2 shadow-lg"
        >
          <Printer size={18} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      <div className="glass-card p-8 space-y-6 bg-slate-900 border border-slate-800 text-slate-200" id="printable-report">
        {/* Statement Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-black text-emerald-400">WattWise Statement</h2>
            <p className="text-xs text-slate-400 mt-1">Property: <strong className="text-slate-200">{selectedProperty?.name || data.property_name}</strong> • Meter: <strong className="text-slate-200">{selectedMeter?.name || data.meter_name}</strong></p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-mono">Billing Cycle Period</span>
            <p className="text-sm font-bold text-white mt-0.5">{startDateFormatted} – {endDateFormatted}</p>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Consumption</span>
            <p className="text-2xl font-extrabold text-white mt-1">{data.month_to_date_kwh} kWh</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Estimated Bill</span>
            <p className="text-2xl font-extrabold text-cyan-400 mt-1">{formatCurrency(data.month_to_date_cost, data.currency_code)}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Efficiency Score</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">{data.energy_score} / 100</p>
          </div>
        </div>

        {/* Bill Breakdown Section */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2">Billing Breakdown</h3>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Energy Charge (Progressive Slabs)</span>
            <span className="font-mono text-slate-200">{formatCurrency(data.mtd_energy_charge, data.currency_code)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Fixed Charge (Slab-based)</span>
            <span className="font-mono text-slate-200">{formatCurrency(data.mtd_fixed_charge, data.currency_code)}</span>
          </div>
          {data.mtd_additional_charge > 0 && (
            <div className="flex justify-between text-xs text-slate-400">
              <span>Additional Configured Charges</span>
              <span className="font-mono text-slate-200">{formatCurrency(data.mtd_additional_charge, data.currency_code)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-slate-800">
            <span>Estimated Total</span>
            <span>{formatCurrency(data.month_to_date_cost, data.currency_code)}</span>
          </div>
        </div>

        {/* Historical Readings List */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 mb-3">Recorded Readings ({readings.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Date</th>
                  <th className="p-2.5">Reading Value</th>
                  <th className="p-2.5">Consumption</th>
                  <th className="p-2.5 rounded-r-lg">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {readings.slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="p-2.5 text-slate-300">{new Date(r.captured_at).toLocaleDateString('en-GB')}</td>
                    <td className="p-2.5 font-mono text-white font-semibold">{r.reading_value} kWh</td>
                    <td className="p-2.5 text-emerald-400 font-semibold">+{r.consumption} kWh</td>
                    <td className="p-2.5">
                      {r.is_official_reading ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">Official</span>
                      ) : (
                        <span className="text-slate-400">Daily</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
