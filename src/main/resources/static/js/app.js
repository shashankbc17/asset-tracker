/**
 * Personal Net Worth & Multi-Asset Tracker - Client Application
 */

const API_BASE = '/api';
let currentSummary = null;
let currentFilterType = 'ALL';
let currentSort = 'value-desc';
let editingId = null;

// Currency Formatter
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

// Toast notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Fetch complete Net Worth summary & items
async function loadPortfolio() {
  try {
    const res = await fetch(`${API_BASE}/assets/summary`);
    if (!res.ok) throw new Error('Failed to load assets');
    currentSummary = await res.json();
    updateUI();
  } catch (err) {
    console.error('Error fetching summary:', err);
    showToast('Connecting to Java backend server...', 'info');
  }
}

// Update Rates
async function updateMarketRates(gold, silver) {
  try {
    const res = await fetch(`${API_BASE}/portfolio/rates`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gold: parseFloat(gold), silver: parseFloat(silver) })
    });
    if (res.ok) {
      showToast('Market rates updated & portfolio recalculated!', 'success');
      loadPortfolio();
    }
  } catch (err) {
    showToast('Failed to update rates', 'error');
  }
}

// Save or Update Asset
async function saveAsset(data) {
  try {
    const isEdit = editingId !== null;
    const url = isEdit ? `${API_BASE}/assets/${editingId}` : `${API_BASE}/assets`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      showToast(isEdit ? 'Asset updated successfully!' : 'New asset saved to portfolio!', 'success');
      resetForm();
      loadPortfolio();
    } else {
      showToast('Error saving asset', 'error');
    }
  } catch (err) {
    showToast('Failed to save asset', 'error');
  }
}

// Delete Asset
async function deleteAsset(id) {
  if (!confirm('Are you sure you want to delete this asset from your portfolio?')) return;
  try {
    const res = await fetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Asset removed from database', 'info');
      loadPortfolio();
    }
  } catch (err) {
    showToast('Failed to delete asset', 'error');
  }
}

// Upload CSV
async function uploadCsvFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_BASE}/csv/import`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (res.ok) {
      let msg = `Bulk import complete: ${result.addedCount} items added.`;
      if (result.skippedCount > 0) msg += ` (${result.skippedCount} skipped)`;
      showToast(msg, result.addedCount > 0 ? 'success' : 'warning');
      loadPortfolio();
    } else {
      showToast(result.errors?.[0] || 'CSV import failed', 'error');
    }
  } catch (err) {
    showToast('Failed to upload CSV file', 'error');
  }
}

// Refresh UI Elements
function updateUI() {
  if (!currentSummary) return;

  // 1. Top Bar Rates & Status
  const goldInput = document.getElementById('global-gold');
  const silverInput = document.getElementById('global-silver');
  const statusEl = document.getElementById('sync-status');

  if (currentSummary.rates) {
    if (document.activeElement !== goldInput) goldInput.value = currentSummary.rates.goldRate;
    if (document.activeElement !== silverInput) silverInput.value = currentSummary.rates.silverRate;

    if (statusEl && currentSummary.rates.lastUpdated) {
      const date = new Date(currentSummary.rates.lastUpdated);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      statusEl.innerHTML = `🟢 Live Rates Synced (${timeStr})`;
    }
  }

  // 2. Metric Cards
  document.getElementById('total-net-worth').innerText = formatCurrency(currentSummary.totalNetWorth);
  document.getElementById('total-invested').innerText = formatCurrency(currentSummary.totalInvested);

  const profitEl = document.getElementById('real-profit');
  const roiEl = document.getElementById('roi-badge');
  const isProfitable = currentSummary.netProfitable;

  profitEl.className = `stat-value ${isProfitable ? 'text-success' : 'text-danger'}`;
  profitEl.innerText = `${isProfitable ? '+' : ''}${formatCurrency(currentSummary.totalProfitLoss)}`;

  const roiSign = currentSummary.overallReturnPct >= 0 ? '+' : '';
  roiEl.innerText = `${roiSign}${currentSummary.overallReturnPct.toFixed(2)}% Overall ROI`;

  const totalItems = currentSummary.items ? currentSummary.items.length : 0;
  document.getElementById('total-holdings-count').innerText = `${totalItems} Total Asset Holdings`;

  // 3. Asset Allocation Bar & Legend
  renderAllocation(currentSummary.allocations || []);

  // 4. Table Rows
  renderTable(currentSummary.items || []);
}

// Render Asset Allocation Visualizer
function renderAllocation(allocations) {
  const bar = document.getElementById('allocation-bar');
  const legend = document.getElementById('allocation-legend');
  bar.innerHTML = '';
  legend.innerHTML = '';

  const classMap = {
    'PRECIOUS_METALS': { css: 'alloc-metals', dot: '#d4af37' },
    'EQUITY': { css: 'alloc-equity', dot: '#10b981' },
    'REAL_ESTATE': { css: 'alloc-realestate', dot: '#3b82f6' },
    'CASH_SAVINGS': { css: 'alloc-cash', dot: '#a855f7' }
  };

  allocations.forEach(alloc => {
    if (alloc.currentValue <= 0 && alloc.percentageOfNetWorth <= 0) return;

    const styling = classMap[alloc.assetType] || { css: 'alloc-metals', dot: '#d4af37' };
    const pct = alloc.percentageOfNetWorth.toFixed(1);

    // Segment
    const seg = document.createElement('div');
    seg.className = `allocation-segment ${styling.css}`;
    seg.style.width = `${pct}%`;
    seg.title = `${alloc.name}: ${formatCurrency(alloc.currentValue)} (${pct}%)`;
    bar.appendChild(seg);

    // Legend item
    const item = document.createElement('div');
    item.className = 'allocation-legend-item';
    item.innerHTML = `
      <span class="legend-dot" style="background: ${styling.dot};"></span>
      <span>${alloc.icon} ${alloc.name}: <strong>${pct}%</strong> (${formatCurrency(alloc.currentValue)})</span>
    `;
    legend.appendChild(item);
  });
}

// Filter and Sort Table
function renderTable(items) {
  const tbody = document.getElementById('portfolio-list');
  tbody.innerHTML = '';

  let filtered = items.filter(item => {
    if (currentFilterType === 'ALL') return true;
    return item.asset.assetType === currentFilterType;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (currentSort === 'value-desc') {
      return b.metrics.currentValue - a.metrics.currentValue;
    } else if (currentSort === 'return-desc') {
      return b.metrics.returnPct - a.metrics.returnPct;
    } else if (currentSort === 'date-desc') {
      return new Date(b.asset.purchaseDate) - new Date(a.asset.purchaseDate);
    } else if (currentSort === 'date-asc') {
      return new Date(a.asset.purchaseDate) - new Date(b.asset.purchaseDate);
    }
    return 0;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-state-icon">💼</div>
          <p>No asset records found in this category. Add an asset using the form on the left.</p>
        </td>
      </tr>
    `;
    return;
  }

  const tagClassMap = {
    'PRECIOUS_METALS': 'tag-metals',
    'EQUITY': 'tag-equity',
    'REAL_ESTATE': 'tag-realestate',
    'CASH_SAVINGS': 'tag-cash'
  };

  filtered.forEach(({ asset, metrics }) => {
    const tr = document.createElement('tr');
    const tagClass = tagClassMap[asset.assetType] || 'tag-metals';
    const returnClass = metrics.profitable ? 'text-success' : 'text-danger';
    const returnSign = metrics.returnPct >= 0 ? '+' : '';

    tr.innerHTML = `
      <td>
        <div class="cell-asset">
          <div class="asset-thumb" title="${asset.name}">
            <img src="${metrics.imagePath}" alt="${asset.name}" />
          </div>
          <div class="cell-asset-info">
            <div class="cell-asset-title">
              <span class="tag ${tagClass}">${asset.assetType.replace('_', ' ')}</span>
              <span><strong>${asset.name}</strong></span>
            </div>
            <div class="cell-asset-date">📅 ${asset.purchaseDate} • <span style="color: var(--text-muted);">${metrics.categoryBadge}</span></div>
          </div>
        </div>
      </td>
      <td>
        <div><strong>${metrics.keyMetricDisplay || '—'}</strong></div>
      </td>
      <td>
        <div>${formatCurrency(metrics.investedAmount)}</div>
      </td>
      <td>
        <strong style="color: var(--gold-light); font-size: 0.95rem;">${formatCurrency(metrics.currentValue)}</strong>
      </td>
      <td style="text-align: center;">
        <div class="${returnClass}" style="font-weight: 700;">
          ${returnSign}${metrics.returnPct.toFixed(2)}%
        </div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">${metrics.cagrDisplay}</div>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm edit-btn" data-id="${asset.id}">✏️ Edit</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${asset.id}">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach row event listeners
  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editAsset(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteAsset(parseInt(btn.dataset.id)));
  });
}

// Toggle Dynamic Form Fieldsets based on selected Asset Class
function toggleFormFieldsets(assetType) {
  document.getElementById('fields-metals').style.display = assetType === 'PRECIOUS_METALS' ? 'block' : 'none';
  document.getElementById('fields-equity').style.display = assetType === 'EQUITY' ? 'block' : 'none';
  document.getElementById('fields-real-estate').style.display = assetType === 'REAL_ESTATE' ? 'block' : 'none';
  document.getElementById('fields-cash').style.display = assetType === 'CASH_SAVINGS' ? 'block' : 'none';
}

function editAsset(id) {
  const item = currentSummary?.items.find(i => i.asset.id === id);
  if (!item) return;

  editingId = id;
  const a = item.asset;

  document.getElementById('form-title').innerText = `✏️ Edit: ${a.name}`;
  document.getElementById('submit-btn').innerText = '💾 Update Asset';
  document.getElementById('cancel-btn').style.display = 'block';

  document.getElementById('asset-type-select').value = a.assetType;
  toggleFormFieldsets(a.assetType);

  document.getElementById('asset-name').value = a.name || '';
  document.getElementById('asset-date').value = a.purchaseDate || '';

  // Metals
  if (a.assetType === 'PRECIOUS_METALS') {
    document.getElementById('metal-type').value = a.metalType || 'GOLD';
    document.getElementById('item-category').value = a.categoryType || 'COIN_BAR';
    document.getElementById('item-grams').value = a.grams || '';
    document.getElementById('item-rate-bought').value = a.rateBought || '';
    document.getElementById('item-deduction').value = a.deduction || 0;
  }
  // Equity
  else if (a.assetType === 'EQUITY') {
    document.getElementById('equity-ticker').value = a.ticker || '';
    document.getElementById('equity-qty').value = a.quantity || '';
    document.getElementById('equity-buy-price').value = a.buyPrice || '';
    document.getElementById('equity-current-price').value = a.currentPrice || '';
  }
  // Real Estate
  else if (a.assetType === 'REAL_ESTATE') {
    document.getElementById('re-location').value = a.location || '';
    document.getElementById('re-area').value = a.areaSqFt || '';
    document.getElementById('re-purchase-price').value = a.investedAmount || '';
    document.getElementById('re-current-val').value = a.estimatedMarketValue || '';
    document.getElementById('re-rent').value = a.monthlyRentalIncome || '';
  }
  // Cash
  else if (a.assetType === 'CASH_SAVINGS') {
    document.getElementById('cash-bank').value = a.bankName || '';
    document.getElementById('cash-deposit').value = a.investedAmount || '';
    document.getElementById('cash-rate').value = a.interestRatePct || '';
    document.getElementById('cash-maturity').value = a.maturityDate || '';
  }

  // Smoothly scroll to the form and apply glowing highlight
  const formSection = document.querySelector('.form-section');
  if (formSection) {
    formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    formSection.classList.add('form-highlight');
    setTimeout(() => formSection.classList.remove('form-highlight'), 1600);
  }
  document.getElementById('asset-name').focus();
  showToast(`Editing "${a.name}" - update details in the form on the left.`, 'info');
}

function resetForm() {
  editingId = null;
  document.getElementById('form-title').innerText = 'Add Asset';
  document.getElementById('submit-btn').innerText = '✨ Save Asset to Portfolio';
  document.getElementById('cancel-btn').style.display = 'none';
  document.getElementById('asset-form').reset();
  document.getElementById('asset-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('asset-type-select').value = 'PRECIOUS_METALS';
  toggleFormFieldsets('PRECIOUS_METALS');
}

// Initial Event Bindings
document.addEventListener('DOMContentLoaded', () => {
  // Set default date
  document.getElementById('asset-date').value = new Date().toISOString().split('T')[0];

  // Asset type change toggle
  document.getElementById('asset-type-select').addEventListener('change', (e) => {
    toggleFormFieldsets(e.target.value);
  });

  // Rate inputs change handler
  const rateHandler = () => {
    const g = document.getElementById('global-gold').value;
    const s = document.getElementById('global-silver').value;
    if (g && s) updateMarketRates(g, s);
  };
  document.getElementById('global-gold').addEventListener('change', rateHandler);
  document.getElementById('global-silver').addEventListener('change', rateHandler);

  // Sync button - triggers live Bangalore rate sync
  document.getElementById('sync-btn').addEventListener('click', async () => {
    try {
      showToast('⚡ Syncing live Bangalore 22K Gold & Silver rates...', 'info');
      const res = await fetch(`${API_BASE}/portfolio/rates/sync`, { method: 'POST' });
      if (res.ok) {
        const rates = await res.json();
        showToast(`✅ Synced Bangalore Spot: 22K Gold ₹${rates.goldRate}/g, Silver ₹${rates.silverRate}/g`, 'success');
        loadPortfolio();
      }
    } catch (err) {
      showToast('Failed to sync live rates', 'error');
    }
  });

  // CSV Buttons
  document.getElementById('btn-template').addEventListener('click', () => {
    window.location.href = `${API_BASE}/csv/template`;
  });
  document.getElementById('btn-export').addEventListener('click', () => {
    window.location.href = `${API_BASE}/csv/export`;
  });
  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('csv-file-input').click();
  });
  document.getElementById('csv-file-input').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadCsvFile(e.target.files[0]);
      e.target.value = '';
    }
  });

  // Form Submit
  document.getElementById('asset-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('asset-type-select').value;
    const name = document.getElementById('asset-name').value;
    const date = document.getElementById('asset-date').value;

    const data = {
      assetType: type,
      name: name,
      purchaseDate: date
    };

    if (type === 'PRECIOUS_METALS') {
      data.metalType = document.getElementById('metal-type').value;
      data.categoryType = document.getElementById('item-category').value;
      data.grams = parseFloat(document.getElementById('item-grams').value || 0);
      data.rateBought = parseFloat(document.getElementById('item-rate-bought').value || 0);
      data.deduction = parseFloat(document.getElementById('item-deduction').value || 0);
      data.investedAmount = data.grams * data.rateBought;
    } else if (type === 'EQUITY') {
      data.ticker = document.getElementById('equity-ticker').value;
      data.quantity = parseFloat(document.getElementById('equity-qty').value || 0);
      data.buyPrice = parseFloat(document.getElementById('equity-buy-price').value || 0);
      data.currentPrice = parseFloat(document.getElementById('equity-current-price').value || data.buyPrice);
      data.investedAmount = data.quantity * data.buyPrice;
    } else if (type === 'REAL_ESTATE') {
      data.location = document.getElementById('re-location').value;
      data.areaSqFt = parseFloat(document.getElementById('re-area').value || 0);
      data.investedAmount = parseFloat(document.getElementById('re-purchase-price').value || 0);
      data.estimatedMarketValue = parseFloat(document.getElementById('re-current-val').value || data.investedAmount);
      data.monthlyRentalIncome = parseFloat(document.getElementById('re-rent').value || 0);
    } else if (type === 'CASH_SAVINGS') {
      data.bankName = document.getElementById('cash-bank').value;
      data.investedAmount = parseFloat(document.getElementById('cash-deposit').value || 0);
      data.interestRatePct = parseFloat(document.getElementById('cash-rate').value || 0);
      data.maturityDate = document.getElementById('cash-maturity').value || null;
    }

    saveAsset(data);
  });

  // Cancel edit button
  document.getElementById('cancel-btn').addEventListener('click', resetForm);

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilterType = chip.dataset.filterType;
      updateUI();
    });
  });

  // Sort select
  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    updateUI();
  });

  // Auto-fill deduction helper on category change
  document.getElementById('item-category').addEventListener('change', (e) => {
    const dedInput = document.getElementById('item-deduction');
    if (e.target.value === 'COIN_BAR') {
      dedInput.value = '0';
    } else if (e.target.value === 'JEWELRY' && (dedInput.value === '0' || !dedInput.value)) {
      dedInput.value = '4';
    }
  });

  // Load initial data
  loadPortfolio();
});
