import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { Asset } from '../types/portfolio';

interface CsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onImportSuccess: (imported: Asset[]) => void;
}

export const CsvModal: React.FC<CsvModalProps> = ({
  isOpen,
  onClose,
  assets,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    // Generate standard CSV
    const headers = [
      'Name',
      'AssetType',
      'PurchaseDate',
      'InvestedAmount',
      'CurrentValue',
      'MetalType',
      'CategoryType',
      'Grams',
      'RateBought',
      'Deduction',
      'Ticker',
      'Quantity',
      'BuyPrice',
      'CurrentPrice',
      'Location',
      'AreaSqFt',
      'EstimatedMarketValue',
      'MonthlyRentalIncome',
      'BankName',
      'InterestRatePct',
      'MaturityDate',
      'PfSchemeType',
      'MonthlyContribution',
      'PfInterestRate',
      'Notes'
    ];

    const rows = assets.map((a) => [
      `"${a.name.replace(/"/g, '""')}"`,
      a.assetType,
      a.purchaseDate,
      a.investedAmount,
      a.metrics?.currentValue || a.investedAmount,
      a.metalType || '',
      a.categoryType || '',
      a.grams || '',
      a.rateBought || '',
      a.deduction || '',
      a.ticker || '',
      a.quantity || '',
      a.buyPrice || '',
      a.currentPrice || '',
      `"${(a.location || '').replace(/"/g, '""')}"`,
      a.areaSqFt || '',
      a.estimatedMarketValue || '',
      a.monthlyRentalIncome || '',
      `"${(a.bankName || '').replace(/"/g, '""')}"`,
      a.interestRatePct || '',
      a.maturityDate || '',
      a.pfSchemeType || '',
      a.monthlyContribution || '',
      a.pfInterestRate || '',
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `portfolio_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('CSV file is empty or missing data rows.');
          return;
        }

        const newAssets: Asset[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 4) {
            newAssets.push({
              id: Date.now() + i,
              name: cols[0] || 'Imported Asset',
              assetType: (cols[1] as any) || 'PRECIOUS_METALS',
              purchaseDate: cols[2] || new Date().toISOString().split('T')[0],
              investedAmount: Number(cols[3]) || 0,
              metalType: (cols[5] as any) || undefined,
              categoryType: (cols[6] as any) || undefined,
              grams: cols[7] ? Number(cols[7]) : undefined,
              rateBought: cols[8] ? Number(cols[8]) : undefined,
              deduction: cols[9] ? Number(cols[9]) : undefined,
              ticker: cols[10] || undefined,
              quantity: cols[11] ? Number(cols[11]) : undefined,
              buyPrice: cols[12] ? Number(cols[12]) : undefined,
              currentPrice: cols[13] ? Number(cols[13]) : undefined,
              location: cols[14] || undefined,
              areaSqFt: cols[15] ? Number(cols[15]) : undefined,
              estimatedMarketValue: cols[16] ? Number(cols[16]) : undefined,
              monthlyRentalIncome: cols[17] ? Number(cols[17]) : undefined,
              bankName: cols[18] || undefined,
              interestRatePct: cols[19] ? Number(cols[19]) : undefined,
              maturityDate: cols[20] || undefined,
              pfSchemeType: cols[21] || undefined,
              monthlyContribution: cols[22] ? Number(cols[22]) : undefined,
              pfInterestRate: cols[23] ? Number(cols[23]) : undefined,
              notes: cols[24] || undefined,
            });
          }
        }

        if (newAssets.length > 0) {
          onImportSuccess(newAssets);
          alert(`Successfully imported ${newAssets.length} asset holdings!`);
          onClose();
        }
      } catch (err) {
        alert('Failed to parse CSV file. Please check format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                CSV Data Backup &amp; Import
              </h2>
              <p className="text-xs text-slate-400">
                Seamlessly export or restore your portfolio records
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Export Section */}
            <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-slate-200">Export Holdings to CSV</h3>
                <p className="text-xs text-slate-400">
                  Downloads all {assets.length} portfolio records with metrics.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Import Section */}
            <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-slate-200">Import / Restore CSV</h3>
                <p className="text-xs text-slate-400">
                  Upload previously exported portfolio backup CSV.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose File</span>
                </button>
              </div>
            </div>

          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
