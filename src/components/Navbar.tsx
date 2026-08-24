import React, { useState } from 'react';
import { RefreshCw, Plus, PieChart, Download, Wallet, ArrowUpRight, LogOut } from 'lucide-react';
import { MetalRates } from '../types/portfolio';
import { formatNumber } from '../utils/calculations';
import { UserProfile } from '../services/auth';

interface NavbarProps {
  rates: MetalRates;
  onOpenAddModal: () => void;
  onOpenRatesModal: () => void;
  onOpenAnalytics: () => void;
  onOpenCsvModal: () => void;
  onSyncRates: () => void;
  isSyncingRates: boolean;
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  rates,
  onOpenAddModal,
  onOpenRatesModal,
  onOpenAnalytics,
  onOpenCsvModal,
  onSyncRates,
  isSyncingRates,
  user,
  onLogin,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          
          {/* Logo & Real Project Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Asset Tracker
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md">
                  v4.0.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Precious Metals &amp; Net Worth Portfolio
              </p>
            </div>
          </div>

          {/* Live Rates Ticker (Middle on Desktop) */}
          <div 
            onClick={onOpenRatesModal}
            className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-amber-500/40 transition-all cursor-pointer group text-xs"
            title="Click to edit or sync spot market rates"
          >
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold">Bangalore:</span>
            </div>
            <div className="flex items-center gap-2.5 font-mono text-slate-300">
              <span>24K: <strong className="text-amber-300 font-semibold">₹{formatNumber(rates.gold24k || rates.gold, 0)}/g</strong></span>
              <span className="text-slate-600">•</span>
              <span>22K: <strong className="text-amber-200 font-semibold">₹{formatNumber(rates.gold22k || rates.gold * 0.916, 0)}/g</strong></span>
              <span className="text-slate-600">•</span>
              <span>Silver: <strong className="text-slate-200 font-semibold">₹{formatNumber(rates.silver, 0)}/g</strong></span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>

          {/* Action Buttons & Google Sign-In */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onSyncRates}
              disabled={isSyncingRates}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="Sync Live Rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSyncingRates ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden md:inline">Sync</span>
            </button>

            <button
              onClick={onOpenAnalytics}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="Portfolio Analytics"
            >
              <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden md:inline">Analytics</span>
            </button>

            <button
              onClick={onOpenCsvModal}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="CSV Backup &amp; Restore"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
              <span className="hidden md:inline">Backup</span>
            </button>

            {/* Google Login / User Profile Badge */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-xs"
                >
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-6 h-6 rounded-full border border-amber-400/50"
                  />
                  <span className="font-semibold text-slate-200 hidden md:inline truncate max-w-[100px]">
                    {user.displayName}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      onClick={() => setIsUserMenuOpen(false)}
                      className="fixed inset-0 z-20"
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl z-30 py-2 text-xs">
                      <div className="px-3.5 py-1.5 border-b border-slate-700/80">
                        <div className="font-bold text-white truncate">{user.displayName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                      </div>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3.5 py-2 text-rose-400 hover:bg-slate-700/80 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all"
                title="Sign in with Google to sync across devices"
              >
                {/* Google Logo SVG */}
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
                </svg>
                <span className="hidden sm:inline">Google Sign In</span>
              </button>
            )}

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Asset</span>
            </button>
          </div>

        </div>

        {/* Mobile / Tablet Live Rates Bar */}
        <div 
          onClick={onOpenRatesModal}
          className="lg:hidden flex items-center justify-between py-2 px-1 border-t border-slate-800/80 text-[11px] text-slate-400 active:bg-slate-800/40 cursor-pointer"
        >
          <div className="flex items-center gap-1 text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>BLR Rates:</span>
          </div>
          <div className="flex items-center gap-2.5 font-mono">
            <span>24K: <strong className="text-amber-300">₹{formatNumber(rates.gold24k || rates.gold, 0)}</strong></span>
            <span>22K: <strong className="text-amber-200">₹{formatNumber(rates.gold22k || rates.gold * 0.916, 0)}</strong></span>
            <span>Ag: <strong className="text-slate-200">₹{formatNumber(rates.silver, 0)}</strong></span>
          </div>
        </div>

      </div>
    </header>
  );
};
