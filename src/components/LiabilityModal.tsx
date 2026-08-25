import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Building2, 
  Calculator, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Key, 
  AlertCircle, 
  ChevronDown 
} from 'lucide-react';
import { Liability, LoanType, Asset } from '../types/portfolio';
import { formatINR } from '../utils/calculations';
import { scanLoanDocument, getStoredGeminiKey, setStoredGeminiKey } from '../services/loanScannerService';

interface LiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (liability: Liability) => void;
  editingLiability?: Liability | null;
  assets?: Asset[];
}

export const LiabilityModal: React.FC<LiabilityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLiability,
  assets = [],
}) => {
  const [name, setName] = useState('');
  const [lender, setLender] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('PERSONAL');
  const [principalAmount, setPrincipalAmount] = useState<number | ''>(1522702);
  const [annualInterestRate, setAnnualInterestRate] = useState<number | ''>(9.99);
  const [tenureMonths, setTenureMonths] = useState<number | ''>(36);
  const [monthlyEmi, setMonthlyEmi] = useState<number | ''>(49126);
  const [sanctionDate, setSanctionDate] = useState('2025-10-16');
  const [firstEmiDate, setFirstEmiDate] = useState('2025-11-07');
  const [dueDayOfMonth, setDueDayOfMonth] = useState<number>(7);
  const [processingFee, setProcessingFee] = useState<number | ''>(8170);
  const [linkedAssetId, setLinkedAssetId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // Auto-calculated EMI estimate
  const [calcEmi, setCalcEmi] = useState<number>(0);

  // Scanner & AI Key states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Custom Gemini API Key Management
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = getStoredGeminiKey();
    setSavedKey(key);
    setCustomKeyInput(key);
  }, [isOpen]);

  useEffect(() => {
    if (editingLiability) {
      setName(editingLiability.name);
      setLender(editingLiability.lender);
      setAccountNumber(editingLiability.accountNumber || '');
      setLoanType(editingLiability.loanType);
      setPrincipalAmount(editingLiability.principalAmount);
      setAnnualInterestRate(editingLiability.annualInterestRate);
      setTenureMonths(editingLiability.tenureMonths);
      setMonthlyEmi(editingLiability.monthlyEmi || '');
      setSanctionDate(editingLiability.sanctionDate || new Date().toISOString().split('T')[0]);
      setFirstEmiDate(editingLiability.firstEmiDate || new Date().toISOString().split('T')[0]);
      setDueDayOfMonth(editingLiability.dueDayOfMonth || 7);
      setProcessingFee(editingLiability.processingFee || '');
      setLinkedAssetId(editingLiability.linkedAssetId);
      setNotes(editingLiability.notes || '');
      setScanSuccessMessage(null);
      setScanError(null);
    } else {
      setName('HDFC Personal Loan');
      setLender('HDFC Bank');
      setAccountNumber('');
      setLoanType('PERSONAL');
      setPrincipalAmount(1522702);
      setAnnualInterestRate(9.99);
      setTenureMonths(36);
      setMonthlyEmi(49126);
      setSanctionDate('2025-10-16');
      setFirstEmiDate('2025-11-07');
      setDueDayOfMonth(7);
      setProcessingFee(8170);
      setLinkedAssetId(undefined);
      setNotes('');
      setScanSuccessMessage(null);
      setScanError(null);
    }
  }, [editingLiability, isOpen]);

  // Dynamically compute estimated standard reducing balance EMI
  useEffect(() => {
    const p = Number(principalAmount) || 0;
    const rAnnual = Number(annualInterestRate) || 0;
    const n = Number(tenureMonths) || 1;

    if (p > 0 && n > 0) {
      if (rAnnual > 0) {
        const rMonthly = (rAnnual / 12) / 100;
        const emi = Math.round((p * rMonthly * Math.pow(1 + rMonthly, n)) / (Math.pow(1 + rMonthly, n) - 1));
        setCalcEmi(emi);
      } else {
        setCalcEmi(Math.round(p / n));
      }
    } else {
      setCalcEmi(0);
    }
  }, [principalAmount, annualInterestRate, tenureMonths]);

  // Handle Document Upload & Auto-Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);
    setScanSuccessMessage(null);
    setScanStatusText('Analyzing document structure...');

    try {
      const result = await scanLoanDocument(file, (msg) => setScanStatusText(msg));
      const extracted = result.data;

      if (extracted.name) setName(extracted.name);
      if (extracted.lender) setLender(extracted.lender);
      if (extracted.accountNumber) setAccountNumber(extracted.accountNumber);
      if (extracted.loanType) setLoanType(extracted.loanType);
      if (extracted.principalAmount) setPrincipalAmount(extracted.principalAmount);
      if (extracted.annualInterestRate) setAnnualInterestRate(extracted.annualInterestRate);
      if (extracted.tenureMonths) setTenureMonths(extracted.tenureMonths);
      if (extracted.monthlyEmi) setMonthlyEmi(extracted.monthlyEmi);
      if (extracted.sanctionDate) setSanctionDate(extracted.sanctionDate);
      if (extracted.firstEmiDate) setFirstEmiDate(extracted.firstEmiDate);
      if (extracted.dueDayOfMonth) setDueDayOfMonth(extracted.dueDayOfMonth);
      if (extracted.processingFee) setProcessingFee(extracted.processingFee);
      if (extracted.notes) setNotes(extracted.notes);

      setScanSuccessMessage(
        result.method === 'GEMINI_AI'
          ? `✨ Gemini AI extracted ${extracted.lender || 'Loan'} details with 100% precision!`
          : `📄 Local RBI text parser auto-extracted ${extracted.lender || 'Loan'} (0 tokens used)`
      );
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan document.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveCustomKey = () => {
    setStoredGeminiKey(customKeyInput);
    setSavedKey(customKeyInput.trim());
    setShowKeyConfig(false);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !principalAmount) {
      alert('Please fill in loan name and principal amount.');
      return;
    }

    const payload: Liability = {
      ...(editingLiability?.id ? { id: editingLiability.id } : {}),
      name,
      lender,
      accountNumber: accountNumber.trim() || undefined,
      loanType,
      principalAmount: Number(principalAmount),
      annualInterestRate: Number(annualInterestRate) || 0,
      tenureMonths: Number(tenureMonths) || 36,
      monthlyEmi: monthlyEmi !== '' ? Number(monthlyEmi) : calcEmi,
      sanctionDate,
      firstEmiDate,
      dueDayOfMonth: Number(dueDayOfMonth) || 7,
      processingFee: processingFee !== '' ? Number(processingFee) : undefined,
      linkedAssetId: linkedAssetId ? Number(linkedAssetId) : undefined,
      notes: notes.trim() || undefined,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingLiability ? 'Edit Loan & Liability' : 'Add New Loan / Liability'}
              </h2>
              <p className="text-xs text-slate-400">
                Track principal reduction, interest costs, and EMI schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* AI / Document Drag & Drop Scanner Banner */}
          {!editingLiability && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Instant Sanction Letter / KFS Auto-Scanner</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        AI &amp; PDF
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Upload bank PDF (HDFC, SBI, ICICI) or phone photo to auto-fill every field.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Scanning...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Document</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scanning status banner */}
              {isScanning && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-amber-300 font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>{scanStatusText}</span>
                </div>
              )}

              {/* Success message */}
              {scanSuccessMessage && (
                <div className="mt-3 pt-3 border-t border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{scanSuccessMessage}</span>
                </div>
              )}

              {/* Error message */}
              {scanError && (
                <div className="mt-3 pt-3 border-t border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Collapsible Key Config */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowKeyConfig(!showKeyConfig)}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Key className="w-3 h-3 text-amber-400" />
                  <span>
                    {savedKey ? 'Dedicated Gemini Key Configured' : 'Configure Custom Gemini Key (Optional)'}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showKeyConfig ? 'rotate-180' : ''}`} />
                </button>
                <span className="text-[10px] text-slate-500">
                  {savedKey ? '🟢 Gemini AI Ready' : '⚪ Free Local Engine Active'}
                </span>
              </div>

              {/* Dedicated Gemini Key input dropdown */}
              {showKeyConfig && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Paste a free Google AI Studio key to isolate app tokens to a dedicated account:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={customKeyInput}
                      onChange={(e) => setCustomKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomKey}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Row 1: Name & Lender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Loan Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HDFC Personal Loan"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lender / Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Row 2: Loan Type & Account No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Loan Category
                </label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value as LoanType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="PERSONAL">Personal Loan</option>
                  <option value="HOME">Home / Housing Loan</option>
                  <option value="GOLD">Gold Loan</option>
                  <option value="VEHICLE">Car / Vehicle Loan</option>
                  <option value="EDUCATION">Education Loan</option>
                  <option value="BUSINESS">Business / Line of Credit</option>
                  <option value="OTHER">Other Debt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Loan Account / Agreement No.
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 165941165"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Row 3: Principal, Rate, Tenure */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Principal Borrowed (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 1522702"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Interest Rate (% p.a.) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 9.99"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tenure (Months) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="360"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 36"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            {/* Row 4: Monthly EMI with Auto-calculation hint */}
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-rose-400" />
                  <span>Monthly EMI (₹)</span>
                </label>
                <span className="text-xs text-slate-400">
                  Formula Calculated: <strong className="text-emerald-400">{formatINR(calcEmi)}</strong>
                </span>
              </div>
              <input
                type="number"
                min="1"
                value={monthlyEmi}
                onChange={(e) => setMonthlyEmi(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={`Default: ${calcEmi}`}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Leave blank to auto-use standard reducing rate EMI ({formatINR(calcEmi)}/mo).
              </p>
            </div>

            {/* Row 5: Sanction Date, First EMI Date, Due Day */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sanction / Disbursal Date
                </label>
                <input
                  type="date"
                  value={sanctionDate}
                  onChange={(e) => setSanctionDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  First EMI Date *
                </label>
                <input
                  type="date"
                  required
                  value={firstEmiDate}
                  onChange={(e) => setFirstEmiDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Monthly Due Day
                </label>
                <select
                  value={dueDayOfMonth}
                  onChange={(e) => setDueDayOfMonth(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of month
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 6: Linked Asset & Processing Fees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Link to Asset (Optional)
                </label>
                <select
                  value={linkedAssetId || ''}
                  onChange={(e) => setLinkedAssetId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">None (Standalone Personal Debt)</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({formatINR(asset.metrics?.currentValue || asset.investedAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Processing &amp; Statutory Fees (₹)
                </label>
                <input
                  type="number"
                  value={processingFee}
                  onChange={(e) => setProcessingFee(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 8170"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            {/* Row 7: Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notes &amp; Loan Details
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Auto-debit via NACH from Salary Account on 7th"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
              >
                {editingLiability ? 'Update Loan' : 'Save Loan'}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};

