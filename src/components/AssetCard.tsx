import React from 'react';
import { 
  Coins, 
  TrendingUp, 
  Building2, 
  Landmark, 
  PiggyBank, 
  Edit3, 
  Trash2, 
  Calendar, 
  Sparkles, 
  Clock,
  ChevronRight
} from 'lucide-react';
import { Asset, AssetType } from '../types/portfolio';
import { formatINR, formatNumber } from '../utils/calculations';

interface AssetCardProps {
  asset: Asset;
  onSelect: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: number) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onSelect, onEdit, onDelete }) => {
  const metrics = asset.metrics;
  const isPositive = (metrics?.profitLoss || 0) >= 0;

  const typeConfig: Record<AssetType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badgeBg: string }> = {
    PRECIOUS_METALS: { label: 'Precious Metal', icon: Coins, color: 'text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    EQUITY: { label: 'Equity / Stocks', icon: TrendingUp, color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
    REAL_ESTATE: { label: 'Real Estate', icon: Building2, color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    CASH_SAVINGS: { label: 'Cash / FD', icon: Landmark, color: 'text-sky-400', badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
    PROVIDENT_FUND: { label: 'Provident Fund', icon: PiggyBank, color: 'text-purple-400', badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
  };

  const config = typeConfig[asset.assetType] || typeConfig.PRECIOUS_METALS;
  const Icon = config.icon;

  return (
    <div 
      onClick={() => onSelect(asset)}
      className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all shadow-md hover:shadow-xl text-white cursor-pointer active:scale-[0.99] group"
    >
      {/* Top Header: Badge, Title, Actions */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 ${config.color} shrink-0 mt-0.5`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.badgeBg}`}>
                {metrics?.categoryBadge || config.label}
              </span>
              {metrics?.cagrDisplay && metrics.cagrDisplay !== '(< 1 yr)' && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  CAGR: {metrics.cagrDisplay}
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-amber-300 transition-colors leading-snug">
              {asset.name}
            </h3>
          </div>
        </div>

        {/* Desktop Hover Actions & Mobile Chevron */}
        <div className="flex items-center gap-1 shrink-0">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800/90 px-1.5 py-1 rounded-xl border border-slate-700 shadow-md"
          >
            <button
              onClick={() => onEdit(asset)}
              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition-all"
              title="Edit Asset"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => asset.id && onDelete(asset.id)}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-all"
              title="Delete Asset"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 sm:hidden" />
        </div>
      </div>

      {/* Primary Financial Numbers */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 my-2.5 text-center sm:text-left">
        {/* Invested */}
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Invested</span>
          <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
            {formatINR(metrics?.investedAmount || asset.investedAmount)}
          </span>
        </div>

        {/* Current Valuation */}
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Valuation</span>
          <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono">
            {formatINR(metrics?.currentValue)}
          </span>
        </div>

        {/* P&L */}
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Gain / Return</span>
          <div className={`text-xs sm:text-sm font-bold font-mono ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <span>{isPositive ? '+' : ''}{formatNumber(metrics?.returnPct, 1)}%</span>
          </div>
        </div>
      </div>

      {/* Secondary Specific Metric Bar */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 pt-0.5">
        <div className="font-mono text-slate-300 flex items-center gap-1 truncate">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate">{metrics?.keyMetricDisplay || 'Custom Holding'}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
          <Calendar className="w-3 h-3" />
          <span>{asset.purchaseDate || 'N/A'}</span>
        </div>
      </div>

    </div>
  );
};
