import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  Coins, 
  TrendingUp, 
  Building2, 
  Landmark, 
  PiggyBank, 
  Sparkles, 
  Clock, 
  FileText
} from 'lucide-react';
import { Asset, AssetType, MetalRates } from '../types/portfolio';
import { formatINR, formatNumber } from '../utils/calculations';

interface AssetDetailDrawerProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: number) => void;
  rates: MetalRates;
}

export const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({
  asset,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  rates,
}) => {
  if (!isOpen || !asset) return null;

  const metrics = asset.metrics;
  const isPositive = (metrics?.profitLoss || 0) >= 0;

  const typeConfig: Record<AssetType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
    PRECIOUS_METALS: { label: 'Precious Metal', icon: Coins, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-950/20' },
    EQUITY: { label: 'Equity / Stock', icon: TrendingUp, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-indigo-950/20' },
    REAL_ESTATE: { label: 'Real Estate', icon: Building2, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-950/20' },
    CASH_SAVINGS: { label: 'Cash / Fixed Deposit', icon: Landmark, color: 'text-sky-400', bg: 'from-sky-500/20 to-sky-950/20' },
    PROVIDENT_FUND: { label: 'Provident Fund (EPF/PPF)', icon: PiggyBank, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-950/20' },
  };

  const config = typeConfig[asset.assetType] || typeConfig.PRECIOUS_METALS;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-slate-950/80 backdrop-blur-sm">
        
        {/* Backdrop click to dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Slide-over Sheet (Bottom sheet on mobile, Right slide-out drawer on desktop) */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative z-10 w-full sm:max-w-md h-[90vh] sm:h-full bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-800 shadow-2xl flex flex-col text-white rounded-t-3xl sm:rounded-none overflow-hidden"
        >
          {/* Mobile Handle indicator */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-slate-700"></div>
          </div>

          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl bg-slate-800 border border-slate-700/70 ${config.color} shadow-lg shadow-black/40`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {config.label}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mt-1 leading-tight">
                  {asset.name}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Net Financial Hero Banner */}
            <div className={`p-5 rounded-3xl bg-gradient-to-br ${config.bg} border border-slate-800/80 shadow-xl space-y-4`}>
              <div>
                <span className="text-xs text-slate-400 font-medium block mb-0.5">Current Market Value</span>
                <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
                  {formatINR(metrics?.currentValue)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Invested Capital</span>
                  <span className="text-base font-bold text-slate-200 font-mono">
                    {formatINR(metrics?.investedAmount || asset.investedAmount)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Unrealized Returns</span>
                  <div className={`text-base font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span>{isPositive ? '+' : ''}{formatINR(metrics?.profitLoss)}</span>
                    <span className="text-xs opacity-90 block">({isPositive ? '+' : ''}{formatNumber(metrics?.returnPct, 2)}%)</span>
                  </div>
                </div>
              </div>

              {metrics?.cagrDisplay && metrics.cagrDisplay !== '(< 1 yr)' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Annualized Compounded Growth: <strong>{metrics.cagrDisplay}</strong></span>
                </div>
              )}
            </div>

            {/* Holding Specifications */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Asset Specifications
              </h3>

              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 divide-y divide-slate-800/60 text-xs sm:text-sm">
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Acquisition Date
                  </span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {asset.purchaseDate || 'N/A'}
                  </span>
                </div>

                {asset.assetType === 'PRECIOUS_METALS' && (
                  <>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Metal &amp; Form</span>
                      <span className="font-semibold text-amber-300">
                        {asset.metalType === 'GOLD' ? 'Gold (24K/22K)' : 'Silver (999 Pure)'} • {asset.categoryType === 'COIN_BAR' ? 'Coin/Bar' : 'Jewelry'}
                      </span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Total Net Weight</span>
                      <span className="font-semibold text-slate-200 font-mono">{formatNumber(asset.grams, 2)} grams</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Purchase Rate (₹/g)</span>
                      <span className="font-semibold text-slate-200 font-mono">₹{formatNumber(asset.rateBought, 0)}/g</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Current Spot Rate</span>
                      <span className="font-semibold text-amber-400 font-mono">
                        ₹{formatNumber(asset.metalType === 'GOLD' ? (rates.gold24k || rates.gold) : rates.silver, 0)}/g
                      </span>
                    </div>
                    {asset.deduction ? (
                      <div className="p-3.5 flex items-center justify-between">
                        <span className="text-slate-400">Melt / Wastage Deduction</span>
                        <span className="font-semibold text-rose-400 font-mono">{asset.deduction}%</span>
                      </div>
                    ) : null}
                  </>
                )}

                {asset.assetType === 'EQUITY' && (
                  <>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Ticker Symbol</span>
                      <span className="font-semibold text-indigo-300 font-mono">{asset.ticker || 'N/A'}</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Total Quantity</span>
                      <span className="font-semibold text-slate-200 font-mono">{formatNumber(asset.quantity, 0)} Units</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Average Buy Price</span>
                      <span className="font-semibold text-slate-200 font-mono">₹{formatNumber(asset.buyPrice, 2)}</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Current Market Price (CMP)</span>
                      <span className="font-semibold text-emerald-400 font-mono">₹{formatNumber(asset.currentPrice, 2)}</span>
                    </div>
                  </>
                )}

                {asset.assetType === 'REAL_ESTATE' && (
                  <>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Property Location</span>
                      <span className="font-semibold text-slate-200">{asset.location || 'N/A'}</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Built-Up Area</span>
                      <span className="font-semibold text-slate-200 font-mono">{formatNumber(asset.areaSqFt, 0)} Sq Ft</span>
                    </div>
                    {asset.monthlyRentalIncome ? (
                      <div className="p-3.5 flex items-center justify-between">
                        <span className="text-slate-400">Monthly Rental Yield</span>
                        <span className="font-semibold text-emerald-400 font-mono">{formatINR(asset.monthlyRentalIncome)}/mo</span>
                      </div>
                    ) : null}
                  </>
                )}

                {asset.assetType === 'CASH_SAVINGS' && (
                  <>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Bank / Institution</span>
                      <span className="font-semibold text-slate-200">{asset.bankName || 'Liquid Cash'}</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Interest Rate (% p.a.)</span>
                      <span className="font-semibold text-sky-400 font-mono">{formatNumber(asset.interestRatePct, 2)}%</span>
                    </div>
                    {asset.maturityDate && (
                      <div className="p-3.5 flex items-center justify-between">
                        <span className="text-slate-400">Maturity Date</span>
                        <span className="font-semibold text-slate-200 font-mono">{asset.maturityDate}</span>
                      </div>
                    )}
                  </>
                )}

                {asset.assetType === 'PROVIDENT_FUND' && (
                  <>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Scheme &amp; Status</span>
                      <span className="font-semibold text-purple-300">{asset.pfSchemeType || 'EPF'} • {asset.isActiveContribution !== false ? 'Active' : 'Dormant'}</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Monthly Deduction</span>
                      <span className="font-semibold text-slate-200 font-mono">{formatINR(asset.monthlyContribution)}/mo</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400">Govt Annual Interest</span>
                      <span className="font-semibold text-emerald-400 font-mono">{formatNumber(asset.pfInterestRate, 2)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes & Custody Details */}
            {asset.notes && (
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Notes &amp; Custody
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;{asset.notes}&rdquo;
                </p>
              </div>
            )}

          </div>

          {/* Footer Action Bar: Edit & Delete On Demand */}
          <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/95 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onEdit(asset);
              }}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>Edit Holding</span>
            </button>

            <button
              onClick={() => {
                if (asset.id) {
                  onClose();
                  onDelete(asset.id);
                }
              }}
              className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Holding</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
