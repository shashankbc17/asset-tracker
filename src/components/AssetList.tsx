import React, { useState, useMemo } from 'react';
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
  Calendar
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

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  selectedType,
  onSelectAsset,
  onEditAsset,
  onDeleteAsset,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'gain' | 'date' | 'name'>('value');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const sortOptions = [
    { id: 'value', label: 'Highest Valuation' },
    { id: 'gain', label: 'Highest Profit (₹)' },
    { id: 'date', label: 'Recent Purchase' },
    { id: 'name', label: 'Asset Name (A-Z)' },
  ];

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        if (selectedType !== 'ALL' && asset.assetType !== selectedType) return false;
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
  }, [assets, selectedType, searchQuery, sortBy, sortAsc]);

  return (
    <div className="space-y-4">
      
      {/* Controls Bar: Search, View Mode Toggle & Smooth Sort Dropdown */}
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

        <div className="flex items-center justify-between sm:justify-end gap-2">
          
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

          {/* Smooth Animated Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none transition-all"
            >
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>{sortOptions.find((o) => o.id === sortBy)?.label}</span>
              <motion.div
                animate={{ rotate: isSortDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </motion.div>
            </button>

            {/* Dropdown Menu with Spring Physics */}
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

      {/* Main Content: High-Density Table View (Desktop default) vs Card Grid */}
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
                                  // Fallback hide on image load error
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
              : `You haven't added any assets under this category yet.`}
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Asset</span>
          </button>
        </div>
      )}

    </div>
  );
};
