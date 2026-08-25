import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Plus, 
  PieChart, 
  Download, 
  Wallet, 
  ArrowUpRight, 
  LogOut, 
  ChevronDown, 
  Cloud, 
  SlidersHorizontal 
} from 'lucide-react';
import { MetalRates } from '../types/portfolio';
import { formatNumber } from '../utils/calculations';
import { UserProfile } from '../services/auth';

interface NavbarProps {
  rates: MetalRates;
  onOpenAddModal: () => void;
  onOpenAddLoan?: () => void;
  onOpenRatesModal: () => void;
  onOpenAnalytics: () => void;
  onOpenCsvModal: () => void;
  onSyncRates: () => void;
  isSyncingRates: boolean;
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
}

// Smart short name generator from DisplayName or Gmail
function getShortName(displayName?: string, email?: string): string {
  if (displayName && displayName.trim()) {
    const first = displayName.trim().split(' ')[0];
    return first.length > 10 ? `${first.slice(0, 9)}…` : first;
  }
  if (email && email.trim()) {
    const userPart = email.split('@')[0];
    const cleaned = userPart.replace(/[0-9]+$/, '');
    const cap = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cap.length > 10 ? `${cap.slice(0, 9)}…` : cap;
  }
  return 'User';
}

export const Navbar: React.FC<NavbarProps> = ({
  rates,
  onOpenAddModal,
  onOpenAddLoan,
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
  const shortName = getShortName(user?.displayName, user?.email);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md select-none sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          
          {/* 1. Left: Brand & Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-sm sm:text-lg tracking-tight text-white leading-tight">
                  Asset Tracker
                </h1>
                <span className="hidden xs:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md">
                  v4.0.1
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
                Precious Metals &amp; Net Worth Portfolio
              </p>
            </div>
          </div>

          {/* 2. Middle: Live Rates Ticker (Desktop / Tablet Large only) */}
          <div 
            onClick={onOpenRatesModal}
            className="hidden xl:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 transition-all cursor-pointer group text-xs whitespace-nowrap shrink-0"
            title="Click to edit or sync spot market rates"
          >
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>BLR Rates:</span>
            </div>
            <div className="flex items-center gap-2.5 font-mono text-slate-300 whitespace-nowrap">
              <span className="inline-flex items-center gap-1">24K: <strong className="text-amber-300 font-bold">₹{formatNumber(rates.gold24k || rates.gold, 0)}/g</strong></span>
              <span className="text-slate-600 font-sans">•</span>
              <span className="inline-flex items-center gap-1">22K: <strong className="text-amber-200 font-bold">₹{formatNumber(rates.gold22k || rates.gold * 0.916, 0)}/g</strong></span>
              <span className="text-slate-600 font-sans">•</span>
              <span className="inline-flex items-center gap-1">Ag: <strong className="text-slate-200 font-bold">₹{formatNumber(rates.silver, 0)}/g</strong></span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
          </div>

          {/* 3. Right: Action Buttons & Profile Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Desktop Action Buttons (Hidden on mobile to ensure zero overflow) */}
            <button
              onClick={onSyncRates}
              disabled={isSyncingRates}
              className="hidden md:flex p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all items-center gap-1.5"
              title="Sync Live Rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRates ? 'animate-spin text-amber-400' : ''}`} />
              <span>Sync</span>
            </button>

            <button
              onClick={onOpenAnalytics}
              className="hidden md:flex p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all items-center gap-1.5"
              title="Portfolio Analytics"
            >
              <PieChart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Analytics</span>
            </button>

            <button
              onClick={onOpenCsvModal}
              className="hidden md:flex p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all items-center gap-1.5"
              title="CSV Backup &amp; Restore"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Backup</span>
            </button>

            {/* Profile Badge Pill or Google Sign In Button */}
            {user ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/40 transition-all text-xs shrink-0 active:scale-95 shadow-sm"
                  title="Your Profile & Quick Actions"
                >
                  <div className="relative shrink-0">
                    <img
                      src={user.photoURL}
                      alt={shortName}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-amber-400/60"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-1 ring-slate-900 animate-pulse" />
                  </div>
                  
                  {/* Shortname Label */}
                  <span className="font-semibold text-slate-100 text-xs truncate max-w-[70px] sm:max-w-[100px]">
                    {shortName}
                  </span>
                  
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Quick Action Dropdown */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <>
                      <div
                        onClick={() => setIsUserMenuOpen(false)}
                        className="fixed inset-0 z-40 bg-black/20"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 py-2 text-xs overflow-hidden"
                      >
                        {/* User Card Header */}
                        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40">
                          <div className="flex items-center gap-2.5 mb-1">
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-8 h-8 rounded-full border border-amber-400/80"
                            />
                            <div className="truncate">
                              <div className="font-bold text-slate-100 text-sm truncate">{user.displayName || shortName}</div>
                              <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mt-1">
                            <Cloud className="w-3 h-3" />
                            <span>Cloud Firestore Sync Active</span>
                          </div>
                        </div>

                        {/* Mobile & Quick Action Items */}
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenAddModal();
                            }}
                            className="w-full text-left px-4 py-2.5 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors font-bold border-b border-slate-800/80"
                          >
                            <Plus className="w-4 h-4 text-amber-400 stroke-[3] shrink-0" />
                            <span>Add Asset / Holding</span>
                          </button>

                          {onOpenAddLoan && (
                            <button
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onOpenAddLoan();
                              }}
                              className="w-full text-left px-4 py-2.5 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors font-bold border-b border-slate-800/80"
                            >
                              <Plus className="w-4 h-4 text-rose-400 stroke-[3] shrink-0" />
                              <span>Add Loan / Liability</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenAnalytics();
                            }}
                            className="w-full text-left px-4 py-2 text-slate-200 hover:text-white hover:bg-slate-800/70 flex items-center gap-2.5 transition-colors font-medium"
                          >
                            <PieChart className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Portfolio Analytics &amp; KPIs</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenCsvModal();
                            }}
                            className="w-full text-left px-4 py-2 text-slate-200 hover:text-white hover:bg-slate-800/70 flex items-center gap-2.5 transition-colors font-medium"
                          >
                            <Download className="w-4 h-4 text-sky-400 shrink-0" />
                            <span>Backup &amp; Restore (CSV)</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenRatesModal();
                            }}
                            className="w-full text-left px-4 py-2 text-slate-200 hover:text-white hover:bg-slate-800/70 flex items-center gap-2.5 transition-colors font-medium"
                          >
                            <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Manage Bullion Rates</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onSyncRates();
                            }}
                            disabled={isSyncingRates}
                            className="w-full text-left px-4 py-2 text-slate-200 hover:text-white hover:bg-slate-800/70 flex items-center gap-2.5 transition-colors font-medium"
                          >
                            <RefreshCw className={`w-4 h-4 text-yellow-400 shrink-0 ${isSyncingRates ? 'animate-spin' : ''}`} />
                            <span>Sync Live Market Prices</span>
                          </button>
                        </div>

                        {/* Sign Out Button */}
                        <div className="pt-1 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full text-left px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 font-medium transition-colors"
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all shrink-0 active:scale-95 shadow-sm h-9 sm:h-10"
                title="Sign in with Google to sync across devices"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
                </svg>
                <span className="hidden xs:inline">Sign In</span>
              </button>
            )}

            {/* Add Loan button (Desktop only, matched size) */}
            {onOpenAddLoan && (
              <button
                onClick={onOpenAddLoan}
                className="hidden sm:flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-slate-800 hover:bg-slate-700/90 text-rose-300 border border-rose-500/30 active:scale-95 transition-all shrink-0 h-9 sm:h-10"
                title="Add Loan / Liability"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 stroke-[2.5]" />
                <span>Add Loan</span>
              </button>
            )}

            {/* Main Add Asset CTA Button (Desktop only, matched size) */}
            <button
              onClick={onOpenAddModal}
              className="hidden sm:flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0 h-9 sm:h-10"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              <span>Add Asset</span>
            </button>

          </div>

        </div>

        {/* Mobile Live Rates Bar */}
        <div className="lg:hidden flex items-center justify-between py-1.5 px-1 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div 
            onClick={onOpenRatesModal}
            className="flex items-center gap-1.5 text-amber-400 font-medium cursor-pointer active:opacity-75"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>BLR Rates:</span>
          </div>

          <div 
            onClick={onOpenRatesModal}
            className="flex items-center gap-2 font-mono cursor-pointer active:opacity-75"
          >
            <span>24K: <strong className="text-amber-300">₹{formatNumber(rates.gold24k || rates.gold, 0)}</strong></span>
            <span>22K: <strong className="text-amber-200">₹{formatNumber(rates.gold22k || rates.gold * 0.916, 0)}</strong></span>
            <span>Ag: <strong className="text-slate-200">₹{formatNumber(rates.silver, 0)}</strong></span>
          </div>

          {/* Quick Refresh Icon for Mobile */}
          <button
            onClick={onSyncRates}
            disabled={isSyncingRates}
            className="p-1 text-slate-400 hover:text-amber-400 active:scale-90 transition-all ml-1"
            title="Sync Live Rates"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingRates ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
};
