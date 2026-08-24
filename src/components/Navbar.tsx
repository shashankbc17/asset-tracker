import React from 'react';
import { RefreshCw, Plus, PieChart, Download, Coins, ArrowUpRight } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  AuraVault
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full">
                  v4.0.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Net Worth &amp; Precious Metals Portfolio
              </p>
            </div>
          </div>

          {/* Live Rates Ticker (Middle) */}
          <div 
            onClick={onOpenRatesModal}
            className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 hover:border-amber-500/40 transition-all cursor-pointer group text-xs"
            title="Click to view or edit bullion rates"
          >
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold">Bangalore Rates:</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-slate-300">
              <span>Gold 24K: <strong className="text-amber-300">₹{formatNumber(rates.gold24k || rates.gold, 0)}/g</strong></span>
              <span className="text-slate-600">•</span>
              <span>Gold 22K: <strong className="text-amber-200">₹{formatNumber(rates.gold22k || rates.gold * 0.916, 0)}/g</strong></span>
              <span className="text-slate-600">•</span>
              <span>Silver: <strong className="text-slate-200">₹{formatNumber(rates.silver, 0)}/g</strong></span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onSyncRates}
              disabled={isSyncingRates}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="Sync Live Rates"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingRates ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden lg:inline">Sync Rates</span>
            </button>

            <button
              onClick={onOpenAnalytics}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="Portfolio Analytics"
            >
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Analytics</span>
            </button>

            <button
              onClick={onOpenCsvModal}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="CSV Backup &amp; Restore"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span className="hidden lg:inline">Backup</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Asset</span>
            </button>
          </div>

        </div>

        {/* Mobile Live Rates Ticker (Bottom strip) */}
        <div 
          onClick={onOpenRatesModal}
          className="md:hidden flex items-center justify-between py-1.5 px-2 border-t border-slate-800/60 text-[11px] text-slate-400 active:bg-slate-800/50"
        >
          <div className="flex items-center gap-1 text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>BLR Rates:</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>24K: <strong className="text-amber-300">₹{formatNumber(rates.gold24k || rates.gold, 0)}</strong></span>
            <span>22K: <strong className="text-amber-200">₹{formatNumber(rates.gold22k || rates.gold * 0.916, 0)}</strong></span>
            <span>Ag: <strong className="text-slate-200">₹{formatNumber(rates.silver, 0)}</strong></span>
          </div>
        </div>

      </div>
    </header>
  );
};
