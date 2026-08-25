import React from 'react';
import { 
  Building2, 
  Clock, 
  AlertCircle, 
  TrendingDown, 
  ArrowUpRight, 
  Edit3, 
  Trash2, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Liability } from '../types/portfolio';
import { formatINR, formatNumber } from '../utils/calculations';

interface LiabilityCardProps {
  liability: Liability;
  onSelect: (liability: Liability) => void;
  onEdit: (liability: Liability) => void;
  onDelete: (id: number | string) => void;
}

export const LiabilityCard: React.FC<LiabilityCardProps> = ({
  liability,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const metrics = liability.metrics;
  if (!metrics) return null;

  const isCompleted = metrics.emisRemaining === 0;
  const isDueSoon = metrics.daysUntilNextEmi <= 7 && !isCompleted;

  const loanTypeLabels: Record<string, string> = {
    PERSONAL: 'Personal Loan',
    HOME: 'Home Loan',
    GOLD: 'Gold Loan',
    VEHICLE: 'Vehicle Loan',
    EDUCATION: 'Education Loan',
    BUSINESS: 'Business Loan',
    OTHER: 'Loan / Debt',
  };

  return (
    <div className="relative group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col justify-between overflow-hidden">
      
      {/* Background ambient accent */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/5 group-hover:bg-rose-500/10 rounded-full blur-2xl transition-all pointer-events-none" />

      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base group-hover:text-white transition-colors">
                  {liability.name}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {loanTypeLabels[liability.loanType] || liability.loanType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {liability.lender} {liability.accountNumber ? `• A/C ${liability.accountNumber}` : ''}
              </p>
            </div>
          </div>

          {/* Interest Rate Badge */}
          <div className="text-right">
            <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{formatNumber(liability.annualInterestRate, 2)}% p.a.</span>
            </div>
          </div>
        </div>

        {/* Outstanding Balance & Original Amount */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 mb-4">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-slate-400 font-medium">Outstanding Principal</span>
            <span className="text-xs text-slate-500">Original: {formatINR(liability.principalAmount)}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
            <span>{formatINR(metrics.principalOutstanding)}</span>
            {isCompleted && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fully Repaid
              </span>
            )}
          </div>

          {/* Repayment Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
              <span>{formatINR(metrics.principalPaid)} ({metrics.progressPct.toFixed(1)}%) Paid</span>
              <span>{metrics.emisRemaining} of {liability.tenureMonths} EMIs Left</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner flex">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, metrics.progressPct))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          {/* Monthly EMI */}
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-slate-400 text-[11px] block mb-0.5">Monthly EMI</span>
            <span className="font-bold text-slate-200 text-sm">
              {formatINR(metrics.monthlyEmi)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Due on {liability.dueDayOfMonth}th of month
            </span>
          </div>

          {/* Interest Drag Paid So Far */}
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-slate-400 text-[11px] block mb-0.5">Interest Paid (Cost)</span>
            <span className="font-bold text-rose-400 text-sm">
              {formatINR(metrics.interestPaidSoFar)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              of {formatINR(metrics.totalInterestPayable)} total
            </span>
          </div>
        </div>

        {/* Next Payment Pill */}
        {!isCompleted && (
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs mb-4 ${
            isDueSoon 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
              : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              {isDueSoon ? (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <div>
                <span className="font-semibold block">
                  Next EMI: {formatINR(metrics.monthlyEmi)}
                </span>
                <span className="text-[11px] opacity-80">
                  Due on {metrics.nextEmiDate}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700">
              in {metrics.daysUntilNextEmi} {metrics.daysUntilNextEmi === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => onSelect(liability)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Amortization &amp; Sim</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(liability);
            }}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Edit Loan"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (liability.id) onDelete(liability.id);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Delete Loan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
