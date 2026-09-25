import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowUpDown, 
  Plus, 
  Layers, 
  Filter, 
  LayoutGrid, 
  List, 
  Edit3, 
  Trash2, 
  ChevronDown,
  Calendar,
  X,
  Coins,
  TrendingUp,
  Building2,
  Landmark,
  PiggyBank,
  Check
} from 'lucide-react';
import { Asset, AssetType } from '../types/portfolio';
import { AssetCard } from './AssetCard';
import { formatINR, formatNumber } from '../utils/calculations';

interface AssetListProps {
  assets: Asset[];
  selectedType: AssetType | 'ALL';
  onSelectAsset: (asset: Asset) => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (id: number) => void;
  onOpenAddModal: () => void;
}

interface FilterOption {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: string;
  count: number;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  selectedType,
  onSelectAsset,
  onEditAsset,
  onDeleteAsset,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subFilter, setSubFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'value' | 'gain' | 'date' | 'name'>('value');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Reset sub-filter when switching asset category tabs
  useEffect(() => {
    setSubFilter('ALL');
  }, [selectedType]);

  const sortOptions = [
    { id: 'value', label: 'Highest Valuation' },
    { id: 'gain', label: 'Highest Profit (₹)' },
    { id: 'date', label: 'Recent Purchase' },
    { id: 'name', label: 'Asset Name (A-Z)' },
  ];

  // Base assets for the current tab category
  const categoryAssets = useMemo(() => {
    if (selectedType === 'ALL') return assets;
    return assets.filter((a) => a.assetType === selectedType);
  }, [assets, selectedType]);

  // Sub-filter matching function
  const matchesSubFilter = (asset: Asset, filterId: string): boolean => {
    if (filterId === 'ALL') return true;

    // Precious Metals Sub-categories
    if (filterId === 'GOLD_COIN') {
      return (
        asset.assetType === 'PRECIOUS_METALS' &&
        (asset.metalType === 'GOLD' || !asset.metalType) &&
        asset.categoryType === 'COIN_BAR'
      );
    }
    if (filterId === 'GOLD_JEWELRY') {
      return (
        asset.assetType === 'PRECIOUS_METALS' &&
        (asset.metalType === 'GOLD' || !asset.metalType) &&
        asset.categoryType === 'JEWELRY'
      );
    }
    if (filterId === 'SILVER_COIN') {
      return (
        asset.assetType === 'PRECIOUS_METALS' &&
        asset.metalType === 'SILVER' &&
        asset.categoryType === 'COIN_BAR'
      );
    }
    if (filterId === 'SILVER_JEWELRY') {
      return (
        asset.assetType === 'PRECIOUS_METALS' &&
        asset.metalType === 'SILVER' &&
        asset.categoryType === 'JEWELRY'
      );
    }
    if (filterId === 'GOLD_ALL') {
      return (
        asset.assetType === 'PRECIOUS_METALS' &&
        (asset.metalType === 'GOLD' || !asset.metalType)
      );
    }
    if (filterId === 'SILVER_ALL') {
      return (
        asset.assetType === 'PRECIOUS_METALS' &&
        asset.metalType === 'SILVER'
      );
    }

    // Cash / FDs Sub-categories
    if (filterId === 'FD') {
      return (
        asset.assetType === 'CASH_SAVINGS' &&
        ((asset.interestRatePct || 0) > 0 || !!asset.maturityDate)
      );
    }
    if (filterId === 'SAVINGS') {
      return (
        asset.assetType === 'CASH_SAVINGS' &&
        (!asset.interestRatePct || asset.interestRatePct === 0) &&
        !asset.maturityDate
      );
    }

    // Provident Fund Sub-categories
    if (filterId === 'EPF') {
      return (
        asset.assetType === 'PROVIDENT_FUND' &&
        (!asset.pfSchemeType || asset.pfSchemeType === 'EPF')
      );
    }
    if (filterId === 'PPF') {
      return (
        asset.assetType === 'PROVIDENT_FUND' &&
        asset.pfSchemeType === 'PPF'
      );
    }
    if (filterId === 'VPF') {
      return (
        asset.assetType === 'PROVIDENT_FUND' &&
        asset.pfSchemeType === 'VPF'
      );
    }

    // Equities Sub-categories
    if (filterId === 'ETF') {
      const text = `${asset.name} ${asset.ticker || ''} ${asset.notes || ''}`.toLowerCase();
      return (
        asset.assetType === 'EQUITY' &&
        (text.includes('etf') || text.includes('bees') || text.includes('index') || text.includes('fund'))
      );
    }
    if (filterId === 'STOCK') {
      const text = `${asset.name} ${asset.ticker || ''} ${asset.notes || ''}`.toLowerCase();
      return (
        asset.assetType === 'EQUITY' &&
        !(text.includes('etf') || text.includes('bees') || text.includes('index') || text.includes('fund'))
      );
    }

    // General Asset Types when under 'ALL'
    if (['PRECIOUS_METALS', 'EQUITY', 'REAL_ESTATE', 'CASH_SAVINGS', 'PROVIDENT_FUND'].includes(filterId)) {
      return asset.assetType === filterId;
    }

    // Fallback ticker or location match
    if (asset.ticker && asset.ticker === filterId) return true;
    if (asset.location && asset.location === filterId) return true;

    return true;
  };

  // Generate dynamic sub-filter options with counts
  const filterOptions = useMemo<FilterOption[]>(() => {
    let rawOptions: { id: string; label: string; shortLabel?: string; icon?: string }[] = [];

    if (selectedType === 'PRECIOUS_METALS') {
      rawOptions = [
        { id: 'ALL', label: 'All Precious Metals', shortLabel: 'All Metals', icon: '✨' },
        { id: 'GOLD_COIN', label: 'Gold Coins & Bars', shortLabel: 'Gold Coins', icon: '🪙' },
        { id: 'GOLD_JEWELRY', label: 'Gold Jewelry', shortLabel: 'Gold Jewelry', icon: '👑' },
        { id: 'SILVER_COIN', label: 'Silver Bullion & Coins', shortLabel: 'Silver Coins', icon: '🪙' },
        { id: 'SILVER_JEWELRY', label: 'Silver Jewelry', shortLabel: 'Silver Jewelry', icon: '💍' },
        { id: 'GOLD_ALL', label: 'All Gold Holdings', shortLabel: 'All Gold', icon: '🟡' },
        { id: 'SILVER_ALL', label: 'All Silver Holdings', shortLabel: 'All Silver', icon: '⚪' },
      ];
    } else if (selectedType === 'EQUITY') {
      rawOptions = [
        { id: 'ALL', label: 'All Equities & Stocks', shortLabel: 'All Stocks', icon: '📈' },
        { id: 'ETF', label: 'ETFs & Index Funds', shortLabel: 'ETFs & Funds', icon: '📊' },
        { id: 'STOCK', label: 'Direct Stocks & Shares', shortLabel: 'Direct Stocks', icon: '🏢' },
      ];
    } else if (selectedType === 'CASH_SAVINGS') {
      rawOptions = [
        { id: 'ALL', label: 'All Cash & FDs', shortLabel: 'All Cash/FD', icon: '🏦' },
        { id: 'FD', label: 'Fixed Deposits (FDs)', shortLabel: 'FDs', icon: '📜' },
        { id: 'SAVINGS', label: 'Savings & Liquid Balances', shortLabel: 'Liquid/Savings', icon: '💧' },
      ];
    } else if (selectedType === 'PROVIDENT_FUND') {
      rawOptions = [
        { id: 'ALL', label: 'All Retirement Accounts', shortLabel: 'All PF', icon: '🛡️' },
        { id: 'EPF', label: 'Employees PF (EPF)', shortLabel: 'EPF', icon: '💼' },
        { id: 'PPF', label: 'Public PF (PPF)', shortLabel: 'PPF', icon: '🏛️' },
        { id: 'VPF', label: 'Voluntary PF (VPF)', shortLabel: 'VPF', icon: '🌱' },
      ];
    } else if (selectedType === 'REAL_ESTATE') {
      rawOptions = [
        { id: 'ALL', label: 'All Real Estate', shortLabel: 'All Properties', icon: '🏡' },
      ];
      // Collect unique locations if multiple
      const locs = Array.from(new Set(categoryAssets.map(a => a.location).filter(Boolean)));
      if (locs.length > 1) {
        locs.forEach(loc => {
          rawOptions.push({ id: loc!, label: loc!, shortLabel: loc!, icon: '📍' });
        });
      }
    } else {
      // selectedType === 'ALL'
      rawOptions = [
        { id: 'ALL', label: 'All Asset Classes', shortLabel: 'All Assets', icon: '🌐' },
        { id: 'GOLD_COIN', label: 'Gold Coins & Bars', shortLabel: 'Gold Coins', icon: '🪙' },
        { id: 'GOLD_JEWELRY', label: 'Gold Jewelry', shortLabel: 'Gold Jewelry', icon: '👑' },
        { id: 'SILVER_ALL', label: 'Silver Holdings', shortLabel: 'Silver', icon: '⚪' },
        { id: 'EQUITY', label: 'Equities & Stocks', shortLabel: 'Equities', icon: '📈' },
        { id: 'REAL_ESTATE', label: 'Real Estate', shortLabel: 'Real Estate', icon: '🏢' },
        { id: 'CASH_SAVINGS', label: 'Cash & FDs', shortLabel: 'Cash & FDs', icon: '🏦' },
        { id: 'PROVIDENT_FUND', label: 'EPF / PPF', shortLabel: 'Provident Fund', icon: '🛡️' },
      ];
    }

    return rawOptions
      .map((opt) => {
        const count = opt.id === 'ALL' 
          ? categoryAssets.length 
          : categoryAssets.filter(a => matchesSubFilter(a, opt.id)).length;
        return {
          ...opt,
          count,
        };
      })
      .filter((opt) => opt.id === 'ALL' || opt.count > 0);
  }, [categoryAssets, selectedType]);

  // Active filter option metadata
  const activeFilterOption = useMemo(() => {
    return filterOptions.find(o => o.id === subFilter) || filterOptions[0];
  }, [filterOptions, subFilter]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        if (selectedType !== 'ALL' && asset.assetType !== selectedType) return false;
        if (!matchesSubFilter(asset, subFilter)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            asset.name.toLowerCase().includes(q) ||
            asset.notes?.toLowerCase().includes(q) ||
            asset.ticker?.toLowerCase().includes(q) ||
            asset.location?.toLowerCase().includes(q) ||
            asset.bankName?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'value') {
          diff = (b.metrics?.currentValue || 0) - (a.metrics?.currentValue || 0);
        } else if (sortBy === 'gain') {
          diff = (b.metrics?.profitLoss || 0) - (a.metrics?.profitLoss || 0);
        } else if (sortBy === 'date') {
          diff = new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        } else if (sortBy === 'name') {
          diff = a.name.localeCompare(b.name);
        }
        return sortAsc ? -diff : diff;
      });
  }, [assets, selectedType, subFilter, searchQuery, sortBy, sortAsc]);

  // Combined return and financial metrics for the filtered entity / entities
  const combinedMetrics = useMemo(() => {
    const count = filteredAssets.length;
    const totalInvested = filteredAssets.reduce(
      (sum, a) => sum + (a.metrics?.investedAmount || a.investedAmount || 0), 
      0
    );
    const totalCurrentValue = filteredAssets.reduce(
      (sum, a) => sum + (a.metrics?.currentValue || 0), 
      0
    );
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const returnPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
    const isProfitable = totalProfitLoss >= 0;

    const goldAssets = filteredAssets.filter(
      (a) => a.assetType === 'PRECIOUS_METALS' && (a.metalType === 'GOLD' || !a.metalType)
    );
    const silverAssets = filteredAssets.filter(
      (a) => a.assetType === 'PRECIOUS_METALS' && a.metalType === 'SILVER'
    );

    const totalGoldGrams = goldAssets.reduce((sum, a) => sum + (a.grams || 0), 0);
    const totalSilverGrams = silverAssets.reduce((sum, a) => sum + (a.grams || 0), 0);

    return {
      count,
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      returnPct,
      isProfitable,
      totalGoldGrams,
      totalSilverGrams,
      goldCount: goldAssets.length,
      silverCount: silverAssets.length,
    };
  }, [filteredAssets]);

  return (
    <div className="space-y-4">
      
      {/* 1. Combined Entity Return / Performance Summary Banner at the Top */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-slate-800/90 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        {/* Ambient radial glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 w-56 h-56 bg-yellow-500/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Entity Name, Active Sub-filter & Physical Specification */}
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 shrink-0 shadow-inner">
              {selectedType === 'PRECIOUS_METALS' ? (
                <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : selectedType === 'EQUITY' ? (
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : selectedType === 'REAL_ESTATE' ? (
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : selectedType === 'CASH_SAVINGS' ? (
                <Landmark className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : selectedType === 'PROVIDENT_FUND' ? (
                <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  {activeFilterOption?.icon && <span>{activeFilterOption.icon}</span>}
                  <span>{subFilter !== 'ALL' ? activeFilterOption?.label : (selectedType === 'ALL' ? 'All Portfolio Holdings' : `${selectedType.replace('_', ' ')} Combined`)}</span>
                </span>
                {subFilter !== 'ALL' && (
                  <button
                    onClick={() => setSubFilter('ALL')}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-700 transition-colors"
                    title="Clear Sub-filter"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear Filter</span>
                  </button>
                )}
              </div>
              
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Combined Entity Return</span>
                <span className="text-xs font-mono font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                  {combinedMetrics.count} {combinedMetrics.count === 1 ? 'Holding' : 'Holdings'}
                </span>
              </h2>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                {combinedMetrics.totalGoldGrams > 0 && (
                  <span className="text-amber-300 font-mono font-medium flex items-center gap-1">
                    🟡 {formatNumber(combinedMetrics.totalGoldGrams, 2)}g Gold
                  </span>
                )}
                {combinedMetrics.totalSilverGrams > 0 && (
                  <span className="text-slate-300 font-mono font-medium flex items-center gap-1">
                    ⚪ {formatNumber(combinedMetrics.totalSilverGrams, 2)}g Silver
                  </span>
                )}
                {searchQuery && (
                  <span className="text-slate-500 text-[11px]">
                    (matching &ldquo;{searchQuery}&rdquo;)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Combined Financial Metrics (Invested, Valuation, Return) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-950/70 p-2.5 sm:p-3 rounded-2xl border border-slate-800/90 shrink-0">
            
            {/* Invested */}
            <div className="px-2 sm:px-3 py-1 text-left">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                Invested Capital
              </span>
              <span className="text-xs sm:text-base font-bold text-slate-200 font-mono block mt-0.5">
                {formatINR(combinedMetrics.totalInvested)}
              </span>
            </div>

            {/* Current Valuation */}
            <div className="px-2 sm:px-3 py-1 text-left border-l border-slate-800/80">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                Current Valuation
              </span>
              <span className="text-xs sm:text-base font-bold text-amber-300 font-mono block mt-0.5">
                {formatINR(combinedMetrics.totalCurrentValue)}
              </span>
            </div>

            {/* Combined Gain / Return */}
            <div className="px-2 sm:px-3 py-1 text-left border-l border-slate-800/80">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                Combined Return
              </span>
              <div className="flex flex-wrap items-baseline gap-1.5 mt-0.5">
                <span className={`text-xs sm:text-base font-bold font-mono ${
                  combinedMetrics.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {combinedMetrics.isProfitable ? '+' : ''}{formatINR(combinedMetrics.totalProfitLoss)}
                </span>
                <span className={`text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  combinedMetrics.isProfitable 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {combinedMetrics.isProfitable ? '+' : ''}{formatNumber(combinedMetrics.returnPct, 2)}%
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 2. Controls Bar: Search, View Mode Toggle, Sub-entity Filter Dropdown, and Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gold bars, shares, property, FD, notes..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-amber-500/20 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-amber-500/20 text-amber-400 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Entity Filter Dropdown (Exact Red Arrow Position) */}
          <div className="relative">
            <button
              onClick={() => {
                setIsFilterDropdownOpen(!isFilterDropdownOpen);
                setIsSortDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all border ${
                subFilter !== 'ALL'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-200'
              }`}
              title="Filter by Sub-entity / Type"
            >
              <Filter className={`w-3.5 h-3.5 ${subFilter !== 'ALL' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="max-w-[110px] sm:max-w-[150px] truncate">
                {activeFilterOption ? (activeFilterOption.shortLabel || activeFilterOption.label) : 'Filter Entity'}
              </span>
              {subFilter !== 'ALL' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
              <motion.div
                animate={{ rotate: isFilterDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </motion.div>
            </button>

            {/* Filter Dropdown Menu */}
            <AnimatePresence>
              {isFilterDropdownOpen && (
                <>
                  <div
                    onClick={() => setIsFilterDropdownOpen(false)}
                    className="fixed inset-0 z-20"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-30 py-2 overflow-hidden text-xs divide-y divide-slate-700/50"
                  >
                    <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Filter by Sub-Type</span>
                      {subFilter !== 'ALL' && (
                        <button
                          onClick={() => {
                            setSubFilter('ALL');
                            setIsFilterDropdownOpen(false);
                          }}
                          className="text-amber-400 hover:underline lowercase"
                        >
                          reset
                        </button>
                      )}
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto no-scrollbar">
                      {filterOptions.map((opt) => {
                        const isSelected = subFilter === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSubFilter(opt.id);
                              setIsFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between ${
                              isSelected
                                ? 'bg-amber-500/15 text-amber-300 font-bold'
                                : 'text-slate-300 hover:bg-slate-700/60'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {opt.icon && <span>{opt.icon}</span>}
                              <span>{opt.label}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-900/60 text-slate-400'
                              }`}>
                                {opt.count}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Smooth Animated Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsSortDropdownOpen(!isSortDropdownOpen);
                setIsFilterDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none transition-all"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{sortOptions.find((o) => o.id === sortBy)?.label}</span>
              <span className="sm:hidden">Sort</span>
              <motion.div
                animate={{ rotate: isSortDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </motion.div>
            </button>

            {/* Sort Dropdown Menu */}
            <AnimatePresence>
              {isSortDropdownOpen && (
                <>
                  <div
                    onClick={() => setIsSortDropdownOpen(false)}
                    className="fixed inset-0 z-20"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl z-30 py-1.5 overflow-hidden text-xs"
                  >
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSortBy(opt.id as any);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 transition-colors flex items-center justify-between ${
                          sortBy === opt.id
                            ? 'bg-amber-500/10 text-amber-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Asc/Desc Button */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all"
            title={sortAsc ? 'Ascending Order' : 'Descending Order'}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 3. Quick Sub-category Filter Pills (Interactive horizontal chips) */}
      {filterOptions.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" />
            Quick:
          </span>
          {filterOptions.map((opt) => {
            const isSelected = subFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSubFilter(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {opt.icon && <span>{opt.icon}</span>}
                <span>{opt.shortLabel || opt.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Main Content: High-Density Table View vs Card Grid */}
      {filteredAssets.length > 0 ? (
        viewMode === 'table' ? (
          /* High-Density Table View with On-Demand Hover Actions */
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
            {/* Mobile Card List (When table is active on mobile screens) */}
            <div className="sm:hidden divide-y divide-slate-800/60">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="p-3">
                  <AssetCard
                    asset={asset}
                    onSelect={onSelectAsset}
                    onEdit={onEditAsset}
                    onDelete={onDeleteAsset}
                  />
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Asset Details</th>
                    <th className="py-3.5 px-4">Key Specifications</th>
                    <th className="py-3.5 px-4 text-right">Invested Capital</th>
                    <th className="py-3.5 px-4 text-right">Current Valuation</th>
                    <th className="py-3.5 px-4 text-right">Profit / Returns</th>
                    <th className="py-3.5 px-3 w-16 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAssets.map((asset) => {
                    const metrics = asset.metrics;
                    const isPositive = (metrics?.profitLoss || 0) >= 0;

                    return (
                      <tr
                        key={asset.id}
                        onClick={() => onSelectAsset(asset)}
                        className="group hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        {/* Title, Badge & Date */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {metrics?.imagePath && (
                              <img
                                src={metrics.imagePath}
                                alt={asset.name}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-700/80 shrink-0 bg-slate-800"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-amber-300 border border-slate-700">
                                  {metrics?.categoryBadge}
                                </span>
                              </div>
                              <div className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors text-sm">
                                {asset.name}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{asset.purchaseDate}</span>
                                {asset.notes && (
                                  <span className="text-slate-500 truncate max-w-xs">
                                    • {asset.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Specifications */}
                        <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                          {metrics?.keyMetricDisplay || '—'}
                        </td>

                        {/* Invested */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300 text-sm">
                          {formatINR(metrics?.investedAmount || asset.investedAmount)}
                        </td>

                        {/* Current Value */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-300 text-sm">
                          {formatINR(metrics?.currentValue)}
                        </td>

                        {/* Profit/Loss */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className={`font-bold text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{formatNumber(metrics?.returnPct, 2)}%
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                            {metrics?.cagrDisplay && metrics.cagrDisplay !== '(< 1 yr)' ? (
                              <span className="text-emerald-400/90 font-medium">{metrics.cagrDisplay} CAGR</span>
                            ) : (
                              <span>{isPositive ? '+' : ''}{formatINR(metrics?.profitLoss)}</span>
                            )}
                          </div>
                        </td>

                        {/* On-Demand Desktop Hover Actions */}
                        <td 
                          onClick={(e) => e.stopPropagation()}
                          className="py-3.5 px-3 text-center"
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEditAsset(asset)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700/80 transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => asset.id && onDeleteAsset(asset.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id || Math.random()}
                asset={asset}
                onSelect={onSelectAsset}
                onEdit={onEditAsset}
                onDelete={onDeleteAsset}
              />
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-1">No Assets Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            {searchQuery 
              ? `No holdings matching "${searchQuery}". Try clearing your search query.`
              : subFilter !== 'ALL'
              ? `No holdings under "${activeFilterOption?.label}". Try clearing the sub-type filter.`
              : `You haven't added any assets under this category yet.`}
          </p>
          <div className="flex items-center justify-center gap-3">
            {subFilter !== 'ALL' && (
              <button
                onClick={() => setSubFilter('ALL')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
                <span>Clear Sub-Filter</span>
              </button>
            )}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Asset</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
