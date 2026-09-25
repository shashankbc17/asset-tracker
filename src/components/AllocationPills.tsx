import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Coins, TrendingUp, Building2, Landmark, PiggyBank, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { AssetType, AssetAllocation } from '../types/portfolio';
import { formatINR } from '../utils/calculations';

interface AllocationPillsProps {
  selectedType: AssetType | 'ALL';
  onSelectType: (type: AssetType | 'ALL') => void;
  allocations: AssetAllocation[];
  totalAssetsCount: number;
  totalCurrentValue: number;
  totalInvested?: number;
}

export const AllocationPills: React.FC<AllocationPillsProps> = ({
  selectedType,
  onSelectType,
  allocations,
  totalAssetsCount,
  totalCurrentValue,
  totalInvested = 0,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkScroll, 120);
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkScroll]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -220 : 220;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 280);
  };

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
    <div className="relative group/alloc flex items-center py-1">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700 shadow-xl z-10 transition-all active:scale-95"
          title="Scroll Left"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}

      {/* Categories Strip */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="w-full overflow-x-auto scroll-smooth no-scrollbar py-2 touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex items-center gap-2.5 min-w-max">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.id;

            let count = totalAssetsCount;
            let val = totalCurrentValue;
            let invested = totalInvested;

            if (cat.id !== 'ALL') {
              const alloc = allocations.find((a) => a.assetType === cat.id);
              count = alloc?.assetCount || 0;
              val = alloc?.currentValue || 0;
              invested = alloc?.investedValue || 0;
            }

            const profitLoss = val - invested;
            const returnPct = invested > 0 ? (profitLoss / invested) * 100 : 0;
            const isPositive = profitLoss >= 0;

            return (
              <button
                key={cat.id}
                onClick={(e) => {
                  onSelectType(cat.id);
                  (e.currentTarget as HTMLElement).scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                  });
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all text-left select-none ${
                  isSelected
                    ? `${cat.activeBorder} text-white shadow-lg shadow-black/40 ring-1 ring-white/10 scale-[1.01]`
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
                  <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                    <span>{formatINR(val)}</span>
                    {invested > 0 && (
                      <span className={`text-[10px] font-mono font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isPositive ? '+' : ''}{returnPct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700 shadow-xl z-10 transition-all active:scale-95 animate-pulse"
          title="Scroll Right"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
