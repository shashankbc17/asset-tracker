import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { NetWorthHero } from './components/NetWorthHero';
import { AllocationPills } from './components/AllocationPills';
import { AssetList } from './components/AssetList';
import { AssetModal } from './components/AssetModal';
import { AssetDetailDrawer } from './components/AssetDetailDrawer';
import { RatesModal } from './components/RatesModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { CsvModal } from './components/CsvModal';
import { Asset, AssetType, MetalRates, NetWorthSummary } from './types/portfolio';
import { 
  getAssets, 
  createOrUpdateAsset, 
  deleteAsset as apiDeleteAsset, 
  syncLiveMarketRates, 
  updateManualRates 
} from './services/api';
import { fetchCurrentRates, loadHistoricalRates } from './services/ratesService';
import { calculateAssetMetrics, computePortfolioSummary } from './utils/calculations';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [rates, setRates] = useState<MetalRates>({
    gold: 16408,
    gold24k: 16408,
    gold22k: 15030,
    silver: 257,
    lastUpdated: new Date().toISOString(),
    source: 'Karnataka Bullion Market',
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<NetWorthSummary>({
    userId: 'default_user',
    totalInvested: 0,
    totalCurrentValue: 0,
    totalGainLoss: 0,
    totalPercentageGainLoss: 0,
    allocations: [],
  });

  const [selectedType, setSelectedType] = useState<AssetType | 'ALL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Recalculate all assets and portfolio summary
  const refreshPortfolio = useCallback((currentAssets: Asset[], currentRates: MetalRates) => {
    const updatedAssets = currentAssets.map((asset) => ({
      ...asset,
      metrics: calculateAssetMetrics(asset, currentRates),
    }));
    setAssets(updatedAssets);
    const newSummary = computePortfolioSummary(updatedAssets, currentRates);
    setSummary(newSummary);
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        loadHistoricalRates(); // background pre-warm
        const initialRates = await fetchCurrentRates();
        setRates(initialRates);

        const loadedAssets = await getAssets('default_user', initialRates);
        refreshPortfolio(loadedAssets, initialRates);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [refreshPortfolio]);

  // Asset CRUD Handlers
  const handleSaveAsset = async (assetData: Asset) => {
    const saved = await createOrUpdateAsset(assetData);
    let updatedList: Asset[];
    if (editingAsset && editingAsset.id) {
      updatedList = assets.map((a) => (a.id === editingAsset.id ? { ...saved, id: editingAsset.id } : a));
    } else {
      updatedList = [saved, ...assets];
    }
    refreshPortfolio(updatedList, rates);
    setEditingAsset(null);
  };

  const handleDeleteAsset = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this asset holding?')) {
      await apiDeleteAsset(id);
      const remaining = assets.filter((a) => a.id !== id);
      refreshPortfolio(remaining, rates);
      if (selectedAssetForDetail?.id === id) {
        setIsDetailDrawerOpen(false);
        setSelectedAssetForDetail(null);
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

  // Rates Handlers
  const handleUpdateRates = async (newRates: { gold: number; silver: number }) => {
    const updated = await updateManualRates(newRates);
    setRates(updated);
    refreshPortfolio(assets, updated);
  };

  const handleSyncRates = async () => {
    setIsSyncingRates(true);
    try {
      const updated = await syncLiveMarketRates();
      setRates(updated);
      refreshPortfolio(assets, updated);
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setIsSyncingRates(false);
    }
  };

  const handleImportSuccess = (importedAssets: Asset[]) => {
    const combined = [...importedAssets, ...assets];
    refreshPortfolio(combined, rates);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Sticky Navigation */}
      <Navbar
        rates={rates}
        onOpenAddModal={handleOpenAddModal}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onSyncRates={handleSyncRates}
        isSyncingRates={isSyncingRates}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
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
            />

            {/* 2. Asset Allocation Horizontal Category Carousel */}
            <AllocationPills
              selectedType={selectedType}
              onSelectType={setSelectedType}
              allocations={summary.allocations}
              totalAssetsCount={assets.length}
              totalCurrentValue={summary.totalCurrentValue}
            />

            {/* 3. Assets List & Grid */}
            <AssetList
              assets={assets}
              selectedType={selectedType}
              onSelectAsset={handleSelectAsset}
              onEditAsset={handleEditAsset}
              onDeleteAsset={handleDeleteAsset}
              onOpenAddModal={handleOpenAddModal}
            />
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        <p>Asset Tracker • v4.0.1 • Built with React, Tailwind CSS &amp; Spring Boot</p>
      </footer>

    </div>
  );
};
export default App;
