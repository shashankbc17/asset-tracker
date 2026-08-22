/**
 * Top Bar View: Live rates controls and CSV Actions.
 */
import { store } from '../state/store.js';
import { RatesService } from '../services/ratesService.js';
import { CsvService } from '../services/csvService.js';
import { toast } from './toast.js';

export function initTopBar() {
  const goldInput = document.getElementById('global-gold');
  const silverInput = document.getElementById('global-silver');
  const syncBtn = document.getElementById('sync-btn');
  const syncStatus = document.getElementById('sync-status');
  const templateBtn = document.getElementById('btn-template');
  const exportBtn = document.getElementById('btn-export');
  const importBtn = document.getElementById('btn-import');
  const fileInput = document.getElementById('csv-file-input');

  // Sync state with inputs
  function updateInputs() {
    const rates = store.getRates();
    if (document.activeElement !== goldInput) {
      goldInput.value = rates.gold;
    }
    if (document.activeElement !== silverInput) {
      silverInput.value = rates.silver;
    }
    if (rates.lastUpdated && syncStatus) {
      syncStatus.innerText = `Updated ${rates.lastUpdated}`;
    }
  }

  goldInput.addEventListener('input', (e) => {
    const gold = parseFloat(e.target.value) || 0;
    store.setRates({ gold });
  });

  silverInput.addEventListener('input', (e) => {
    const silver = parseFloat(e.target.value) || 0;
    store.setRates({ silver });
  });

  // Fetch Live Rates
  syncBtn.addEventListener('click', async () => {
    const originalText = syncBtn.innerHTML;
    syncBtn.innerHTML = '🔄 Syncing...';
    syncBtn.disabled = true;

    try {
      const live = await RatesService.fetchLiveRates();
      store.setRates({
        gold: live.gold ?? store.getRates().gold,
        silver: live.silver ?? store.getRates().silver,
        lastUpdated: live.timestamp
      });
      syncBtn.innerHTML = '✅ Synced';
      toast.success(`Live rates updated successfully! (Gold: ₹${live.gold}/g, Silver: ₹${live.silver}/g)`);
    } catch (err) {
      syncBtn.innerHTML = '❌ Failed';
      toast.error('Could not fetch live rates from API. Check connection or enter manually.');
    } finally {
      setTimeout(() => {
        syncBtn.innerHTML = originalText;
        syncBtn.disabled = false;
      }, 2500);
    }
  });

  // CSV Actions
  templateBtn.addEventListener('click', () => {
    CsvService.downloadTemplate();
    toast.info('Downloaded CSV template.');
  });

  exportBtn.addEventListener('click', () => {
    const portfolio = store.getPortfolio();
    if (portfolio.length === 0) {
      toast.warning('Portfolio is empty. Nothing to export.');
      return;
    }
    CsvService.exportPortfolio(portfolio);
    toast.success(`Exported ${portfolio.length} portfolio records to CSV.`);
  });

  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { added, skippedCount } = await CsvService.parseAndValidateCSV(file);
      if (added.length > 0) {
        store.bulkAppend(added);
        toast.success(`Successfully appended ${added.length} records from CSV!${skippedCount > 0 ? ` (${skippedCount} skipped/invalid)` : ''}`);
      } else {
        toast.warning(`No valid records found in CSV file.${skippedCount > 0 ? ` (${skippedCount} invalid rows)` : ''}`);
      }
    } catch (err) {
      toast.error(`CSV Import failed: ${err.message}`);
    } finally {
      fileInput.value = '';
    }
  });

  store.subscribe(updateInputs);
  updateInputs();
}
