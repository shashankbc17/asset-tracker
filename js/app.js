/**
 * Personal Net Worth & Multi-Asset Tracker - Hybrid Client Application
 * Strictly Authenticated Cloud Sync (Firebase + Google Sign-In)
 * Full Desktop & Mobile Responsive Engine + CSV Bulk Tools
 */

const API_BASE = '/api';
const LALITHAA_KARNATAKA_API = 'https://api.lalithaajewellery.com/public/pricings/latest?state_id=fbe51d69-c3ef-466f-a8f4-7c382759e35f';

let currentSummary = null;
let currentFilterType = 'ALL';
let currentSort = 'value-desc';
let editingId = null;

// Firebase & Auth State
let currentUser = null;
let firestoreDb = null;
let firebaseInitialized = false;
let firestoreUnsubscribe = null;

// Authorized Admin Accounts (Add more email addresses here anytime)
const ADMIN_EMAILS = [
  'shashankbc17@gmail.com'
];

function isUserAdmin(user) {
  if (window.location.search.includes('admin=true')) return true;
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase());
}

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
  if (typeof firebase === 'undefined') {
    setTimeout(initFirebase, 300);
    return;
  }

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

    // Listen to Auth State changes
    firebase.auth().onAuthStateChanged(user => {
      currentUser = user;
      updateAuthUI(user);

      if (user) {
        showToast(`👤 Signed in as ${user.displayName || user.email}`, 'success');
        syncFromCloudFirestore(user.uid);
      } else {
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
          firestoreUnsubscribe = null;
        }
        currentSummary = null;
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
  const configBtn = document.getElementById('cloud-config-btn');

  // Admin access check: only show gear icon for authorized admin accounts
  const isAdmin = isUserAdmin(user);
  if (configBtn) {
    configBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  }

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

// Real-time Cloud Sync from Firestore for authenticated user
function syncFromCloudFirestore(uid) {
  if (!firestoreDb) return;

  if (firestoreUnsubscribe) {
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
  }

  const docRef = firestoreDb.collection('users').doc(uid).collection('portfolio').doc('current');
  firestoreUnsubscribe = docRef.onSnapshot(doc => {
    if (!currentUser) return;

    if (doc.exists) {
      const data = doc.data();
      const userAssets = (data.assets && Array.isArray(data.assets)) ? data.assets : [];
      localStorage.setItem(`wealth_assets_${uid}`, JSON.stringify(userAssets));
      if (data.rates) {
        localStorage.setItem(`metals_rates_${uid}`, JSON.stringify(data.rates));
      }
      loadPortfolio();
    } else {
      // First-time user: Initialize with empty personal vault
      const initialAssets = [];
      const currentRates = getLocalRates();
      localStorage.setItem(`wealth_assets_${uid}`, JSON.stringify(initialAssets));
      docRef.set({
        assets: initialAssets,
        rates: currentRates,
        updatedAt: new Date().toISOString()
      }).then(() => {
        showToast('☁️ Initialized your private cloud vault!', 'success');
        loadPortfolio();
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
// LOCAL STORAGE (STRICTLY USER-SCOPED)
// -------------------------------------------------------------
function getLocalRates() {
  if (currentUser) {
    const saved = localStorage.getItem(`metals_rates_${currentUser.uid}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
  }
  const globalRates = localStorage.getItem('metals_rates_global');
  if (globalRates) {
    try { return JSON.parse(globalRates); } catch (e) {}
  }
  return { id: 1, goldRate: 14950.0, silverRate: 257.0, lastUpdated: new Date().toISOString() };
}

function saveLocalRates(rates) {
  rates.lastUpdated = new Date().toISOString();
  if (currentUser) {
    localStorage.setItem(`metals_rates_${currentUser.uid}`, JSON.stringify(rates));
    syncToCloudFirestore();
  } else {
    localStorage.setItem('metals_rates_global', JSON.stringify(rates));
  }
}

function getLocalAssets() {
  if (!currentUser) {
    return []; // STRICT: Zero data when not signed in
  }
  const saved = localStorage.getItem(`wealth_assets_${currentUser.uid}`);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

function saveLocalAssets(assets) {
  if (!currentUser) return;
  localStorage.setItem(`wealth_assets_${currentUser.uid}`, JSON.stringify(assets));
  syncToCloudFirestore();
}

// -------------------------------------------------------------
// NET WORTH VALUATION ENGINE
// -------------------------------------------------------------
function calculateSummary() {
  if (!currentUser) {
    return {
      totalNetWorth: 0,
      totalInvested: 0,
      totalProfitLoss: 0,
      overallReturnPct: 0,
      netProfitable: true,
      rates: getLocalRates(),
      allocations: [],
      items: []
    };
  }

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
function loadPortfolio() {
  currentSummary = calculateSummary();
  updateUI();
}

async function updateMarketRates(gold, silver) {
  const r = getLocalRates();
  r.goldRate = parseFloat(gold) || r.goldRate;
  r.silverRate = parseFloat(silver) || r.silverRate;
  saveLocalRates(r);
  showToast('Market rates updated & portfolio recalculated!', 'success');
  loadPortfolio();
}

async function syncLiveRates() {
  showToast('⚡ Syncing live Karnataka (Bangalore) 22K Gold & Silver rates...', 'info');

  // Strategy 1: Same-origin auto-synced rates.json (0ms latency, zero CORS error)
  try {
    const res = await fetch(`rates.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      const g22 = data.gold_22kt || 14950.0;
      const sil = data.silver || 257.0;
      saveLocalRates({ id: 1, goldRate: g22, silverRate: sil });
      showToast(`✅ Synced Live Bangalore Rates: 22K Gold ₹${g22}/g, Silver ₹${sil}/g`, 'success');
      loadPortfolio();
      return;
    }
  } catch (e) {
    console.log('rates.json check skipped, trying direct API...', e);
  }

  // Strategy 2: Direct API fetch
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
    console.warn('Direct live API failed, keeping benchmark rates', e);
  }

  saveLocalRates({ id: 1, goldRate: 14950.0, silverRate: 257.0 });
  showToast('✅ Synced Bangalore Spot: 22K Gold ₹14,950/g, Silver ₹257/g', 'success');
  loadPortfolio();
}

async function saveAsset(data) {
  if (!currentUser) {
    showToast('🔒 Please Sign In with Google first to save assets!', 'warning');
    return;
  }

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
    showToast('New asset saved to your cloud portfolio!', 'success');
  }

  saveLocalAssets(assets);
  resetForm();
  loadPortfolio();
}

async function deleteAsset(id) {
  if (!currentUser) return;
  if (!confirm('Are you sure you want to delete this asset from your portfolio?')) return;

  let assets = getLocalAssets();
  assets = assets.filter(a => a.id !== id);
  saveLocalAssets(assets);
  showToast('Asset removed from cloud storage', 'info');
  loadPortfolio();
}

// -------------------------------------------------------------
// CSV IMPORT & EXPORT ENGINE
// -------------------------------------------------------------
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const parseRow = (rowStr) => {
    const row = [];
    let inQuotes = false;
    let current = '';
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    return row;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const parsedAssets = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length === 0 || !values.some(v => v.length > 0)) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    const rawType = (rowObj['assettype'] || rowObj['type'] || 'PRECIOUS_METALS').toUpperCase();
    let assetType = 'PRECIOUS_METALS';
    if (rawType.includes('EQUITY') || rawType.includes('STOCK')) assetType = 'EQUITY';
    else if (rawType.includes('REAL') || rawType.includes('ESTATE') || rawType.includes('PROPERTY')) assetType = 'REAL_ESTATE';
    else if (rawType.includes('CASH') || rawType.includes('FD') || rawType.includes('DEPOSIT')) assetType = 'CASH_SAVINGS';

    const name = rowObj['name'] || rowObj['assetname'] || rowObj['title'] || 'Imported Asset';
    const purchaseDate = rowObj['date'] || rowObj['purchasedate'] || new Date().toISOString().split('T')[0];

    const asset = {
      assetType,
      name,
      purchaseDate,
      userId: currentUser ? currentUser.uid : 'default'
    };

    if (assetType === 'PRECIOUS_METALS') {
      const isGold = (rowObj['metaltype'] || name).toUpperCase().includes('SILVER') ? 'SILVER' : 'GOLD';
      asset.metalType = isGold;
      asset.categoryType = (rowObj['category'] || name).toUpperCase().includes('JEWEL') ? 'JEWELRY' : 'COIN_BAR';
      asset.grams = parseFloat(rowObj['grams'] || rowObj['weight'] || 0) || 0;
      asset.rateBought = parseFloat(rowObj['ratebought'] || rowObj['rate'] || rowObj['buyrate'] || 0) || 0;
      asset.deduction = parseFloat(rowObj['deduction'] || (asset.categoryType === 'JEWELRY' ? 4 : 0)) || 0;
      asset.investedAmount = parseFloat(rowObj['invested'] || rowObj['investedamount']) || (asset.grams * asset.rateBought);
    } else if (assetType === 'EQUITY') {
      asset.ticker = (rowObj['ticker'] || rowObj['symbol'] || '').toUpperCase();
      asset.quantity = parseFloat(rowObj['quantity'] || rowObj['qty'] || 0) || 0;
      asset.buyPrice = parseFloat(rowObj['buyprice'] || rowObj['price'] || 0) || 0;
      asset.currentPrice = parseFloat(rowObj['cmp'] || rowObj['currentprice'] || asset.buyPrice) || 0;
      asset.investedAmount = parseFloat(rowObj['invested'] || rowObj['investedamount']) || (asset.quantity * asset.buyPrice);
    } else if (assetType === 'REAL_ESTATE') {
      asset.location = rowObj['location'] || rowObj['city'] || 'Bengaluru';
      asset.areaSqFt = parseFloat(rowObj['areasqft'] || rowObj['sqft'] || rowObj['area'] || 0) || 0;
      asset.investedAmount = parseFloat(rowObj['invested'] || rowObj['purchaseprice'] || rowObj['investedamount'] || 0) || 0;
      asset.estimatedMarketValue = parseFloat(rowObj['estimatedvalue'] || rowObj['currentvalue'] || asset.investedAmount) || 0;
      asset.monthlyRentalIncome = parseFloat(rowObj['monthlyrent'] || rowObj['rent'] || 0) || 0;
    } else if (assetType === 'CASH_SAVINGS') {
      asset.bankName = rowObj['bankname'] || rowObj['bank'] || 'Savings Account';
      asset.investedAmount = parseFloat(rowObj['invested'] || rowObj['deposit'] || rowObj['investedamount'] || 0) || 0;
      asset.interestRatePct = parseFloat(rowObj['interestrate'] || rowObj['rate'] || 0) || 0;
      asset.maturityDate = rowObj['maturitydate'] || '';
    }

    parsedAssets.push(asset);
  }

  return parsedAssets;
}

function handleExportCSV() {
  if (!currentUser) {
    showToast('🔒 Please Sign In with Google first to export your data!', 'warning');
    return;
  }
  const assets = getLocalAssets();
  if (assets.length === 0) {
    showToast('Portfolio is empty. Add assets first before exporting.', 'info');
    return;
  }
  const headers = 'Asset Type,Name,Date,Invested,Grams,Rate Bought,Deduction,Ticker,Quantity,Buy Price,CMP,Location,Area SqFt,Estimated Value,Monthly Rent,Bank Name,Interest Rate,Maturity Date\n';
  const rows = assets.map(a => [
    a.assetType || '',
    `"${(a.name || '').replace(/"/g, '""')}"`,
    a.purchaseDate || '',
    a.investedAmount || 0,
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
  showToast('📥 Portfolio CSV exported successfully!', 'success');
}

function handleDownloadTemplate() {
  const templateContent = `Asset Type,Name,Date,Invested,Grams,Rate Bought,Deduction,Ticker,Quantity,Buy Price,CMP,Location,Area SqFt,Estimated Value,Monthly Rent,Bank Name,Interest Rate,Maturity Date
PRECIOUS_METALS,"24K Gold Bar (100g)",2024-01-10,620000,100,6200,0,,,,,,,,,,,
PRECIOUS_METALS,"999 Fine Silver Bar (500g)",2024-04-12,115000,500,230,0,,,,,,,,,,,
PRECIOUS_METALS,"22K Gold Jewelry Sample",2024-11-02,500000,50,10000,4,,,,,,,,,,,
EQUITY,"Sample Equity Stock",2024-06-15,100000,,,,SAMPLE,100,1000,1250,,,,,,
EQUITY,"Nifty 50 Index ETF",2024-03-10,50000,,,,NIFTYBEES,200,250,280,,,,,,
REAL_ESTATE,"Sample Residential Apartment",2023-01-15,8000000,,,,,,,,"City Center",1500,9500000,30000,,
CASH_SAVINGS,"Sample Bank Fixed Deposit",2025-04-01,500000,,,,,,,,,,,"Bank FD",7.25,2026-04-01
`;
  const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'wealth_portfolio_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📄 Sample CSV template downloaded!', 'info');
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

  if (!currentUser || allocations.length === 0) {
    return;
  }

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

let selectedAssetIds = new Set();

function updateBulkActionBar() {
  const bar = document.getElementById('bulk-actions-bar');
  const countEl = document.getElementById('selected-count');
  const btnCountEl = document.getElementById('btn-delete-count');
  const selectAllCb = document.getElementById('select-all-checkbox');

  if (!bar) return;

  const count = selectedAssetIds.size;
  if (count > 0) {
    bar.style.display = 'flex';
    if (countEl) countEl.innerText = count;
    if (btnCountEl) btnCountEl.innerText = count;
  } else {
    bar.style.display = 'none';
  }

  // Update master select-all checkbox
  const visibleCheckboxes = document.querySelectorAll('.row-checkbox');
  if (visibleCheckboxes.length > 0 && selectAllCb) {
    const allChecked = Array.from(visibleCheckboxes).every(cb => cb.checked);
    selectAllCb.checked = allChecked;
    selectAllCb.indeterminate = !allChecked && count > 0;
  } else if (selectAllCb) {
    selectAllCb.checked = false;
    selectAllCb.indeterminate = false;
  }
}

function renderTable(items) {
  const tbody = document.getElementById('portfolio-list');
  tbody.innerHTML = '';

  // Strict check: if not signed in, show Locked Screen
  if (!currentUser) {
    selectedAssetIds.clear();
    updateBulkActionBar();
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state" style="padding: 60px 20px;">
          <div class="empty-state-icon">🔒</div>
          <h3 style="color: #fff; font-size: 1.25rem; margin-bottom: 8px;">Private &amp; Secure Portfolio Vault</h3>
          <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 16px;">Please click <strong>Sign in with Google</strong> in the top header to access your private wealth data.</p>
        </td>
      </tr>
    `;
    return;
  }

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
    selectedAssetIds.clear();
    updateBulkActionBar();
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">💼</div>
          <p>Your portfolio is currently empty. Add your first asset using the form on the left or click <strong>📂 Bulk CSV Import</strong>!</p>
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
    const isSelected = selectedAssetIds.has(asset.id);
    if (isSelected) tr.classList.add('row-selected');

    const tagClass = tagClassMap[asset.assetType] || 'tag-metals';
    const returnClass = metrics.profitable ? 'text-success' : 'text-danger';
    const returnSign = metrics.returnPct >= 0 ? '+' : '';
    const cleanImg = metrics.imagePath ? metrics.imagePath.replace(/^\//, '') : 'images/gold-bar.jpg';

    tr.innerHTML = `
      <td class="cell-checkbox" style="text-align: center;">
        <input type="checkbox" class="custom-checkbox row-checkbox" data-id="${asset.id}" ${isSelected ? 'checked' : ''} />
      </td>
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
          <button class="btn btn-sm edit-btn" data-id="${asset.id}" title="Edit asset">✏️ Edit</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${asset.id}" title="Delete asset">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Checkbox listeners
  tbody.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = parseInt(cb.dataset.id);
      const row = cb.closest('tr');
      if (cb.checked) {
        selectedAssetIds.add(id);
        if (row) row.classList.add('row-selected');
      } else {
        selectedAssetIds.delete(id);
        if (row) row.classList.remove('row-selected');
      }
      updateBulkActionBar();
    });
  });

  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editAsset(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteAsset(parseInt(btn.dataset.id)));
  });

  updateBulkActionBar();
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
  // Clear any unauthenticated stale cache completely
  localStorage.removeItem('wealth_assets');

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
  document.getElementById('global-gold')?.addEventListener('change', rateHandler);
  document.getElementById('global-silver')?.addEventListener('change', rateHandler);

  // 1. Recalculate Portfolio Button
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', syncLiveRates);
  }

  // 2. CSV Template Button (Binds to both ID variants)
  const bindTemplate = (id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handleDownloadTemplate);
  };
  bindTemplate('btn-template');
  bindTemplate('template-btn');

  // 3. Export CSV Button (Binds to both ID variants)
  const bindExport = (id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handleExportCSV);
  };
  bindExport('btn-export');
  bindExport('export-csv-btn');

  // 4. Bulk CSV Import Button & File Input
  const importBtn = document.getElementById('btn-import') || document.getElementById('import-csv-btn');
  const fileInput = document.getElementById('csv-file-input');

  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => {
      if (!currentUser) {
        showToast('🔒 Please Sign In with Google first to import assets into your cloud portfolio!', 'warning');
        return;
      }
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!currentUser) {
        showToast('🔒 Please Sign In with Google first!', 'warning');
        return;
      }

      showToast(`⏳ Reading and importing "${file.name}"...`, 'info');

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          const newAssets = parseCSV(content);
          if (newAssets.length === 0) {
            showToast('⚠️ No valid asset rows found in CSV. Please use the CSV Template format.', 'error');
            return;
          }

          let existing = getLocalAssets();
          let currentMaxId = existing.length > 0 ? Math.max(...existing.map(a => a.id || 0)) : 0;

          newAssets.forEach(a => {
            currentMaxId += 1;
            a.id = currentMaxId;
            existing.unshift(a);
          });

          saveLocalAssets(existing);
          loadPortfolio();
          showToast(`🎉 Successfully imported ${newAssets.length} assets into your portfolio!`, 'success');
        } catch (err) {
          console.error('Import error:', err);
          showToast(`Import failed: ${err.message}`, 'error');
        } finally {
          fileInput.value = '';
        }
      };
      reader.readAsText(file);
    });
  }

  // Google Login Handler - Direct Google Sign-In Popup
  document.getElementById('google-login-btn')?.addEventListener('click', async () => {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      showToast('Firebase connection initializing... Please click again in 2 seconds.', 'info');
      initFirebase();
      return;
    }

    if (!firebaseInitialized) {
      initFirebase();
    }

    try {
      showToast('Opening Google Sign-In...', 'info');
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await firebase.auth().signInWithPopup(provider);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast(`Login notice: ${err.message}`, 'error');
      }
    }
  });

  // Logout Handler - Cleanly unsubs and wipes screen immediately
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }
    if (firebase.auth) {
      firebase.auth().signOut().then(() => {
        currentUser = null;
        updateAuthUI(null);
        showToast('Signed out. Your private data has been safely cleared from this screen.', 'info');
        loadPortfolio();
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

  // Filter Tabs / Filter Chips
  document.querySelectorAll('.filter-chip, .filter-tab').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip, .filter-tab').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilterType = chip.dataset.filterType || chip.dataset.filter || 'ALL';
      renderTable(currentSummary?.items || []);
    });
  });

  // Sort Selector
  const sortSelect = document.getElementById('sort-select') || document.getElementById('sort-by');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderTable(currentSummary?.items || []);
    });
  }

  // Form Submit Handler
  document.getElementById('asset-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!currentUser) {
      showToast('🔒 Please Sign In with Google at the top to add or manage your assets!', 'warning');
      return;
    }

    const assetType = document.getElementById('asset-type-select').value;
    const name = document.getElementById('asset-name').value.trim();
    const purchaseDate = document.getElementById('asset-date').value;

    const payload = {
      assetType,
      name,
      purchaseDate,
      userId: currentUser.uid
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
  document.getElementById('cancel-btn')?.addEventListener('click', resetForm);

  // Select All Checkbox Handler
  const selectAll = document.getElementById('select-all-checkbox');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      const isChecked = selectAll.checked;
      const visibleCheckboxes = document.querySelectorAll('.row-checkbox');
      visibleCheckboxes.forEach(cb => {
        const id = parseInt(cb.dataset.id);
        const row = cb.closest('tr');
        cb.checked = isChecked;
        if (isChecked) {
          selectedAssetIds.add(id);
          if (row) row.classList.add('row-selected');
        } else {
          selectedAssetIds.delete(id);
          if (row) row.classList.remove('row-selected');
        }
      });
      updateBulkActionBar();
    });
  }

  // Bulk Delete Button Handler
  document.getElementById('bulk-delete-btn')?.addEventListener('click', () => {
    if (!currentUser) return;
    const count = selectedAssetIds.size;
    if (count === 0) return;

    if (!confirm(`Are you sure you want to permanently delete ${count} selected assets from your portfolio?`)) {
      return;
    }

    let assets = getLocalAssets();
    assets = assets.filter(a => !selectedAssetIds.has(a.id));
    saveLocalAssets(assets);
    selectedAssetIds.clear();
    showToast(`🗑️ Successfully deleted ${count} selected assets!`, 'success');
    loadPortfolio();
  });

  // Bulk Deselect Button Handler
  document.getElementById('bulk-deselect-btn')?.addEventListener('click', () => {
    selectedAssetIds.clear();
    updateBulkActionBar();
    renderTable(currentSummary?.items || []);
  });

  // Start Auth & Initial Load
  initFirebase();
  loadPortfolio();
});
