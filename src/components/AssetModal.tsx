import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Coins, 
  TrendingUp, 
  Building2, 
  Landmark, 
  PiggyBank, 
  Sparkles, 
  Check,
  Lock 
} from 'lucide-react';
import { Asset, AssetType, MetalRates, MetalType, CategoryType } from '../types/portfolio';
import { getRateForDate } from '../services/ratesService';
import { calculateAssetMetrics, formatINR, formatNumber } from '../utils/calculations';

export function computeAutoCoinName(
  metalType: MetalType,
  grams: number | '' | undefined,
  purity: '22K' | '24K' = '22K'
): string {
  const weightStr = (grams !== undefined && grams !== '' && Number(grams) > 0) ? ` (${Number(grams)}g)` : '';
  if (metalType === 'SILVER') {
    return `Silver Coin${weightStr}`;
  }
  return `${purity} Coin${weightStr}`;
}

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  editingAsset: Asset | null;
  rates: MetalRates;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAsset,
  rates,
}) => {
  const [assetType, setAssetType] = useState<AssetType>('PRECIOUS_METALS');
  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Precious Metals
  const [metalType, setMetalType] = useState<MetalType>('GOLD');
  const [categoryType, setCategoryType] = useState<CategoryType>('COIN_BAR');
  const [goldPurity, setGoldPurity] = useState<'22K' | '24K'>('22K');
  const [grams, setGrams] = useState<number | ''>(10);
  const [rateBought, setRateBought] = useState<number | ''>(rates.gold22k || (rates.gold24k ? Math.round(rates.gold24k * 0.916) : 14010));
  const [deduction, setDeduction] = useState<number | ''>(0);
  const [suggestedRateNote, setSuggestedRateNote] = useState<string | null>(null);

  // Equities
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(100);
  const [buyPrice, setBuyPrice] = useState<number | ''>(1000);
  const [currentPrice, setCurrentPrice] = useState<number | ''>(1200);

  // Real Estate
  const [location, setLocation] = useState('');
  const [areaSqFt, setAreaSqFt] = useState<number | ''>(1200);
  const [reInvested, setReInvested] = useState<number | ''>(5000000);
  const [estimatedMarketValue, setEstimatedMarketValue] = useState<number | ''>(6500000);
  const [monthlyRentalIncome, setMonthlyRentalIncome] = useState<number | ''>(25000);

  // Cash / FD
  const [bankName, setBankName] = useState('');
  const [cashInvested, setCashInvested] = useState<number | ''>(500000);
  const [interestRatePct, setInterestRatePct] = useState<number | ''>(7.1);
  const [maturityDate, setMaturityDate] = useState('');

  // Provident Fund
  const [pfSchemeType, setPfSchemeType] = useState('EPF');
  const [uanOrAccountId, setUanOrAccountId] = useState('');
  const [pfInvested, setPfInvested] = useState<number | ''>(300000);
  const [isActiveContribution, setIsActiveContribution] = useState(true);
  const [monthlyContribution, setMonthlyContribution] = useState<number | ''>(15000);
  const [pfInterestRate, setPfInterestRate] = useState<number | ''>(8.25);

  const isCoin = assetType === 'PRECIOUS_METALS' && categoryType === 'COIN_BAR';
  const autoCoinName = computeAutoCoinName(metalType, grams, goldPurity);

  // Prepopulate form on open / edit
  useEffect(() => {
    if (editingAsset) {
      setAssetType(editingAsset.assetType);
      setPurchaseDate(editingAsset.purchaseDate || new Date().toISOString().split('T')[0]);
      setNotes(editingAsset.notes || '');

      // Metals
      const mType = editingAsset.metalType || 'GOLD';
      const cType = editingAsset.categoryType || 'COIN_BAR';
      const g = editingAsset.grams ?? 10;
      const initialPurity: '22K' | '24K' = (editingAsset.name && editingAsset.name.includes('24K')) ? '24K' : '22K';

      setMetalType(mType);
      setCategoryType(cType);
      setGoldPurity(initialPurity);
      setGrams(g);
      const defaultRate = initialPurity === '24K' 
        ? (rates.gold24k || rates.gold || 15295) 
        : (rates.gold22k || (rates.gold24k ? Math.round(rates.gold24k * 0.916) : 14010));
      setRateBought(editingAsset.rateBought ?? defaultRate);
      setDeduction(editingAsset.deduction ?? (cType === 'JEWELRY' ? 4 : 0));

      // If it's a coin, immediately force the standardized coin name so old jewelry names never appear!
      if (editingAsset.assetType === 'PRECIOUS_METALS' && cType === 'COIN_BAR') {
        setName(computeAutoCoinName(mType, g, initialPurity));
      } else {
        setName(editingAsset.name || '');
      }

      // Equities
      setTicker(editingAsset.ticker || '');
      setQuantity(editingAsset.quantity ?? 100);
      setBuyPrice(editingAsset.buyPrice ?? 1000);
      setCurrentPrice(editingAsset.currentPrice ?? 1200);

      // Real Estate
      setLocation(editingAsset.location || '');
      setAreaSqFt(editingAsset.areaSqFt ?? 1200);
      setReInvested(editingAsset.investedAmount ?? 5000000);
      setEstimatedMarketValue(editingAsset.estimatedMarketValue ?? 6500000);
      setMonthlyRentalIncome(editingAsset.monthlyRentalIncome ?? 25000);

      // Cash
      setBankName(editingAsset.bankName || '');
      setCashInvested(editingAsset.investedAmount ?? 500000);
      setInterestRatePct(editingAsset.interestRatePct ?? 7.1);
      setMaturityDate(editingAsset.maturityDate || '');

      // PF
      setPfSchemeType(editingAsset.pfSchemeType || 'EPF');
      setUanOrAccountId(editingAsset.uanOrAccountId || '');
      setPfInvested(editingAsset.investedAmount ?? 300000);
      setIsActiveContribution(editingAsset.isActiveContribution !== false);
      setMonthlyContribution(editingAsset.monthlyContribution ?? 15000);
      setPfInterestRate(editingAsset.pfInterestRate ?? 8.25);
    } else {
      // New asset default
      setName(computeAutoCoinName('GOLD', 10, '22K'));
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setRateBought(rates.gold22k || (rates.gold24k ? Math.round(rates.gold24k * 0.916) : 14010));
      setSuggestedRateNote(null);
      setGoldPurity('22K');
      setMetalType('GOLD');
      setCategoryType('COIN_BAR');
      setGrams(10);
      setDeduction(0);
    }
  }, [editingAsset, isOpen, rates]);

  // Historical rate auto-lookup when purchase date changes for Metals
  const handleAutoSuggestRate = async () => {
    if (!purchaseDate) return;
    const lookup = await getRateForDate(purchaseDate);
    if (lookup) {
      if (metalType === 'GOLD') {
        const rate = (categoryType === 'JEWELRY' || goldPurity === '22K' ? lookup.gold22k : lookup.gold24k) || 0;
        setRateBought(Math.round(rate));
        setSuggestedRateNote(`Auto-suggested ${goldPurity} Gold from ${lookup.matchedDate} benchmark (₹${rate}/g)`);
      } else {
        const rate = lookup.silver || 0;
        setRateBought(Math.round(rate));
        setSuggestedRateNote(`Auto-suggested silver from ${lookup.matchedDate} benchmark (₹${rate}/g)`);
      }
    } else {
      setSuggestedRateNote('No historical benchmark found for this date.');
    }
  };

  // Compute live preview
  const currentAssetDraft: Asset = {
    name: isCoin ? autoCoinName : (name || 'Preview Holding'),
    assetType,
    purchaseDate,
    investedAmount:
      assetType === 'PRECIOUS_METALS' ? (Number(grams) || 0) * (Number(rateBought) || 0)
      : assetType === 'EQUITY' ? (Number(quantity) || 0) * (Number(buyPrice) || 0)
      : assetType === 'REAL_ESTATE' ? (Number(reInvested) || 0)
      : assetType === 'CASH_SAVINGS' ? (Number(cashInvested) || 0)
      : (Number(pfInvested) || 0),
    metalType,
    categoryType,
    grams: Number(grams) || 0,
    rateBought: Number(rateBought) || 0,
    deduction: Number(deduction) || 0,
    ticker,
    quantity: Number(quantity) || 0,
    buyPrice: Number(buyPrice) || 0,
    currentPrice: Number(currentPrice) || 0,
    location,
    areaSqFt: Number(areaSqFt) || 0,
    estimatedMarketValue: Number(estimatedMarketValue) || 0,
    monthlyRentalIncome: Number(monthlyRentalIncome) || 0,
    bankName,
    interestRatePct: Number(interestRatePct) || 0,
    maturityDate,
    pfSchemeType,
    uanOrAccountId,
    isActiveContribution,
    monthlyContribution: Number(monthlyContribution) || 0,
    pfInterestRate: Number(pfInterestRate) || 0,
    notes,
  };

  const previewMetrics = calculateAssetMetrics(currentAssetDraft, rates);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isCoin ? autoCoinName : name.trim();
    if (!finalName) {
      alert('Please enter an Asset Name.');
      return;
    }

    const payload: Asset = {
      ...currentAssetDraft,
      id: editingAsset?.id,
      name: finalName,
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-white"
        >
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                {editingAsset ? 'Edit Asset Holding' : 'Add New Asset Holding'}
              </h2>
              <p className="text-xs text-slate-400">
                Supports Gold, Silver, Stocks, Real Estate, FDs &amp; Provident Fund
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
            
            {/* 1. Category Selector Buttons */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Asset Class Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'PRECIOUS_METALS', label: 'Metals', icon: Coins, color: 'text-amber-400' },
                  { id: 'EQUITY', label: 'Stocks/MF', icon: TrendingUp, color: 'text-indigo-400' },
                  { id: 'REAL_ESTATE', label: 'Real Estate', icon: Building2, color: 'text-emerald-400' },
                  { id: 'CASH_SAVINGS', label: 'Cash/FD', icon: Landmark, color: 'text-sky-400' },
                  { id: 'PROVIDENT_FUND', label: 'EPF/PPF', icon: PiggyBank, color: 'text-purple-400' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = assetType === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setAssetType(item.id as AssetType);
                        if (item.id === 'PRECIOUS_METALS') {
                          if (categoryType === 'COIN_BAR') {
                            setName(computeAutoCoinName(metalType, grams, goldPurity));
                          } else {
                            setName(metalType === 'GOLD' ? '22K Gold Jewelry' : 'Silver Jewelry');
                          }
                        } else if (!name || name.includes('Gold') || name.includes('Silver') || name.includes('Coin') || name.includes('Shares') || name.includes('Flat') || name.includes('FD') || name.includes('EPF')) {
                          if (item.id === 'EQUITY') setName('Bluechip Equity Portfolio');
                          if (item.id === 'REAL_ESTATE') setName('Residential Apartment');
                          if (item.id === 'CASH_SAVINGS') setName('Bank Fixed Deposit');
                          if (item.id === 'PROVIDENT_FUND') setName('Provident Fund Corpus');
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-xs font-medium ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-amber-400' : item.color}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Common Fields: Name & Purchase Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Holding Name / Label *
                  </label>
                  {isCoin ? (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3" /> Auto-Generated Coin Name
                    </span>
                  ) : assetType === 'PRECIOUS_METALS' && categoryType === 'JEWELRY' ? (
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      Custom Jewelry Name
                    </span>
                  ) : null}
                </div>
                <input
                  type="text"
                  required
                  disabled={isCoin}
                  value={isCoin ? autoCoinName : name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    isCoin
                      ? autoCoinName
                      : "e.g. 22K Bridal Gold Jewelry, Necklace, Bangles..."
                  }
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all ${
                    isCoin
                      ? 'bg-slate-800/40 border-slate-700/60 text-amber-300 font-bold cursor-not-allowed select-none shadow-inner'
                      : 'bg-slate-800 border-slate-700 focus:border-amber-500'
                  }`}
                />
                {isCoin && (
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <span className="text-amber-400">ℹ️</span>
                    <span>Coins have fixed naming based on weight ({grams || 0}g). Custom names are only for Jewelry holdings.</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Purchase / Start Date *
                  </label>
                  {assetType === 'PRECIOUS_METALS' && (
                    <button
                      type="button"
                      onClick={handleAutoSuggestRate}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      Lookup Rate
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => {
                    setPurchaseDate(e.target.value);
                    if (assetType === 'PRECIOUS_METALS') setSuggestedRateNote(null);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* 3. Category Specific Fieldsets */}

            {/* A. PRECIOUS METALS */}
            {assetType === 'PRECIOUS_METALS' && (
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Metal Type</label>
                    <select
                      value={metalType}
                      onChange={(e) => {
                        const val = e.target.value as MetalType;
                        setMetalType(val);
                        if (categoryType === 'COIN_BAR') {
                          setName(computeAutoCoinName(val, grams, goldPurity));
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Holding Category</label>
                    <select
                      value={categoryType}
                      onChange={(e) => {
                        const val = e.target.value as CategoryType;
                        setCategoryType(val);
                        if (val === 'JEWELRY') {
                          if (deduction === 0) setDeduction(4.0);
                          if (!name || name.includes('Coin') || name.includes('Bar') || name.includes('Bullion')) {
                            setName(metalType === 'GOLD' ? `${goldPurity} Gold Jewelry` : 'Silver Jewelry');
                          }
                        }
                        if (val === 'COIN_BAR') {
                          setDeduction(0);
                          setName(computeAutoCoinName(metalType, grams, goldPurity));
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="COIN_BAR">Coin / Bar / Bullion (0% loss)</option>
                      <option value="JEWELRY">Jewelry / Ornaments (Wastage %)</option>
                    </select>
                  </div>
                </div>

                {/* Gold Purity / Karat Toggle */}
                {metalType === 'GOLD' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Gold Purity / Karat</span>
                      <span className="text-[10px] text-amber-400 font-mono">
                        {categoryType === 'COIN_BAR' ? `Coin Name: ${computeAutoCoinName('GOLD', grams, goldPurity)}` : 'Benchmark Rate Purity'}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setGoldPurity('22K');
                          if (categoryType === 'COIN_BAR') {
                            setName(computeAutoCoinName('GOLD', grams, '22K'));
                          }
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          goldPurity === '22K'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/40'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>22K Coin (91.6% Sovereign)</span>
                        {goldPurity === '22K' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGoldPurity('24K');
                          if (categoryType === 'COIN_BAR') {
                            setName(computeAutoCoinName('GOLD', grams, '24K'));
                          }
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          goldPurity === '24K'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/40'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>24K Coin (99.9% Bullion)</span>
                        {goldPurity === '24K' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Weight (Grams) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={grams}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setGrams(val);
                        if (categoryType === 'COIN_BAR') {
                          setName(computeAutoCoinName(metalType, val, goldPurity));
                        }
                      }}
                      placeholder="e.g. 50"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Buy Rate (₹/gram) *</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={rateBought}
                      onChange={(e) => setRateBought(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 5200"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Deduction %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={deduction}
                      onChange={(e) => setDeduction(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 4.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {suggestedRateNote && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{suggestedRateNote}</span>
                  </div>
                )}
              </div>
            )}

            {/* B. EQUITIES */}
            {assetType === 'EQUITY' && (
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ticker / Stock / Scheme</label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="e.g. TCS.NS, NIFTYBEES, Parag Parikh Flexi Cap"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity / Units *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Avg Buy Price (₹) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Current Price CMP (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* C. REAL ESTATE */}
            {assetType === 'REAL_ESTATE' && (
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Landmark</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bengaluru, Indiranagar"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Built-up Area (Sq Ft)</label>
                    <input
                      type="number"
                      value={areaSqFt}
                      onChange={(e) => setAreaSqFt(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 1850"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Total Invested (₹) *</label>
                    <input
                      type="number"
                      required
                      value={reInvested}
                      onChange={(e) => setReInvested(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Appraised Market Value (₹)</label>
                    <input
                      type="number"
                      value={estimatedMarketValue}
                      onChange={(e) => setEstimatedMarketValue(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Rent Yield (₹)</label>
                    <input
                      type="number"
                      value={monthlyRentalIncome}
                      onChange={(e) => setMonthlyRentalIncome(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 35000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* D. CASH / FD */}
            {assetType === 'CASH_SAVINGS' && (
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bank / Institution</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Principal (₹) *</label>
                    <input
                      type="number"
                      required
                      value={cashInvested}
                      onChange={(e) => setCashInvested(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Interest Rate (% p.a.)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={interestRatePct}
                      onChange={(e) => setInterestRatePct(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 7.25"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Maturity Date (Optional)</label>
                    <input
                      type="date"
                      value={maturityDate}
                      onChange={(e) => setMaturityDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* E. PROVIDENT FUND */}
            {assetType === 'PROVIDENT_FUND' && (
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Scheme</label>
                    <select
                      value={pfSchemeType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPfSchemeType(val);
                        if (val === 'PPF') setPfInterestRate(7.10);
                        if (val === 'EPF') setPfInterestRate(8.25);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="EPF">EPF (Employee Provident Fund)</option>
                      <option value="PPF">PPF (Public Provident Fund)</option>
                      <option value="VPF">VPF (Voluntary PF)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                    <select
                      value={isActiveContribution ? 'ACTIVE' : 'DORMANT'}
                      onChange={(e) => setIsActiveContribution(e.target.value === 'ACTIVE')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="ACTIVE">Active (Monthly Deductions)</option>
                      <option value="DORMANT">Dormant (Compounding)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Govt Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={pfInterestRate}
                      onChange={(e) => setPfInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Opening / Base Balance (₹) *</label>
                    <input
                      type="number"
                      required
                      value={pfInvested}
                      onChange={(e) => setPfInvested(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {isActiveContribution && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Contribution (₹)</label>
                      <input
                        type="number"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 18000"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Custody Info (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bank locker safe #42, Invoice #9021, SIP portfolio..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Real-time Calculation Preview Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Calculated Preview
                </span>
                <span>{previewMetrics.categoryBadge}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/80 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Total Invested</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
                    {formatINR(previewMetrics.investedAmount)}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Current Valuation</span>
                  <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono">
                    {formatINR(previewMetrics.currentValue)}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Gain / Return</span>
                  <span className={`text-xs sm:text-sm font-bold font-mono ${
                    previewMetrics.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {previewMetrics.isProfitable ? '+' : ''}{formatNumber(previewMetrics.returnPct, 1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{editingAsset ? 'Update Asset' : 'Save Asset'}</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
