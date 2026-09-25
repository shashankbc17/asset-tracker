import React from 'react';
import { Wallet, Building2, Plus, PieChart, RefreshCw } from 'lucide-react';

interface MobileTabBarProps {
  mainView: 'ASSETS' | 'LIABILITIES';
  onChangeView: (view: 'ASSETS' | 'LIABILITIES') => void;
  onOpenAddAsset: () => void;
  onOpenAddLoan: () => void;
  onOpenAnalytics: () => void;
  onSyncRates: () => void;
  isSyncingRates: boolean;
  activeLoansCount?: number;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  mainView,
  onChangeView,
  onOpenAddAsset,
  onOpenAddLoan,
  onOpenAnalytics,
  onSyncRates,
  isSyncingRates,
  activeLoansCount = 0,
}) => {
  const isAssetsActive = mainView === 'ASSETS';
  const isLoansActive = mainView === 'LIABILITIES';

  const handleCenterAction = () => {
    if (mainView === 'LIABILITIES') {
      onOpenAddLoan();
    } else {
      onOpenAddAsset();
    }
  };

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="max-w-md mx-auto px-4 pt-1.5 flex items-center justify-around">
        
        {/* 1. Assets Tab */}
        <button
          type="button"
          onClick={() => onChangeView('ASSETS')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all active:scale-95 ${
            isAssetsActive 
              ? 'text-amber-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${isAssetsActive ? 'bg-amber-500/20' : 'bg-transparent'}`}>
            <Wallet className={`w-5 h-5 ${isAssetsActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          </div>
          <span className="text-[10px] tracking-tight">Assets</span>
        </button>

        {/* 2. Liabilities / Loans Tab */}
        <button
          type="button"
          onClick={() => onChangeView('LIABILITIES')}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all active:scale-95 ${
            isLoansActive 
              ? 'text-rose-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${isLoansActive ? 'bg-rose-500/20' : 'bg-transparent'}`}>
            <Building2 className={`w-5 h-5 ${isLoansActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          </div>
          <span className="text-[10px] tracking-tight">Loans</span>
          {activeLoansCount > 0 && (
            <span className="absolute top-0.5 right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-rose-500 text-white leading-none">
              {activeLoansCount}
            </span>
          )}
        </button>

        {/* 3. Central Elevated Primary Action (+) Button */}
        <button
          type="button"
          onClick={handleCenterAction}
          className="relative -top-2 flex flex-col items-center justify-center active:scale-90 transition-transform"
          title={isLoansActive ? 'Add New Loan' : 'Add New Asset'}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-slate-900">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-[9px] font-bold text-amber-300 mt-0.5">
            {isLoansActive ? '+ Loan' : '+ Asset'}
          </span>
        </button>

        {/* 4. Analytics Tab */}
        <button
          type="button"
          onClick={onOpenAnalytics}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all active:scale-95 text-slate-400 hover:text-emerald-400 font-medium"
        >
          <div className="p-1 rounded-xl bg-transparent">
            <PieChart className="w-5 h-5 stroke-[1.8] text-emerald-400" />
          </div>
          <span className="text-[10px] tracking-tight">Analytics</span>
        </button>

        {/* 5. Live Rates Sync Tab */}
        <button
          type="button"
          onClick={onSyncRates}
          disabled={isSyncingRates}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all active:scale-95 text-slate-400 hover:text-amber-300 font-medium disabled:opacity-60"
        >
          <div className="p-1 rounded-xl bg-transparent">
            <RefreshCw className={`w-5 h-5 stroke-[1.8] text-amber-400 ${isSyncingRates ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-[10px] tracking-tight">Sync</span>
        </button>

      </div>
    </nav>
  );
};
