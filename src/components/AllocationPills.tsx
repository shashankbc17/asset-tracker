import React from 'react';
import { Coins, TrendingUp, Building2, Landmark, PiggyBank, Layers } from 'lucide-react';
import { AssetType, AssetAllocation } from '../types/portfolio';
import { formatINR } from '../utils/calculations';

interface AllocationPillsProps {
  selectedType: AssetType | 'ALL';
  onSelectType: (type: AssetType | 'ALL') => void;
  allocations: AssetAllocation[];
  totalAssetsCount: number;
  totalCurrentValue: number;
}

export const AllocationPills: React.FC<AllocationPillsProps> = ({
  selectedType,
  onSelectType,
  allocations,
  totalAssetsCount,
  totalCurrentValue,
}) => {
  const categories: {
    id: AssetType | 'ALL';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    activeBorder: string;
  }[] = [
    { id: 'ALL', label: 'All Assets', icon: Layers, color: 'text-amber-400', activeBorder: 'border-amber-500 bg-amber-500/10' },
    { id: 'PRECIOUS_METALS', label: 'Gold & Silver', icon: Coins, color: 'text-yellow-400', activeBorder: 'border-yellow-500 bg-yellow-500/10' },
    { id: 'EQUITY', label: 'Equities / Stocks', icon: TrendingUp, color: 'text-indigo-400', activeBorder: 'border-indigo-500 bg-indigo-500/10' },
    { id: 'REAL_ESTATE', label: 'Real Estate', icon: Building2, color: 'text-emerald-400', activeBorder: 'border-emerald-500 bg-emerald-500/10' },
    { id: 'CASH_SAVINGS', label: 'Cash & FDs', icon: Landmark, color: 'text-sky-400', activeBorder: 'border-sky-500 bg-sky-500/10' },
    { id: 'PROVIDENT_FUND', label: 'EPF / PPF', icon: PiggyBank, color: 'text-purple-400', activeBorder: 'border-purple-500 bg-purple-500/10' },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2.5 min-w-max">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedType === cat.id;

          let count = totalAssetsCount;
          let val = totalCurrentValue;

          if (cat.id !== 'ALL') {
            const alloc = allocations.find((a) => a.assetType === cat.id);
            count = alloc?.assetCount || 0;
            val = alloc?.currentValue || 0;
          }

          return (
            <button
              key={cat.id}
              onClick={() => onSelectType(cat.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all text-left ${
                isSelected
                  ? `${cat.activeBorder} text-white shadow-lg shadow-black/40 ring-1 ring-white/10`
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl bg-slate-800/90 ${cat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold leading-none">
                  <span>{cat.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {count}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  {formatINR(val)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
