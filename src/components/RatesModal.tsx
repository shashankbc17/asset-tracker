import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Check, MapPin, Clock } from 'lucide-react';
import { MetalRates } from '../types/portfolio';
import { formatNumber } from '../utils/calculations';

interface RatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: MetalRates;
  onUpdateRates: (newRates: { gold: number; silver: number }) => void;
  onSyncLive: () => void;
  isSyncing: boolean;
}

export const RatesModal: React.FC<RatesModalProps> = ({
  isOpen,
  onClose,
  rates,
  onUpdateRates,
  onSyncLive,
  isSyncing,
}) => {
  const [gold24k, setGold24k] = useState(rates.gold24k || rates.gold || 16408);
  const [silver, setSilver] = useState(rates.silver || 257);

  useEffect(() => {
    setGold24k(rates.gold24k || rates.gold || 16408);
    setSilver(rates.silver || 257);
  }, [rates, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRates({ gold: Number(gold24k), silver: Number(silver) });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Bullion Spot Market Rates
              </h2>
              <p className="text-xs text-slate-400">
                Bengaluru (Karnataka) Benchmark Trade Rates
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Meta Info Banner */}
            <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Market: Bengaluru Bullion</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>{rates.lastUpdated ? new Date(rates.lastUpdated).toLocaleDateString() : 'Today'}</span>
              </div>
            </div>

            {/* Rates Inputs */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    24 Karat Fine Gold (₹ / gram)
                  </label>
                  <span className="text-[11px] text-amber-400 font-mono">
                    22K Est: ₹{formatNumber(Number(gold24k) * 0.916, 0)}/g
                  </span>
                </div>
                <input
                  type="number"
                  step="1"
                  required
                  value={gold24k}
                  onChange={(e) => setGold24k(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  999 Pure Fine Silver (₹ / gram)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={silver}
                  onChange={(e) => setSilver(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Equivalent: ₹{formatNumber(Number(silver) * 1000, 0)} / kg
                </span>
              </div>
            </div>

            {/* Sync live button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onSyncLive}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className={`w-4 h-4 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Fetching Live Bangalore Rates...' : 'Fetch Latest Live Market Spot Price'}</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply Spot Rates</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
