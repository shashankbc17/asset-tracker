import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { NetWorthHero } from './components/NetWorthHero';
import { AllocationPills } from './components/AllocationPills';
import { AssetList } from './components/AssetList';
import { AssetModal } from './components/AssetModal';
import { AssetDetailDrawer } from './components/AssetDetailDrawer';
import { LiabilityCard } from './components/LiabilityCard';
import { LiabilityModal } from './components/LiabilityModal';
import { LiabilityDetailModal } from './components/LiabilityDetailModal';
import { RatesModal } from './components/RatesModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { CsvModal } from './components/CsvModal';
import { Asset, AssetType, MetalRates, NetWorthSummary, Liability } from './types/portfolio';
import { 
  getAssets, 
  createOrUpdateAsset, 
  deleteAsset as apiDeleteAsset, 
  getLiabilities,
  createOrUpdateLiability,
  deleteLiability as apiDeleteLiability,
  syncLiveMarketRates, 
  updateManualRates 
} from './services/api';
import { fetchCurrentRates, loadHistoricalRates } from './services/ratesService';
import { AuthService, UserProfile } from './services/auth';
import { subscribeToUserPortfolio, savePortfolioToFirestore } from './services/firestoreService';
import { calculateAssetMetrics, computePortfolioSummary, calculateLiabilityMetrics, formatINR } from './utils/calculations';
import { Loader2, Plus, Building2, Layers, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => AuthService.getInitialUser());
  const [rates, setRates] = useState<MetalRates>({
    gold: 16408,
    gold24k: 16408,
    gold22k: 15030,
    silver: 257,
    lastUpdated: new Date().toISOString(),
    source: 'Karnataka Bullion Market',
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [summary, setSummary] = useState<NetWorthSummary>({
    userId: 'default_user',
    totalInvested: 0,
    totalCurrentValue: 0,
    totalGainLoss: 0,
    totalPercentageGainLoss: 0,
    allocations: [],
    totalLiabilitiesValue: 0,
    netWorth: 0,
    totalMonthlyEmi: 0,
    totalInterestPaidSoFar: 0,
    totalFutureInterestPayable: 0,
    debtToAssetRatio: 0,
    activeLoansCount: 0,
  });

  // Navigation View Toggle: 'ASSETS' vs 'LIABILITIES'
  const [mainView, setMainView] = useState<'ASSETS' | 'LIABILITIES'>('ASSETS');

  // Asset states
  const [selectedType, setSelectedType] = useState<AssetType | 'ALL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Liability states
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [selectedLiabilityForDetail, setSelectedLiabilityForDetail] = useState<Liability | null>(null);
  const [isLiabilityDetailOpen, setIsLiabilityDetailOpen] = useState(false);

  // Global modals
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a stable ref to rates to avoid re-triggering effects
  const ratesRef = React.useRef(rates);
  ratesRef.current = rates;

  // Recalculate all assets, liabilities, and true net worth summary (100% stable callback)
  const refreshPortfolio = useCallback((
    currentAssets: Asset[], 
    currentRates?: MetalRates, 
    userId = 'default_user',
    currentLiabilities?: Liability[]
  ) => {
    const activeRates = currentRates || ratesRef.current;
    const updatedAssets = currentAssets.map((asset) => ({
      ...asset,
      metrics: calculateAssetMetrics(asset, activeRates),
    }));
    setAssets(updatedAssets);

    setLiabilities((prevLiabs) => {
      const targetLiabs = currentLiabilities !== undefined ? currentLiabilities : prevLiabs;
      const effectiveLiabs = targetLiabs.map((l) => ({
        ...l,
        metrics: calculateLiabilityMetrics(l),
      }));

      const newSummary = computePortfolioSummary(updatedAssets, activeRates, userId, effectiveLiabs);
      setSummary(newSummary);
      return effectiveLiabs;
    });
  }, []);

  // Listen to Auth State & Cloud Firestore Real-Time Sync ONCE
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = AuthService.onAuthStateChange((currentUser) => {
      setUser(currentUser);

      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      const uid = currentUser ? currentUser.uid : 'default_user';

      // 1. Hydrate assets and liabilities from local storage
      Promise.all([getAssets(uid, ratesRef.current), getLiabilities(uid)]).then(([loadedAssets, loadedLiabs]) => {
        refreshPortfolio(loadedAssets, ratesRef.current, uid, loadedLiabs);
      });

      // 2. Connect Firestore sync in background
      if (currentUser) {
        unsubscribeFirestore = subscribeToUserPortfolio(currentUser.uid, (cloudAssets, cloudRates, cloudLiabilities) => {
          if (cloudAssets && Array.isArray(cloudAssets)) {
            const effectiveRates = cloudRates || ratesRef.current;
            refreshPortfolio(cloudAssets, effectiveRates, currentUser.uid, cloudLiabilities);
          }
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [refreshPortfolio]);

  // Initial load
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        loadHistoricalRates();
        const initialRates = await fetchCurrentRates();
        setRates(initialRates);
        ratesRef.current = initialRates;

        const activeUser = AuthService.getInitialUser();
        const currentUserId = activeUser ? activeUser.uid : 'default_user';
        const [loadedAssets, loadedLiabs] = await Promise.all([
          getAssets(currentUserId, initialRates),
          getLiabilities(currentUserId),
        ]);
        refreshPortfolio(loadedAssets, initialRates, currentUserId, loadedLiabs);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [refreshPortfolio]);

  // Google Login / Logout Handlers
  const handleGoogleLogin = async () => {
    try {
      await AuthService.signInWithGoogle();
    } catch (err) {
      alert('Google Sign-In was cancelled or failed. Please check browser popups.');
    }
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    setUser(null);
    const [guestAssets, guestLiabs] = await Promise.all([
      getAssets('default_user', rates),
      getLiabilities('default_user'),
    ]);
    refreshPortfolio(guestAssets, rates, 'default_user', guestLiabs);
  };

  // Asset CRUD Handlers
  const handleSaveAsset = async (assetData: Asset) => {
    const userId = user ? user.uid : 'default_user';
    const saved = await createOrUpdateAsset({ ...assetData, userId }, userId, rates);
    let updatedList: Asset[];
    if (editingAsset && editingAsset.id) {
      updatedList = assets.map((a) => (String(a.id) === String(editingAsset.id) ? { ...saved, id: editingAsset.id } : a));
    } else {
      updatedList = [saved, ...assets];
    }
    refreshPortfolio(updatedList, rates, userId, liabilities);
    setEditingAsset(null);

    if (user) {
      await savePortfolioToFirestore(user.uid, updatedList, rates, liabilities);
    }
  };

  const handleDeleteAsset = async (id: number | string) => {
    if (window.confirm('Are you sure you want to delete this asset holding?')) {
      const userId = user ? user.uid : 'default_user';
      await apiDeleteAsset(id, userId);
      const remaining = assets.filter((a) => String(a.id) !== String(id));
      refreshPortfolio(remaining, rates, userId, liabilities);
      if (selectedAssetForDetail && String(selectedAssetForDetail.id) === String(id)) {
        setIsDetailDrawerOpen(false);
        setSelectedAssetForDetail(null);
      }

      if (user) {
        savePortfolioToFirestore(user.uid, remaining, rates, liabilities);
      }
    }
  };

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAssetForDetail(asset);
    setIsDetailDrawerOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsAddModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingAsset(null);
    setIsAddModalOpen(true);
  };

  // Liability / Loan CRUD Handlers
  const handleSaveLiability = async (liabilityData: Liability) => {
    const userId = user ? user.uid : 'default_user';
    const saved = await createOrUpdateLiability({ ...liabilityData, userId }, userId);
    let updatedLiabs: Liability[];
    if (editingLiability && editingLiability.id) {
      updatedLiabs = liabilities.map((l) => (String(l.id) === String(editingLiability.id) ? { ...saved, id: editingLiability.id } : l));
    } else {
      updatedLiabs = [saved, ...liabilities];
    }
    refreshPortfolio(assets, rates, userId, updatedLiabs);
    setEditingLiability(null);

    if (user) {
      savePortfolioToFirestore(user.uid, assets, rates, updatedLiabs);
    }
  };

  const handleDeleteLiability = async (id: number | string) => {
    if (window.confirm('Are you sure you want to delete this loan record?')) {
      const userId = user ? user.uid : 'default_user';
      await apiDeleteLiability(id, userId);
      const remaining = liabilities.filter((l) => String(l.id) !== String(id));
      refreshPortfolio(assets, rates, userId, remaining);
      if (selectedLiabilityForDetail && String(selectedLiabilityForDetail.id) === String(id)) {
        setIsLiabilityDetailOpen(false);
        setSelectedLiabilityForDetail(null);
      }

      if (user) {
        savePortfolioToFirestore(user.uid, assets, rates, remaining);
      }
    }
  };

  const handleSelectLiability = (liability: Liability) => {
    setSelectedLiabilityForDetail(liability);
    setIsLiabilityDetailOpen(true);
  };

  const handleEditLiability = (liability: Liability) => {
    setEditingLiability(liability);
    setIsAddLoanModalOpen(true);
  };

  const handleOpenAddLoan = () => {
    setEditingLiability(null);
    setIsAddLoanModalOpen(true);
  };

  // Rates Handlers
  const handleUpdateRates = async (newRates: { gold: number; silver: number }) => {
    const updated = await updateManualRates(newRates);
    setRates(updated);
    refreshPortfolio(assets, updated, user ? user.uid : 'default_user', liabilities);
    if (user) {
      savePortfolioToFirestore(user.uid, assets, updated, liabilities);
    }
  };

  const handleSyncRates = async () => {
    setIsSyncingRates(true);
    try {
      const updated = await syncLiveMarketRates();
      setRates(updated);
      refreshPortfolio(assets, updated, user ? user.uid : 'default_user', liabilities);
      if (user) {
        savePortfolioToFirestore(user.uid, assets, updated, liabilities);
      }
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setIsSyncingRates(false);
    }
  };

  const handleImportSuccess = (importedAssets: Asset[]) => {
    const combined = [...importedAssets, ...assets];
    refreshPortfolio(combined, rates, user ? user.uid : 'default_user', liabilities);
    if (user) {
      savePortfolioToFirestore(user.uid, combined, rates, liabilities);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation */}
      <Navbar
        rates={rates}
        onOpenAddModal={handleOpenAddModal}
        onOpenAddLoan={handleOpenAddLoan}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onSyncRates={handleSyncRates}
        isSyncingRates={isSyncingRates}
        user={user}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm font-medium">Loading portfolio holdings &amp; live rates...</p>
          </div>
        ) : (
          <>
            {/* 1. Net Worth Hero Card */}
            <NetWorthHero
              summary={summary}
              totalAssetsCount={assets.length}
              onOpenLiabilities={() => setMainView('LIABILITIES')}
            />

            {/* 2. Main View Segmented Toggle: Assets vs Liabilities */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3 pt-2">
              <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                
                {/* Assets View Button */}
                <button
                  onClick={() => setMainView('ASSETS')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    mainView === 'ASSETS'
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Assets &amp; Holdings</span>
                  <span className="text-[11px] font-mono bg-slate-800/80 px-1.5 py-0.5 rounded-md text-slate-300 border border-slate-700">
                    {assets.length}
                  </span>
                </button>

                {/* Liabilities View Button */}
                <button
                  onClick={() => setMainView('LIABILITIES')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    mainView === 'LIABILITIES'
                      ? 'bg-gradient-to-r from-rose-500/20 to-orange-500/20 text-rose-300 border border-rose-500/30 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Loans &amp; Liabilities</span>
                  <span className="text-[11px] font-mono bg-slate-800/80 px-1.5 py-0.5 rounded-md text-slate-300 border border-slate-700">
                    {liabilities.length}
                  </span>
                </button>

              </div>

              {/* View-Specific Action Button */}
              {mainView === 'LIABILITIES' ? (
                <button
                  onClick={handleOpenAddLoan}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-md shadow-rose-500/20 transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Loan</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Holding</span>
                </button>
              )}
            </div>

            {/* 3. Render VIEW A: Assets or VIEW B: Liabilities */}
            {mainView === 'ASSETS' ? (
              <>
                {/* Asset Allocation Horizontal Category Carousel */}
                <AllocationPills
                  selectedType={selectedType}
                  onSelectType={setSelectedType}
                  allocations={summary.allocations}
                  totalAssetsCount={assets.length}
                  totalCurrentValue={summary.totalCurrentValue}
                />

                {/* Assets List & Grid */}
                <AssetList
                  assets={assets}
                  selectedType={selectedType}
                  onSelectAsset={handleSelectAsset}
                  onEditAsset={handleEditAsset}
                  onDeleteAsset={handleDeleteAsset}
                  onOpenAddModal={handleOpenAddModal}
                />
              </>
            ) : (
              /* LIABILITIES VIEW */
              <div className="space-y-5">
                
                {/* Monthly Debt Outflow Banner */}
                {liabilities.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-200">
                          Total Monthly Repayment Obligation: <span className="text-white">{formatINR(summary.totalMonthlyEmi)}/mo</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Total outstanding debt of {formatINR(summary.totalLiabilitiesValue)} reducing your true net worth
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Interest Drag Incurred</span>
                        <span className="font-bold text-rose-400">{formatINR(summary.totalInterestPaidSoFar)}</span>
                      </div>
                      <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Future Interest Payable</span>
                        <span className="font-bold text-amber-300">{formatINR(summary.totalFutureInterestPayable)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liabilities Grid */}
                {liabilities.length === 0 ? (
                  <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
                    <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-300">No Active Liabilities</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      You have zero outstanding loans logged. Add personal loans, home loans, or gold loans to track debt amortization and net equity.
                    </p>
                    <button
                      onClick={handleOpenAddLoan}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Loan</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {liabilities.map((liability) => (
                      <LiabilityCard
                        key={liability.id}
                        liability={liability}
                        onSelect={handleSelectLiability}
                        onEdit={handleEditLiability}
                        onDelete={handleDeleteLiability}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}
          </>
        )}

      </main>

      {/* Modals & Drawers */}
      <AssetDetailDrawer
        asset={selectedAssetForDetail}
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedAssetForDetail(null);
        }}
        onEdit={handleEditAsset}
        onDelete={handleDeleteAsset}
        rates={rates}
      />

      <AssetModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAsset(null);
        }}
        onSave={handleSaveAsset}
        editingAsset={editingAsset}
        rates={rates}
      />

      {/* Liability Modals */}
      <LiabilityModal
        isOpen={isAddLoanModalOpen}
        onClose={() => {
          setIsAddLoanModalOpen(false);
          setEditingLiability(null);
        }}
        onSave={handleSaveLiability}
        editingLiability={editingLiability}
        assets={assets}
      />

      <LiabilityDetailModal
        liability={selectedLiabilityForDetail}
        isOpen={isLiabilityDetailOpen}
        onClose={() => {
          setIsLiabilityDetailOpen(false);
          setSelectedLiabilityForDetail(null);
        }}
        onEdit={handleEditLiability}
        assets={assets}
      />

      <RatesModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        rates={rates}
        onUpdateRates={handleUpdateRates}
        onSyncLive={handleSyncRates}
        isSyncing={isSyncingRates}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        summary={summary}
        assets={assets}
      />

      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        assets={assets}
        onImportSuccess={handleImportSuccess}
      />

      {/* Footer with Live Build & Git Commit Hash */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-5 text-center text-xs text-slate-500">
        <p>
          Asset Tracker • v4.1.0 (Commit: <span className="font-mono text-amber-400 font-semibold">{__APP_GIT_COMMIT__}</span>) • Built with React, Tailwind CSS &amp; Spring Boot
        </p>
      </footer>

    </div>
  );
};
export default App;

