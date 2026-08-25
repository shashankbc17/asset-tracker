import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Coins, 
  Layers
} from 'lucide-react';
import { Liability, Asset } from '../types/portfolio';
import { formatINR, formatNumber, simulatePrepayment } from '../utils/calculations';

interface LiabilityDetailModalProps {
  liability: Liability | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (liability: Liability) => void;
  assets?: Asset[];
}

export const LiabilityDetailModal: React.FC<LiabilityDetailModalProps> = ({
  liability,
  isOpen,
  onClose,
  onEdit,
  assets = [],
}) => {
  const [prepayInput, setPrepayInput] = useState<number | ''>(100000);
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'SIMULATOR'>('SCHEDULE');

  if (!isOpen || !liability) return null;

  const metrics = liability.metrics;
  if (!metrics) return null;

  const prepaymentResult = simulatePrepayment(liability, Number(prepayInput) || 0);
  const linkedAsset = assets.find((a) => a.id === liability.linkedAssetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {liability.name}
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {formatNumber(liability.annualInterestRate, 2)}% p.a.
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {liability.lender} • Agreement #{liability.accountNumber || '165941165'} • Disbursed {liability.sanctionDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(liability);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-colors border border-amber-500/20"
            >
              Edit Loan
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Top 4 Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium block mb-1">
                Outstanding Principal
              </span>
              <div className="text-xl font-black text-white">
                {formatINR(metrics.principalOutstanding)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Original: {formatINR(liability.principalAmount)}
              </span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium block mb-1">
                Monthly EMI
              </span>
              <div className="text-xl font-black text-sky-400">
                {formatINR(metrics.monthlyEmi)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Due on {liability.dueDayOfMonth}th of month
              </span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium block mb-1">
                Interest Paid (Cost Drag)
              </span>
              <div className="text-xl font-black text-rose-400">
                {formatINR(metrics.interestPaidSoFar)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                of {formatINR(metrics.totalInterestPayable)} total interest
              </span>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium block mb-1">
                Repayment Progress
              </span>
              <div className="text-xl font-black text-emerald-400">
                {metrics.progressPct.toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                {metrics.emisPaid} paid • {metrics.emisRemaining} remaining
              </span>
            </div>
          </div>

          {/* Linked Asset or Wealth Drag Alert */}
          {linkedAsset ? (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-200">
                    Linked Asset: {linkedAsset.name}
                  </h4>
                  <p className="text-[11px] text-indigo-300/80">
                    Market Value: {formatINR(linkedAsset.metrics?.currentValue || linkedAsset.investedAmount)} • Net Equity: {formatINR((linkedAsset.metrics?.currentValue || linkedAsset.investedAmount) - metrics.principalOutstanding)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {(((linkedAsset.metrics?.currentValue || linkedAsset.investedAmount) - metrics.principalOutstanding) / (linkedAsset.metrics?.currentValue || 1) * 100).toFixed(1)}% Owned
              </span>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Total Borrowing Drag on Net Worth
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Total Repayment: {formatINR(metrics.totalRepaymentAmount)} (Principal: {formatINR(liability.principalAmount)} + Total Interest: {formatINR(metrics.totalInterestPayable)})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-400 block">
                  -{formatINR(metrics.remainingInterestPayable)}
                </span>
                <span className="text-[10px] text-slate-500">
                  Future Interest Payable
                </span>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('SCHEDULE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'SCHEDULE'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Full Amortization Schedule ({metrics.amortizationSchedule.length} Months)</span>
            </button>

            <button
              onClick={() => setActiveTab('SIMULATOR')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'SIMULATOR'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Prepayment &amp; Interest Saving Simulator</span>
            </button>
          </div>

          {/* TAB 1: Amortization Schedule Table */}
          {activeTab === 'SCHEDULE' && (
            <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">EMI (₹)</th>
                      <th className="py-3 px-4 text-right">Principal (₹)</th>
                      <th className="py-3 px-4 text-right">Interest (₹)</th>
                      <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {metrics.amortizationSchedule.map((item) => (
                      <tr 
                        key={item.monthIndex}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          item.isPaid ? 'bg-slate-950/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono text-slate-500 font-bold">
                          {item.monthIndex}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-300">
                          {item.dueDate}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-200">
                          {formatNumber(item.emiAmount, 0)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-400">
                          {formatNumber(item.principal, 2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-rose-400">
                          {formatNumber(item.interest, 2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                          {formatNumber(item.outstandingPrincipal, 2)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {item.isPaid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                              <Clock className="w-3 h-3 text-sky-400" /> Upcoming
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Prepayment Simulator */}
          {activeTab === 'SIMULATOR' && (
            <div className="space-y-5 bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
              
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Interactive Prepayment &amp; Loan Acceleration Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  See how making a lump-sum prepayment directly slashes your remaining tenure and eliminates future bank interest.
                </p>
              </div>

              {/* Prepayment Input */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="w-full sm:w-72">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lump-Sum Prepayment Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min="1000"
                    max={metrics.principalOutstanding}
                    value={prepayInput}
                    onChange={(e) => setPrepayInput(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 100000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Quick Prepayment Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {[25000, 50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPrepayInput(amt)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      +{formatINR(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Results Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4">
                  <span className="text-xs text-emerald-400 font-semibold block mb-1">
                    Direct Interest Saved
                  </span>
                  <div className="text-2xl font-black text-emerald-300">
                    {formatINR(prepaymentResult.interestSaved)}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Retained directly in your pocket
                  </span>
                </div>

                <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/30 rounded-2xl p-4">
                  <span className="text-xs text-sky-400 font-semibold block mb-1">
                    Tenure Slashed
                  </span>
                  <div className="text-2xl font-black text-sky-300">
                    {prepaymentResult.monthsSaved} Months
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    New Tenure: {prepaymentResult.newTenureMonths} EMIs (was {metrics.emisRemaining})
                  </span>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4">
                  <span className="text-xs text-amber-400 font-semibold block mb-1">
                    New Remaining Interest
                  </span>
                  <div className="text-2xl font-black text-amber-300">
                    {formatINR(prepaymentResult.newRemainingInterest)}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Reduced from {formatINR(metrics.remainingInterestPayable)}
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
