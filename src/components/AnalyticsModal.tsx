import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PieChart, Award, Layers } from 'lucide-react';
import { Asset, NetWorthSummary } from '../types/portfolio';
import { formatINR, formatNumber } from '../utils/calculations';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: NetWorthSummary;
  assets: Asset[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  summary,
  assets,
}) => {
  if (!isOpen) return null;

  // Top gainers by profit
  const sortedGainers = [...assets].sort(
    (a, b) => (b.metrics?.profitLoss || 0) - (a.metrics?.profitLoss || 0)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-400" />
                Portfolio Analytics &amp; Performance
              </h2>
              <p className="text-xs text-slate-400">
                Asset Allocation, ROI Metrics &amp; Top Performers
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                <span className="text-[11px] text-slate-400 block font-medium">Net Valuation</span>
                <span className="text-sm sm:text-base font-bold text-white font-mono">
                  {formatINR(summary.totalCurrentValue)}
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                <span className="text-[11px] text-slate-400 block font-medium">Total Invested</span>
                <span className="text-sm sm:text-base font-bold text-slate-300 font-mono">
                  {formatINR(summary.totalInvested)}
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                <span className="text-[11px] text-slate-400 block font-medium">Consolidated ROI</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                  +{formatNumber(summary.totalPercentageGainLoss, 2)}%
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                <span className="text-[11px] text-slate-400 block font-medium">Holdings</span>
                <span className="text-sm sm:text-base font-bold text-amber-300 font-mono">
                  {assets.length} Assets
                </span>
              </div>
            </div>

            {/* Asset Allocation Breakdown Table */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                Asset Class Allocations
              </h3>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
                {summary.allocations.map((alloc) => (
                  <div key={alloc.assetType} className="p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="font-semibold text-slate-200">
                        {alloc.assetType.replace('_', ' ')}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                        {alloc.assetCount} items
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-100">{formatINR(alloc.currentValue)}</div>
                      <div className="text-[11px] text-amber-400 font-medium">
                        {formatNumber(alloc.percentageOfPortfolio, 1)}% of Portfolio
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Holdings */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" />
                Top Performing Holdings
              </h3>

              <div className="space-y-2">
                {sortedGainers.slice(0, 4).map((asset) => (
                  <div
                    key={asset.id || asset.name}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs sm:text-sm"
                  >
                    <div>
                      <div className="font-bold text-slate-100">{asset.name}</div>
                      <div className="text-[11px] text-slate-400">{asset.metrics?.categoryBadge}</div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-400">
                        +{formatINR(asset.metrics?.profitLoss)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        +{formatNumber(asset.metrics?.returnPct, 1)}% Gain
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
