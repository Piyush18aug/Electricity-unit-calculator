import React, { useState, useEffect } from 'react';
import { History, Plus, FileSpreadsheet, Tag, Trash2, AlertTriangle, Receipt } from 'lucide-react';
import api from '../services/api';
import { useMeter } from '../contexts/MeterContext';
import { MeterReading } from '../types';

export const ReadingHistory: React.FC = () => {
  const { selectedMeter } = useMeter();
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [deleteReadingId, setDeleteReadingId] = useState<number | null>(null);

  const [newVal, setNewVal] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [capturedAt, setCapturedAt] = useState<string>('');
  const [isOfficial, setIsOfficial] = useState<boolean>(false);

  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [billData, setBillData] = useState({
    billing_period: '',
    units_consumed: '',
    total_amount: '',
    energy_charge: '',
    fixed_charge: '',
    wheeling_charge: '',
    fuel_adjustment_charge: '',
    electricity_duty: '',
    other_charges: '',
    adjustments: ''
  });

  const handleDelete = async () => {
    if (deleteReadingId === null) return;
    try {
      await api.delete(`/readings/${deleteReadingId}`);
      setDeleteReadingId(null);
      fetchReadings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete reading.');
    }
  };

  const fetchReadings = async () => {
    if (!selectedMeter) return;
    try {
      setLoading(true);
      const res = await api.get(`/meters/${selectedMeter.id}/readings`);
      setReadings(res.data);
    } catch (err) {
      console.error('Failed to load readings history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [selectedMeter]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeter || !newVal) return;

    try {
      await api.post('/readings', {
        meter_id: selectedMeter.id,
        reading_value: parseFloat(newVal),
        entry_method: 'manual',
        notes,
        is_official_reading: isOfficial,
        ...(capturedAt ? { captured_at: new Date(capturedAt).toISOString() } : {})
      });
      setShowModal(false);
      setNewVal('');
      setNotes('');
      setCapturedAt('');
      setIsOfficial(false);
      fetchReadings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add manual reading.');
    }
  };

  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeter) return;
    try {
      await api.post('/bills', {
        meter_id: selectedMeter.id,
        billing_period: billData.billing_period,
        units_consumed: parseFloat(billData.units_consumed || '0'),
        total_amount: parseFloat(billData.total_amount || '0'),
        energy_charge: parseFloat(billData.energy_charge || '0'),
        fixed_charge: parseFloat(billData.fixed_charge || '0'),
        wheeling_charge: parseFloat(billData.wheeling_charge || '0'),
        fuel_adjustment_charge: parseFloat(billData.fuel_adjustment_charge || '0'),
        electricity_duty: parseFloat(billData.electricity_duty || '0'),
        other_charges: parseFloat(billData.other_charges || '0'),
        adjustments: parseFloat(billData.adjustments || '0'),
        is_official: true
      });
      setShowBillModal(false);
      alert('Official bill saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add official bill.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Meter Reading History</h1>
          <p className="text-slate-400 text-sm mt-1">Audit log of all recorded meter readings and consumption deltas.</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => setShowBillModal(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center space-x-2 transition"
          >
            <Receipt size={18} />
            <span>Enter Official Bill</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} />
            <span>Add Manual Reading</span>
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Reading (kWh)</th>
                <th className="p-4">Consumption</th>
                <th className="p-4">Entry Method</th>
                <th className="p-4">Notes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {readings.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-mono text-xs">{new Date(r.captured_at).toLocaleString()}</td>
                  <td className="p-4 font-bold text-white">{r.reading_value.toFixed(1)}</td>
                  <td className="p-4 text-emerald-400 font-bold">+{r.consumption.toFixed(1)} kWh</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      r.entry_method === 'photo' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {r.entry_method}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-xs">{r.notes || '-'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setDeleteReadingId(r.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition" title="Delete record">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Manual Reading Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Enter Meter Reading</h3>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Meter Reading (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                  placeholder="e.g. 12458.7"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date (Optional)</label>
                <input
                  type="date"
                  value={capturedAt}
                  onChange={(e) => setCapturedAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave empty to use current date</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                  placeholder="e.g. Verified by technician"
                />
              </div>
              
              {/* Official Reading checkbox removed as per user request to simplify entering kwh */}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enter Official Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-2xl w-full p-6 my-8 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Receipt className="text-cyan-400" size={20} />
              Enter Official Provider Bill
            </h3>
            <p className="text-xs text-slate-400">Enter the exact amounts from your official electricity bill for historical comparison.</p>
            <form onSubmit={handleBillSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Billing Period</label>
                  <input required value={billData.billing_period} onChange={e => setBillData({...billData, billing_period: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" placeholder="e.g. July 2026" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Units Consumed (kWh)</label>
                  <input required type="number" step="0.1" value={billData.units_consumed} onChange={e => setBillData({...billData, units_consumed: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Energy Charge</label>
                  <input type="number" step="0.01" value={billData.energy_charge} onChange={e => setBillData({...billData, energy_charge: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Fixed Charge</label>
                  <input type="number" step="0.01" value={billData.fixed_charge} onChange={e => setBillData({...billData, fixed_charge: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Wheeling Charge</label>
                  <input type="number" step="0.01" value={billData.wheeling_charge} onChange={e => setBillData({...billData, wheeling_charge: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Fuel Adjustment</label>
                  <input type="number" step="0.01" value={billData.fuel_adjustment_charge} onChange={e => setBillData({...billData, fuel_adjustment_charge: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Electricity Duty</label>
                  <input type="number" step="0.01" value={billData.electricity_duty} onChange={e => setBillData({...billData, electricity_duty: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Other / Adjustments</label>
                  <input type="number" step="0.01" value={billData.adjustments} onChange={e => setBillData({...billData, adjustments: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800">
                <label className="block text-xs text-slate-400 mb-1 font-bold text-emerald-400">Total Final Bill Amount</label>
                <input required type="number" step="0.01" value={billData.total_amount} onChange={e => setBillData({...billData, total_amount: e.target.value})} className="w-full sm:w-1/2 bg-slate-950 border-2 border-emerald-500/50 rounded-xl px-4 py-3 text-white font-bold" />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowBillModal(false)} className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20">Save Official Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteReadingId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center mb-2">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Reading</h3>
            <p className="text-slate-400 text-sm">Are you sure you want to delete this reading? This action cannot be undone.</p>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setDeleteReadingId(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="w-1/2 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
