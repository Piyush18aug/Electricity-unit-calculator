import React, { useState } from 'react';
import { Zap, CheckCircle2, ArrowRight, Home, Shield, DollarSign, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const Onboarding: React.FC = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [propertyName, setPropertyName] = useState<string>('My Home');
  const [propertyType, setPropertyType] = useState<string>('Home');
  const [meterName, setMeterName] = useState<string>('Main Electricity Meter');
  const [meterNumber, setMeterNumber] = useState<string>('MET-2026-9901');
  const [initialReading, setInitialReading] = useState<string>('12450.2');
  const [currencyCode, setCurrencyCode] = useState<string>('INR');
  const [tariffType, setTariffType] = useState<string>('slab');
  const [simpleRate, setSimpleRate] = useState<string>('7.50');
  const [monthlyTarget, setMonthlyTarget] = useState<string>('250');
  const [billBudget, setBillBudget] = useState<string>('2000');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      await api.post('/onboarding', {
        property_name: propertyName,
        property_type: propertyType,
        meter_name: meterName,
        meter_number: meterNumber,
        initial_reading: parseFloat(initialReading),
        currency_code: currencyCode,
        tariff_type: tariffType,
        simple_rate: parseFloat(simpleRate),
        monthly_target_kwh: parseFloat(monthlyTarget),
        bill_budget: parseFloat(billBudget),
      });

      await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to complete onboarding setup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl glass-card p-8 space-y-6">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Zap className="text-emerald-400" size={24} />
            <span className="font-extrabold text-lg text-white">WattWise Setup</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Step {step} of 6</span>
        </div>

        {step === 1 && (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Zap size={32} />
            </div>
            <h2 className="text-2xl font-black text-white">Welcome to WattWise</h2>
            <p className="text-slate-400 text-sm">
              Let's set up your personalized electricity unit tracking dashboard in just a few quick steps.
            </p>
            <button
              onClick={() => setStep(2)}
              className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
            >
              Get Started Setup
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Step 2: Property Details</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Property Name</label>
              <input
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
              >
                <option value="Home">Home</option>
                <option value="Apartment">Apartment</option>
                <option value="Office">Office</option>
                <option value="Shop">Shop</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
            >
              Continue to Meter
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Step 3: Electricity Meter</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Meter Name</label>
              <input
                type="text"
                value={meterName}
                onChange={(e) => setMeterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Baseline Meter Reading (kWh)</label>
              <input
                type="number"
                step="0.1"
                value={initialReading}
                onChange={(e) => setInitialReading(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              onClick={() => setStep(4)}
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
            >
              Continue to Currency
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Step 4: Select Currency</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Preferred Currency</label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
              >
                <option value="INR">₹ INR – Indian Rupee</option>
                <option value="USD">$ USD – US Dollar</option>
                <option value="EUR">€ EUR – Euro</option>
                <option value="GBP">£ GBP – British Pound</option>
                <option value="JPY">¥ JPY – Japanese Yen</option>
              </select>
            </div>
            <button
              onClick={() => setStep(5)}
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
            >
              Continue to Tariff
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Step 5: Electricity Tariff</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tariff Rate Structure</label>
              <select
                value={tariffType}
                onChange={(e) => setTariffType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
              >
                <option value="slab">Slab-Based Tiered Rate (Recommended)</option>
                <option value="simple">Simple Flat Rate per kWh</option>
              </select>
            </div>
            <button
              onClick={() => setStep(6)}
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
            >
              Continue to Targets
            </button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Step 6: Monthly Target & Budget</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Monthly Electricity Target (kWh)</label>
              <input
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
            >
              {submitting ? 'Setting Up Dashboard...' : 'Finish & Open WattWise Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
