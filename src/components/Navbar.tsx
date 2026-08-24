import React from 'react';
import { RefreshCw, Plus, PieChart, Download, Wallet, ArrowUpRight } from 'lucide-react';
import { MetalRates } from '../types/portfolio';
import { formatNumber } from '../utils/calculations';

interface NavbarProps {
  rates: MetalRates;
  onOpenAddModal: () => void;
  onOpenRatesModal: () => void;
  onOpenAnalytics: () => void;
  onOpenCsvModal: () => void;
  onSyncRates: () => void;
  isSyncingRates: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  rates,
  onOpenAddModal,
  onOpenRatesModal,
  onOpenAnalytics,
  onOpenCsvModal,
  onSyncRates,
  isSyncingRates,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          
          {/* Logo & Real Project Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Asset Tracker
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md">
                  v4.0.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Precious Metals &amp; Net Worth Portfolio
              </p>
            </div>
          </div>

          {/* Live Rates Ticker (Middle on Desktop) */}
          <div 
            onClick={onOpenRatesModal}
            className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-amber-500/40 transition-all cursor-pointer group text-xs"
            title="Click to edit or sync spot market rates"
          >
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold">Bangalore:</span>
            </div>
            <div className="flex items-center gap-2.5 font-mono text-slate-300">
              <span>24K: <strong className="text-amber-300 font-semibold">₹{formatNumber(rates.gold24k || rates.gold, 0)}/g</strong></span>
              <span className="text-slate-600">•</span>
              <span>22K: <strong className="text-amber-200 font-semibold">₹{formatNumber(rates.gold22k || rates.gold * 0.916, 0)}/g</strong></span>
              <span className="text-slate-600">•</span>
              <span>Silver: <strong className="text-slate-200 font-semibold">₹{formatNumber(rates.silver, 0)}/g</strong></span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onSyncRates}
              disabled={isSyncingRates}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="Sync Live Rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSyncingRates ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden md:inline">Sync</span>
            </button>

            <button
              onClick={onOpenAnalytics}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="Portfolio Analytics"
            >
              <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden md:inline">Analytics</span>
            </button>

            <button
              onClick={onOpenCsvModal}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="CSV Backup &amp; Restore"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
              <span className="hidden md:inline">Backup</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Asset</span>
            </button>
          </div>

        </div>

        {/* Mobile / Tablet Live Rates Bar */}
        <div 
          onClick={onOpenRatesModal}
          className="lg:hidden flex items-center justify-between py-2 px-1 border-t border-slate-800/80 text-[11px] text-slate-400 active:bg-slate-800/40 cursor-pointer"
        >
          <div className="flex items-center gap-1 text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>BLR Rates:</span>
          </div>
          <div className="flex items-center gap-2.5 font-mono">
            <span>24K: <strong className="text-amber-300">₹{formatNumber(rates.gold24k || rates.gold, 0)}</strong></span>
            <span>22K: <strong className="text-amber-200">₹{formatNumber(rates.gold22k || rates.gold * 0.916, 0)}</strong></span>
            <span>Ag: <strong className="text-slate-200">₹{formatNumber(rates.silver, 0)}</strong></span>
          </div>
        </div>

      </div>
    </header>
  );
};
