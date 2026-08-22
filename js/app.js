/**
 * Personal Net Worth & Multi-Asset Tracker - Hybrid Client Application
 * Supports LocalStorage, Java Spring Boot Backend, and Google Firebase Cloud Sync!
 */

const API_BASE = '/api';
const LALITHAA_KARNATAKA_API = 'https://api.lalithaajewellery.com/public/pricings/latest?state_id=fbe51d69-c3ef-466f-a8f4-7c382759e35f';

let currentSummary = null;
let currentFilterType = 'ALL';
let currentSort = 'value-desc';
let editingId = null;
let isStandaloneMode = true;

// Firebase State
let currentUser = null;
let firestoreDb = null;
let firebaseInitialized = false;

// Default Firebase Project Configuration
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCfsEG-1jGkImSumkNFqKVnyaSiXHkT8ys",
  authDomain: "my-wealth-tracker-50d2c.firebaseapp.com",
  projectId: "my-wealth-tracker-50d2c",
  storageBucket: "my-wealth-tracker-50d2c.firebasestorage.app",
  messagingSenderId: "749131807291",
  appId: "1:749131807291:web:89cab5dbd316e5ed2dfa1e",
  measurementId: "G-HWGSD19563"
};

// 13 Starter Luxury Holdings
const STARTER_ASSETS = [
  { id: 1, assetType: 'PRECIOUS_METALS', name: '24K Minted Gold Bar (100g)', purchaseDate: '2024-01-10', investedAmount: 620000, metalType: 'GOLD', categoryType: 'COIN_BAR', grams: 100, rateBought: 6200, deduction: 0 },
  { id: 2, assetType: 'PRECIOUS_METALS', name: '999 Fine Silver Bullion Bar (500g)', purchaseDate: '2024-04-12', investedAmount: 115000, metalType: 'SILVER', categoryType: 'COIN_BAR', grams: 500, rateBought: 230, deduction: 0 },
  { id: 3, assetType: 'PRECIOUS_METALS', name: '22K Bridal Gold Necklace', purchaseDate: '2025-11-02', investedAmount: 951573, metalType: 'GOLD', categoryType: 'JEWELRY', grams: 80.2, rateBought: 11865, deduction: 4 },
  { id: 4, assetType: 'PRECIOUS_METALS', name: 'Silver Ingot Bullion (2kg)', purchaseDate: '2025-11-02', investedAmount: 426000, metalType: 'SILVER', categoryType: 'COIN_BAR', grams: 2000, rateBought: 213, deduction: 0 },
  { id: 5, assetType: 'PRECIOUS_METALS', name: 'Silver Puja Coins (1kg)', purchaseDate: '2025-11-02', investedAmount: 190000, metalType: 'SILVER', categoryType: 'COIN_BAR', grams: 1000, rateBought: 190, deduction: 0 },
  { id: 6, assetType: 'PRECIOUS_METALS', name: 'Gold Minted Coin (1g)', purchaseDate: '2025-09-14', investedAmount: 10190, metalType: 'GOLD', categoryType: 'COIN_BAR', grams: 1.0, rateBought: 10190, deduction: 0 },
  { id: 7, assetType: 'PRECIOUS_METALS', name: '22K Gold Bangles (41g)', purchaseDate: '2025-05-03', investedAmount: 358955, metalType: 'GOLD', categoryType: 'JEWELRY', grams: 41.0, rateBought: 8755, deduction: 4 },
  { id: 8, assetType: 'EQUITY', name: 'TCS (Tata Consultancy Services)', purchaseDate: '2024-06-15', investedAmount: 345000, ticker: 'TCS', quantity: 100, buyPrice: 3450, currentPrice: 4120 },
  { id: 9, assetType: 'EQUITY', name: 'Nifty 50 Index ETF', purchaseDate: '2024-03-10', investedAmount: 107500, ticker: 'NIFTYBEES', quantity: 500, buyPrice: 215, currentPrice: 268 },
  { id: 10, assetType: 'REAL_ESTATE', name: 'Indiranagar Luxury 3BHK', purchaseDate: '2023-01-15', investedAmount: 12500000, location: 'Bengaluru, Indiranagar', areaSqFt: 1850, estimatedMarketValue: 16000000, monthlyRentalIncome: 65000 },
  { id: 11, assetType: 'REAL_ESTATE', name: 'North Bangalore Villa Plot', purchaseDate: '2022-08-20', investedAmount: 4500000, location: 'Devanahalli, Bengaluru', areaSqFt: 2400, estimatedMarketValue: 6800000, monthlyRentalIncome: 0 },
  { id: 12, assetType: 'CASH_SAVINGS', name: 'HDFC High Yield 1-Yr FD', purchaseDate: '2025-04-01', investedAmount: 1000000, bankName: 'HDFC Bank', interestRatePct: 7.25, maturityDate: '2026-04-01' },
  { id: 13, assetType: 'CASH_SAVINGS', name: 'SBI Emergency Liquid Reserve', purchaseDate: '2025-01-01', investedAmount: 500000, bankName: 'State Bank of India', interestRatePct: 3.5, maturityDate: '' }
];

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

// -------------------------------------------------------------
// FIREBASE AUTHENTICATION & CLOUD SYNC ENGINE
// -------------------------------------------------------------
function initFirebase() {
  let config = DEFAULT_FIREBASE_CONFIG;
  const savedConfig = localStorage.getItem('firebase_web_config');
  if (savedConfig) {
    try { config = JSON.parse(savedConfig); } catch (e) {}
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    firestoreDb = firebase.firestore();
    firebaseInitialized = true;

    // Listen to Auth State
    firebase.auth().onAuthStateChanged(user => {
      currentUser = user;
      updateAuthUI(user);

      if (user) {
        showToast(`👤 Signed in as ${user.displayName || user.email}`, 'success');
        syncFromCloudFirestore(user.uid);
      } else {
        loadPortfolio();
      }
    });
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
  }
}

function updateAuthUI(user) {
  const loginBtn = document.getElementById('google-login-btn');
  const profileBadge = document.getElementById('user-profile-badge');
  const userName = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (profileBadge) profileBadge.style.display = 'flex';
    if (userName) userName.innerText = user.displayName || user.email.split('@')[0];
    if (userAvatar) userAvatar.src = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp';
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (profileBadge) profileBadge.style.display = 'none';
  }
}

// Real-time Cloud Sync from Firestore
function syncFromCloudFirestore(uid) {
  if (!firestoreDb) return;

  const docRef = firestoreDb.collection('users').doc(uid).collection('portfolio').doc('current');
  docRef.onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data.assets && Array.isArray(data.assets)) {
        localStorage.setItem('wealth_assets', JSON.stringify(data.assets));
      }
      if (data.rates) {
        localStorage.setItem('metals_rates', JSON.stringify(data.rates));
      }
      loadPortfolio();
    } else {
      // First time user: Upload local starter/current assets to cloud
      const currentAssets = getLocalAssets();
      const currentRates = getLocalRates();
      docRef.set({
        assets: currentAssets,
        rates: currentRates,
        updatedAt: new Date().toISOString()
      }).then(() => {
        showToast('☁️ Initialized personal cloud vault on Firebase!', 'success');
      });
    }
  }, err => {
    console.error('Firestore snapshot error:', err);
  });
}

function syncToCloudFirestore() {
  if (!currentUser || !firestoreDb) return;
  const assets = getLocalAssets();
  const rates = getLocalRates();
  firestoreDb.collection('users').doc(currentUser.uid).collection('portfolio').doc('current').set({
    assets,
    rates,
    updatedAt: new Date().toISOString()
  }).catch(err => {
    console.error('Error syncing to Firestore:', err);
  });
}

// -------------------------------------------------------------
// LOCAL / STANDALONE STORAGE HELPERS
// -------------------------------------------------------------
function getLocalRates() {
  const saved = localStorage.getItem('metals_rates');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return { id: 1, goldRate: 14950.0, silverRate: 257.0, lastUpdated: new Date().toISOString() };
}

function saveLocalRates(rates) {
  rates.lastUpdated = new Date().toISOString();
  localStorage.setItem('metals_rates', JSON.stringify(rates));
  syncToCloudFirestore();
}

function getLocalAssets() {
  const saved = localStorage.getItem('wealth_assets');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  localStorage.setItem('wealth_assets', JSON.stringify(STARTER_ASSETS));
  return [...STARTER_ASSETS];
}

function saveLocalAssets(assets) {
  localStorage.setItem('wealth_assets', JSON.stringify(assets));
  syncToCloudFirestore();
}

// -------------------------------------------------------------
// NET WORTH VALUATION ENGINE
// -------------------------------------------------------------
function calculateStandaloneSummary() {
  const assets = getLocalAssets();
  const rates = getLocalRates();
  const today = new Date();

  let totalNetWorth = 0;
  let totalInvested = 0;

  const allocationMap = {
    'PRECIOUS_METALS': { assetType: 'PRECIOUS_METALS', name: 'Precious Metals', icon: '🪙', investedAmount: 0, currentValue: 0, profitLoss: 0, count: 0 },
    'EQUITY': { assetType: 'EQUITY', name: 'Equities & Mutual Funds', icon: '📈', investedAmount: 0, currentValue: 0, profitLoss: 0, count: 0 },
    'REAL_ESTATE': { assetType: 'REAL_ESTATE', name: 'Real Estate', icon: '🏡', investedAmount: 0, currentValue: 0, profitLoss: 0, count: 0 },
    'CASH_SAVINGS': { assetType: 'CASH_SAVINGS', name: 'Cash & Fixed Deposits', icon: '💰', investedAmount: 0, currentValue: 0, profitLoss: 0, count: 0 }
  };

  const items = assets.map(a => {
    let invested = a.investedAmount || 0;
    let currentVal = 0;
    let keyMetric = '';
    let categoryBadge = '';
    let imagePath = 'images/gold-bar.jpg';

    if (a.assetType === 'PRECIOUS_METALS') {
      const isGold = a.metalType === 'GOLD';
      const spot = isGold ? rates.goldRate : rates.silverRate;
      const deductionFactor = (100.0 - (a.deduction || 0)) / 100.0;
      currentVal = (a.grams || 0) * spot * deductionFactor;
      keyMetric = `${a.grams}g • Spot: ₹${spot}/g`;
      categoryBadge = a.categoryType === 'JEWELRY' ? 'Jewelry (Melt)' : 'Bullion Ingot / Coin';
      imagePath = isGold ? (a.categoryType === 'JEWELRY' ? 'images/gold-jewelry.jpg' : 'images/gold-bar.jpg')
                         : (a.categoryType === 'JEWELRY' ? 'images/silver-jewelry.jpg' : 'images/silver-bar.jpg');
    } else if (a.assetType === 'EQUITY') {
      currentVal = (a.quantity || 0) * (a.currentPrice || a.buyPrice || 0);
      keyMetric = `${a.quantity} Qty @ CMP: ₹${a.currentPrice || 0}`;
      categoryBadge = `Ticker: ${a.ticker || 'N/A'}`;
      imagePath = 'images/equity.jpg';
    } else if (a.assetType === 'REAL_ESTATE') {
      currentVal = a.estimatedMarketValue || a.investedAmount || 0;
      const rentStr = (a.monthlyRentalIncome && a.monthlyRentalIncome > 0) ? ` • Rent: ₹${a.monthlyRentalIncome.toLocaleString()}/mo` : '';
      keyMetric = `${a.areaSqFt || 0} sq.ft${rentStr}`;
      categoryBadge = a.location || 'Property';
      imagePath = 'images/real-estate.jpg';
    } else if (a.assetType === 'CASH_SAVINGS') {
      let principal = a.investedAmount || 0;
      let rate = a.interestRatePct || 0;
      let years = 0;
      if (a.purchaseDate) {
        const pDate = new Date(a.purchaseDate);
        years = Math.max(0, (today - pDate) / (1000 * 60 * 60 * 24 * 365.25));
      }
      currentVal = principal * (1.0 + (rate / 100.0) * years);
      keyMetric = `${a.interestRatePct || 0}% Interest p.a.`;
      categoryBadge = a.bankName || 'Liquid Reserve';
      imagePath = 'images/cash.jpg';
    }

    const profitLoss = currentVal - invested;
    const returnPct = invested > 0 ? (profitLoss / invested) * 100 : 0;
    
    // CAGR calculation
    let cagrStr = '0.00% p.a.';
    if (a.purchaseDate && invested > 0 && currentVal > 0) {
      const pDate = new Date(a.purchaseDate);
      const days = Math.max(1, (today - pDate) / (1000 * 60 * 60 * 24));
      const years = days / 365.25;
      if (years >= 0.08) {
        const cagr = (Math.pow(currentVal / invested, 1.0 / years) - 1.0) * 100;
        cagrStr = `${cagr.toFixed(2)}% CAGR`;
      } else {
        cagrStr = `${returnPct.toFixed(2)}% ROI`;
      }
    }

    totalNetWorth += currentVal;
    totalInvested += invested;

    const alloc = allocationMap[a.assetType];
    if (alloc) {
      alloc.investedAmount += invested;
      alloc.currentValue += currentVal;
      alloc.profitLoss += profitLoss;
      alloc.count += 1;
    }

    return {
      asset: a,
      metrics: {
        currentValue: currentVal,
        investedAmount: invested,
        profitLoss,
        returnPct,
        cagrDisplay: cagrStr,
        keyMetricDisplay: keyMetric,
        categoryBadge,
        imagePath,
        profitable: profitLoss >= 0
      }
    };
  });

  const totalProfitLoss = totalNetWorth - totalInvested;
  const overallReturnPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const allocations = Object.values(allocationMap).map(alloc => {
    alloc.returnPct = alloc.investedAmount > 0 ? (alloc.profitLoss / alloc.investedAmount) * 100 : 0;
    alloc.percentageOfNetWorth = totalNetWorth > 0 ? (alloc.currentValue / totalNetWorth) * 100 : 0;
    return alloc;
  });

  return {
    totalNetWorth,
    totalInvested,
    totalProfitLoss,
    overallReturnPct,
    netProfitable: totalProfitLoss >= 0,
    rates,
    allocations,
    items
  };
}

// -------------------------------------------------------------
// LOAD & SYNC PORTFOLIO
// -------------------------------------------------------------
async function loadPortfolio() {
  if (window.location.hostname.includes('github.io') || currentUser) {
    isStandaloneMode = true;
    currentSummary = calculateStandaloneSummary();
    updateUI();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/assets/summary`);
    if (!res.ok) throw new Error('No backend');
    currentSummary = await res.json();
    isStandaloneMode = false;
  } catch (err) {
    isStandaloneMode = true;
    currentSummary = calculateStandaloneSummary();
  }
  updateUI();
}

async function updateMarketRates(gold, silver) {
  if (isStandaloneMode) {
    const r = getLocalRates();
    r.goldRate = parseFloat(gold) || r.goldRate;
    r.silverRate = parseFloat(silver) || r.silverRate;
    saveLocalRates(r);
    showToast('Market rates updated & portfolio recalculated!', 'success');
    loadPortfolio();
    return;
  }

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

async function syncLiveRates() {
  showToast('⚡ Syncing live Karnataka (Bangalore) 22K Gold & Silver rates...', 'info');

  if (isStandaloneMode) {
    try {
      const res = await fetch(LALITHAA_KARNATAKA_API);
      if (res.ok) {
        const json = await res.json();
        const g22 = json?.data?.prices?.gold_22kt?.price || 14950.0;
        const sil = json?.data?.prices?.silver?.price || 257.0;
        saveLocalRates({ id: 1, goldRate: g22, silverRate: sil });
        showToast(`✅ Synced Official Karnataka Bullion: 22K Gold ₹${g22}/g, Silver ₹${sil}/g`, 'success');
        loadPortfolio();
        return;
      }
    } catch (e) {
      console.warn('Direct live API failed, keeping current rates', e);
    }
    saveLocalRates({ id: 1, goldRate: 14950.0, silverRate: 257.0 });
    showToast('✅ Synced Bangalore Spot: 22K Gold ₹14,950/g, Silver ₹257/g', 'success');
    loadPortfolio();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/portfolio/rates/sync`, { method: 'POST' });
    if (res.ok) {
      const rates = await res.json();
      showToast(`✅ Synced Official Karnataka Bullion: 22K Gold ₹${rates.goldRate}/g, Silver ₹${rates.silverRate}/g`, 'success');
      loadPortfolio();
    }
  } catch (err) {
    showToast('Failed to sync live rates', 'error');
  }
}

async function saveAsset(data) {
  if (isStandaloneMode) {
    const assets = getLocalAssets();
    if (editingId) {
      const idx = assets.findIndex(a => a.id === editingId);
      if (idx !== -1) {
        assets[idx] = { ...assets[idx], ...data, id: editingId };
        showToast('Asset updated successfully!', 'success');
      }
    } else {
      const newId = assets.length > 0 ? Math.max(...assets.map(a => a.id || 0)) + 1 : 1;
      assets.unshift({ ...data, id: newId });
      showToast('New asset saved to portfolio!', 'success');
    }
    saveLocalAssets(assets);
    resetForm();
    loadPortfolio();
    return;
  }

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

async function deleteAsset(id) {
  if (!confirm('Are you sure you want to delete this asset from your portfolio?')) return;

  if (isStandaloneMode) {
    let assets = getLocalAssets();
    assets = assets.filter(a => a.id !== id);
    saveLocalAssets(assets);
    showToast('Asset removed from storage', 'info');
    loadPortfolio();
    return;
  }

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

// -------------------------------------------------------------
// UI RENDERING
// -------------------------------------------------------------
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

function renderAllocation(allocations) {
  const bar = document.getElementById('allocation-bar');
  const legend = document.getElementById('allocation-legend');
  bar.innerHTML = '';
  legend.innerHTML = '';

  const classColorMap = {
    'PRECIOUS_METALS': { bg: 'linear-gradient(90deg, #d4af37, #f7e07c)', dot: '#d4af37' },
    'EQUITY': { bg: 'linear-gradient(90deg, #4da6ff, #0066cc)', dot: '#4da6ff' },
    'REAL_ESTATE': { bg: 'linear-gradient(90deg, #2ecc71, #27ae60)', dot: '#2ecc71' },
    'CASH_SAVINGS': { bg: 'linear-gradient(90deg, #9b59b6, #8e44ad)', dot: '#9b59b6' }
  };

  allocations.forEach(alloc => {
    const pct = alloc.percentageOfNetWorth.toFixed(1);
    if (alloc.percentageOfNetWorth <= 0) return;

    const styling = classColorMap[alloc.assetType] || { bg: '#888', dot: '#888' };

    const seg = document.createElement('div');
    seg.className = 'allocation-segment';
    seg.style.width = `${pct}%`;
    seg.style.background = styling.bg;
    seg.title = `${alloc.name}: ${pct}% (${formatCurrency(alloc.currentValue)})`;
    bar.appendChild(seg);

    const item = document.createElement('div');
    item.className = 'allocation-legend-item';
    item.innerHTML = `
      <span class="legend-dot" style="background: ${styling.dot};"></span>
      <span>${alloc.icon} ${alloc.name}: <strong>${pct}%</strong> (${formatCurrency(alloc.currentValue)})</span>
    `;
    legend.appendChild(item);
  });
}

function renderTable(items) {
  const tbody = document.getElementById('portfolio-list');
  tbody.innerHTML = '';

  let filtered = items.filter(item => {
    if (currentFilterType === 'ALL') return true;
    return item.asset.assetType === currentFilterType;
  });

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
    const cleanImg = metrics.imagePath ? metrics.imagePath.replace(/^\//, '') : 'images/gold-bar.jpg';

    tr.innerHTML = `
      <td>
        <div class="cell-asset">
          <div class="asset-thumb" title="${asset.name}">
            <img src="${cleanImg}" alt="${asset.name}" />
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

  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editAsset(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteAsset(parseInt(btn.dataset.id)));
  });
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

  if (a.assetType === 'PRECIOUS_METALS') {
    document.getElementById('metal-type').value = a.metalType || 'GOLD';
    document.getElementById('item-category').value = a.categoryType || 'COIN_BAR';
    document.getElementById('item-grams').value = a.grams || '';
    document.getElementById('item-rate-bought').value = a.rateBought || '';
    document.getElementById('item-deduction').value = a.deduction || 0;
  } else if (a.assetType === 'EQUITY') {
    document.getElementById('equity-ticker').value = a.ticker || '';
    document.getElementById('equity-qty').value = a.quantity || '';
    document.getElementById('equity-buy-price').value = a.buyPrice || '';
    document.getElementById('equity-current-price').value = a.currentPrice || '';
  } else if (a.assetType === 'REAL_ESTATE') {
    document.getElementById('re-location').value = a.location || '';
    document.getElementById('re-area').value = a.areaSqFt || '';
    document.getElementById('re-purchase-price').value = a.investedAmount || '';
    document.getElementById('re-current-val').value = a.estimatedMarketValue || '';
    document.getElementById('re-rent').value = a.monthlyRentalIncome || '';
  } else if (a.assetType === 'CASH_SAVINGS') {
    document.getElementById('cash-bank').value = a.bankName || '';
    document.getElementById('cash-deposit').value = a.investedAmount || '';
    document.getElementById('cash-rate').value = a.interestRatePct || '';
    document.getElementById('cash-maturity').value = a.maturityDate || '';
  }

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
  document.getElementById('asset-form').reset();
  editingId = null;
  document.getElementById('form-title').innerText = 'Add New Asset';
  document.getElementById('submit-btn').innerText = '✨ Save to Portfolio';
  document.getElementById('cancel-btn').style.display = 'none';
  document.getElementById('asset-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('asset-type-select').value = 'PRECIOUS_METALS';
  toggleFormFieldsets('PRECIOUS_METALS');
}

function toggleFormFieldsets(type) {
  document.getElementById('fields-metals').style.display = type === 'PRECIOUS_METALS' ? 'block' : 'none';
  document.getElementById('fields-equity').style.display = type === 'EQUITY' ? 'block' : 'none';
  document.getElementById('fields-realestate').style.display = type === 'REAL_ESTATE' ? 'block' : 'none';
  document.getElementById('fields-cash').style.display = type === 'CASH_SAVINGS' ? 'block' : 'none';
}

// -------------------------------------------------------------
// INITIALIZATION & EVENT LISTENERS
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Set default date
  const dateInput = document.getElementById('asset-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Asset Type Select Handler
  document.getElementById('asset-type-select').addEventListener('change', (e) => {
    toggleFormFieldsets(e.target.value);
  });

  // Deduction suggestion for jewelry
  document.getElementById('item-category').addEventListener('change', (e) => {
    if (!editingId) {
      document.getElementById('item-deduction').value = e.target.value === 'JEWELRY' ? '4' : '0';
    }
  });

  // Rates Update Handler
  const rateHandler = () => {
    const gold = document.getElementById('global-gold').value;
    const silver = document.getElementById('global-silver').value;
    updateMarketRates(gold, silver);
  };
  document.getElementById('global-gold').addEventListener('change', rateHandler);
  document.getElementById('global-silver').addEventListener('change', rateHandler);

  // Sync button
  document.getElementById('sync-btn').addEventListener('click', syncLiveRates);

  // Google Login Handler
  document.getElementById('google-login-btn')?.addEventListener('click', () => {
    if (!firebaseInitialized) {
      document.getElementById('cloud-modal').style.display = 'flex';
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(err => {
      showToast(`Login failed: ${err.message}`, 'error');
    });
  });

  // Logout Handler
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (firebase.auth) {
      firebase.auth().signOut().then(() => {
        showToast('Signed out of cloud account', 'info');
      });
    }
  });

  // Cloud Config Modal Handlers
  const modal = document.getElementById('cloud-modal');
  document.getElementById('cloud-config-btn')?.addEventListener('click', () => {
    const saved = localStorage.getItem('firebase_web_config') || '';
    document.getElementById('firebase-config-input').value = saved;
    modal.style.display = 'flex';
  });
  document.getElementById('close-modal-btn')?.addEventListener('click', () => modal.style.display = 'none');
  document.getElementById('cancel-modal-btn')?.addEventListener('click', () => modal.style.display = 'none');

  document.getElementById('save-cloud-config-btn')?.addEventListener('click', () => {
    const raw = document.getElementById('firebase-config-input').value.trim();
    if (!raw) {
      localStorage.removeItem('firebase_web_config');
      showToast('Cloud database disconnected', 'info');
      modal.style.display = 'none';
      return;
    }
    try {
      JSON.parse(raw);
      localStorage.setItem('firebase_web_config', raw);
      showToast('☁️ Firebase Config Saved! Connecting...', 'success');
      modal.style.display = 'none';
      initFirebase();
    } catch (e) {
      showToast('Invalid JSON config. Please paste valid Firebase JSON.', 'error');
    }
  });

  // Filter Tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilterType = tab.dataset.filter;
      renderTable(currentSummary?.items || []);
    });
  });

  // Sort Selector
  document.getElementById('sort-by').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTable(currentSummary?.items || []);
  });

  // Form Submit Handler
  document.getElementById('asset-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const assetType = document.getElementById('asset-type-select').value;
    const name = document.getElementById('asset-name').value.trim();
    const purchaseDate = document.getElementById('asset-date').value;

    const payload = {
      assetType,
      name,
      purchaseDate,
      userId: currentUser ? currentUser.uid : 'default_user'
    };

    if (assetType === 'PRECIOUS_METALS') {
      payload.metalType = document.getElementById('metal-type').value;
      payload.categoryType = document.getElementById('item-category').value;
      payload.grams = parseFloat(document.getElementById('item-grams').value) || 0;
      payload.rateBought = parseFloat(document.getElementById('item-rate-bought').value) || 0;
      payload.deduction = parseFloat(document.getElementById('item-deduction').value) || 0;
      payload.investedAmount = payload.grams * payload.rateBought;
    } else if (assetType === 'EQUITY') {
      payload.ticker = document.getElementById('equity-ticker').value.trim().toUpperCase();
      payload.quantity = parseFloat(document.getElementById('equity-qty').value) || 0;
      payload.buyPrice = parseFloat(document.getElementById('equity-buy-price').value) || 0;
      payload.currentPrice = parseFloat(document.getElementById('equity-current-price').value) || payload.buyPrice;
      payload.investedAmount = payload.quantity * payload.buyPrice;
    } else if (assetType === 'REAL_ESTATE') {
      payload.location = document.getElementById('re-location').value.trim();
      payload.areaSqFt = parseFloat(document.getElementById('re-area').value) || 0;
      payload.investedAmount = parseFloat(document.getElementById('re-purchase-price').value) || 0;
      payload.estimatedMarketValue = parseFloat(document.getElementById('re-current-val').value) || payload.investedAmount;
      payload.monthlyRentalIncome = parseFloat(document.getElementById('re-rent').value) || 0;
    } else if (assetType === 'CASH_SAVINGS') {
      payload.bankName = document.getElementById('cash-bank').value.trim();
      payload.investedAmount = parseFloat(document.getElementById('cash-deposit').value) || 0;
      payload.interestRatePct = parseFloat(document.getElementById('cash-rate').value) || 0;
      payload.maturityDate = document.getElementById('cash-maturity').value;
    }

    saveAsset(payload);
  });

  // Cancel Edit
  document.getElementById('cancel-btn').addEventListener('click', resetForm);

  // CSV Export & Template
  document.getElementById('export-csv-btn').addEventListener('click', () => {
    if (isStandaloneMode) {
      const assets = getLocalAssets();
      const headers = 'Asset Type,Name,Date,Invested,Grams,Rate Bought,Deduction,Ticker,Quantity,Buy Price,CMP,Location,Area SqFt,Estimated Value,Monthly Rent,Bank Name,Interest Rate,Maturity Date\n';
      const rows = assets.map(a => [
        a.assetType || '',
        `"${a.name || ''}"`,
        a.purchaseDate || '',
        a.investedAmount || 0,
        a.grams || '',
        a.rateBought || '',
        a.deduction || '',
        a.ticker || '',
        a.quantity || '',
        a.buyPrice || '',
        a.currentPrice || '',
        `"${a.location || ''}"`,
        a.areaSqFt || '',
        a.estimatedMarketValue || '',
        a.monthlyRentalIncome || '',
        `"${a.bankName || ''}"`,
        a.interestRatePct || '',
        a.maturityDate || ''
      ].join(',')).join('\n');

      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `wealth_portfolio_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📥 Portfolio CSV downloaded!', 'success');
      return;
    }
    window.location.href = `${API_BASE}/portfolio/export-csv`;
  });

  document.getElementById('template-btn').addEventListener('click', () => {
    window.location.href = `${API_BASE}/portfolio/template`;
  });

  // Initialize Firebase (if config exists) & load
  initFirebase();
  loadPortfolio();
});
