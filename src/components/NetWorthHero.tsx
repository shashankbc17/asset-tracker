import React from 'react';
import { TrendingUp, TrendingDown, ShieldCheck, Wallet, Activity } from 'lucide-react';
import { NetWorthSummary } from '../types/portfolio';
import { formatINR, formatNumber } from '../utils/calculations';

interface NetWorthHeroProps {
  summary: NetWorthSummary;
  totalAssetsCount: number;
}

export const NetWorthHero: React.FC<NetWorthHeroProps> = ({ summary, totalAssetsCount }) => {
  const isPositive = summary.totalGainLoss >= 0;

  // Colors for category distribution bar
  const categoryColors: Record<string, { bg: string; name: string }> = {
    PRECIOUS_METALS: { bg: 'bg-amber-400', name: 'Metals' },
    EQUITY: { bg: 'bg-indigo-500', name: 'Equity' },
    REAL_ESTATE: { bg: 'bg-emerald-500', name: 'Real Estate' },
    CASH_SAVINGS: { bg: 'bg-sky-400', name: 'Cash/FD' },
    PROVIDENT_FUND: { bg: 'bg-purple-500', name: 'EPF/PPF' },
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 shadow-2xl p-5 sm:p-8 text-white">
      
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        
        {/* Top meta tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Consolidated Net Worth
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{totalAssetsCount} Tracked Holdings</span>
          </div>
        </div>

        {/* Main numbers layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          
          {/* Main Net Worth Value (Left 7 cols) */}
          <div className="lg:col-span-7">
            <div className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>Current Valuation</span>
            </div>
            <div className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3">
              {formatINR(summary.totalCurrentValue)}
            </div>

            {/* Total Profit & Loss Pill */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold border ${
                isPositive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{isPositive ? '+' : ''}{formatINR(summary.totalGainLoss)}</span>
                <span className="text-[11px] opacity-80">({isPositive ? '+' : ''}{formatNumber(summary.totalPercentageGainLoss, 2)}%)</span>
              </div>

              <span className="text-xs text-slate-400">
                All-time unrealized returns
              </span>
            </div>
          </div>

          {/* Invested Breakdown Card (Right 5 cols) */}
          <div className="lg:col-span-5 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                Total Invested Capital
              </span>
              <span className="font-semibold text-slate-200">100% Base</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-200 mb-3">
              {formatINR(summary.totalInvested)}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-700/50 pt-2 flex items-center justify-between">
              <span>Overall Multiple:</span>
              <strong className="text-amber-300 font-mono">
                {summary.totalInvested > 0 ? (summary.totalCurrentValue / summary.totalInvested).toFixed(2) : '1.00'}x
              </strong>
            </div>
          </div>

        </div>

        {/* Multi-Asset Distribution Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
            <span className="font-semibold text-slate-300">Portfolio Distribution</span>
            <span className="text-[11px]">By Current Valuation</span>
          </div>

          {/* Multi-segment bar */}
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner gap-0.5">
            {summary.allocations.map((alloc) => {
              if (alloc.percentageOfPortfolio <= 0) return null;
              const colorConfig = categoryColors[alloc.assetType] || { bg: 'bg-slate-500', name: alloc.assetType };
              return (
                <div
                  key={alloc.assetType}
                  style={{ width: `${Math.max(2, alloc.percentageOfPortfolio)}%` }}
                  className={`${colorConfig.bg} h-full transition-all duration-500 relative group`}
                  title={`${colorConfig.name}: ${alloc.percentageOfPortfolio.toFixed(1)}% (${formatINR(alloc.currentValue)})`}
                />
              );
            })}
          </div>

          {/* Legend items */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs">
            {summary.allocations.map((alloc) => {
              const colorConfig = categoryColors[alloc.assetType] || { bg: 'bg-slate-500', name: alloc.assetType };
              return (
                <div key={alloc.assetType} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${colorConfig.bg}`} />
                  <span className="text-slate-300 font-medium">{colorConfig.name}</span>
                  <span className="text-slate-500 text-[11px]">({alloc.percentageOfPortfolio.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
