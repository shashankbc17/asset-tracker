import { Asset, MetalRates, NetWorthSummary, Liability } from '../types/portfolio';
import { calculateAssetMetrics, computePortfolioSummary, calculateLiabilityMetrics } from '../utils/calculations';
import { fetchCurrentRates } from './ratesService';

export const LOCAL_STORAGE_KEY = 'wealth_assets_v4';
export const LOCAL_STORAGE_LIABILITIES_KEY = 'wealth_liabilities_v2';

// Auto-purge stale v1 guest keys that contained old seeded data
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('wealth_liabilities_v1_default_user');
    localStorage.removeItem('precious_metals_assets_v3_default_user');
  } catch {
    // ignore
  }
}

export async function getLiabilities(userId = 'default_user'): Promise<Liability[]> {
  try {
    const res = await fetch(`/api/liabilities?userId=${encodeURIComponent(userId)}`);
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      const data: Liability[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((l) => ({
          ...l,
          metrics: calculateLiabilityMetrics(l),
        }));
      }
    }
  } catch {
    // Expected on static hosting
  }

  // Check localStorage
  const local = localStorage.getItem(`${LOCAL_STORAGE_LIABILITIES_KEY}_${userId}`);
  if (local !== null) {
    try {
      const parsed: Liability[] = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed.map((l) => ({
          ...l,
          metrics: calculateLiabilityMetrics(l),
        }));
      }
    } catch {
      // ignore
    }
  }

  // If user is authenticated and has no saved liabilities, return empty array
  if (userId && userId !== 'default_user') {
    return [];
  }

  // Generic sample demo liability for guest preview ONLY
  const defaultLiabilities: Liability[] = [
    {
      id: 1,
      userId,
      name: 'Sample Housing Loan',
      lender: 'Apex Finance Corp',
      accountNumber: 'HL-DEMO-98213',
      loanType: 'HOME',
      sanctionDate: '2023-01-10',
      firstEmiDate: '2023-02-05',
      dueDayOfMonth: 5,
      principalAmount: 2500000,
      annualInterestRate: 8.50,
      tenureMonths: 120,
      monthlyEmi: 31000,
      processingFee: 10000,
      notes: 'Demo Home Loan for Portfolio Balance Sheet preview',
    },
  ];

  const calculated = defaultLiabilities.map((l) => ({
    ...l,
    metrics: calculateLiabilityMetrics(l),
  }));

  localStorage.setItem(`${LOCAL_STORAGE_LIABILITIES_KEY}_${userId}`, JSON.stringify(defaultLiabilities));
  return calculated;
}

export async function createOrUpdateLiability(liability: Liability, userId = 'default_user'): Promise<Liability> {
  const payload = {
    ...liability,
    userId: liability.userId || userId,
  };

  try {
    const url = liability.id ? `/api/liabilities/${liability.id}` : '/api/liabilities';
    const method = liability.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      const saved = await res.json();
      return {
        ...saved,
        metrics: calculateLiabilityMetrics(saved),
      };
    }
  } catch {
    // Expected on static hosting
  }

  // Local storage fallback
  const local = localStorage.getItem(`${LOCAL_STORAGE_LIABILITIES_KEY}_${userId}`);
  let list: Liability[] = local ? JSON.parse(local) : [];

  let savedItem: Liability;
  if (liability.id) {
    list = list.map((item) => (String(item.id) === String(liability.id) ? { ...liability } : item));
    savedItem = liability;
  } else {
    savedItem = {
      ...liability,
      id: Date.now(),
      userId,
    };
    list.unshift(savedItem);
  }

  localStorage.setItem(`${LOCAL_STORAGE_LIABILITIES_KEY}_${userId}`, JSON.stringify(list));
  return {
    ...savedItem,
    metrics: calculateLiabilityMetrics(savedItem),
  };
}

export async function deleteLiability(id: number | string, userId = 'default_user'): Promise<boolean> {
  try {
    const res = await fetch(`/api/liabilities/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch {
    // Expected on static hosting
  }

  const storageKey = `${LOCAL_STORAGE_LIABILITIES_KEY}_${userId}`;
  const local = localStorage.getItem(storageKey);
  if (local) {
    const list: Liability[] = JSON.parse(local);
    const filtered = list.filter((l) => String(l.id) !== String(id));
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  }
  return true;
}

export async function getAssets(userId = 'default_user', rates?: MetalRates): Promise<Asset[]> {
  try {
    const res = await fetch(`/api/assets?userId=${encodeURIComponent(userId)}`);
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      const data: Asset[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const currentRates = rates || await fetchCurrentRates();
        return data.map((a) => ({
          ...a,
          metrics: calculateAssetMetrics(a, currentRates),
        }));
      }
    }
  } catch {
    // Expected on static hosting like GitHub Pages
  }

  // Fallback to localStorage (check both wealth_assets_${userId} and precious_metals_assets_v3_${userId})
  const local = localStorage.getItem(`wealth_assets_${userId}`) || localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  if (local !== null) {
    try {
      const parsed: Asset[] = JSON.parse(local);
      if (Array.isArray(parsed)) {
        const currentRates = rates || await fetchCurrentRates();
        return parsed.map((a) => ({
          ...a,
          metrics: calculateAssetMetrics(a, currentRates),
        }));
      }
    } catch {
      // ignore
    }
  }

  // If user is authenticated and has no holdings, return empty array (do NOT flash demo data)
  if (userId && userId !== 'default_user') {
    return [];
  }

  // Seed default demo data ONLY for unauthenticated guest users
  const defaultAssets: Asset[] = [
    {
      id: 1,
      userId,
      name: '24K Gold Minted Bar (99.99%)',
      assetType: 'PRECIOUS_METALS',
      purchaseDate: '2023-01-15',
      investedAmount: 250000,
      metalType: 'GOLD',
      categoryType: 'COIN_BAR',
      grams: 50.0,
      rateBought: 5000,
      deduction: 0.0,
      notes: 'LBMA Certified Bullion Bar',
    },
    {
      id: 2,
      userId,
      name: '22K Traditional Gold Jewellery',
      assetType: 'PRECIOUS_METALS',
      purchaseDate: '2022-05-10',
      investedAmount: 180000,
      metalType: 'GOLD',
      categoryType: 'JEWELRY',
      grams: 40.0,
      rateBought: 4500,
      deduction: 4.0,
      notes: 'Hallmarked Bridal Collection',
    },
    {
      id: 3,
      userId,
      name: 'Silver 1kg Refinery Ingot',
      assetType: 'PRECIOUS_METALS',
      purchaseDate: '2023-08-20',
      investedAmount: 70000,
      metalType: 'SILVER',
      categoryType: 'COIN_BAR',
      grams: 1000.0,
      rateBought: 70,
      deduction: 0.0,
      notes: '999 Pure Fine Silver Bar',
    },
    {
      id: 4,
      userId,
      name: 'NIFTY 50 Index Fund & Bluechips',
      assetType: 'EQUITY',
      purchaseDate: '2022-03-01',
      investedAmount: 500000,
      ticker: 'NIFTYBEES / Bluechip ETF',
      quantity: 2500,
      buyPrice: 200,
      currentPrice: 285,
      notes: 'SIP holdings and Core ETF',
    },
    {
      id: 5,
      userId,
      name: 'Prime Residential Villa',
      assetType: 'REAL_ESTATE',
      purchaseDate: '2020-06-15',
      investedAmount: 8500000,
      location: 'Bengaluru, Whitefield',
      areaSqFt: 2200,
      estimatedMarketValue: 12500000,
      monthlyRentalIncome: 45000,
      notes: 'Gated community villa with steady rental return',
    },
    {
      id: 6,
      userId,
      name: 'High-Yield Fixed Deposit',
      assetType: 'CASH_SAVINGS',
      purchaseDate: '2023-04-01',
      investedAmount: 1000000,
      bankName: 'HDFC Bank Senior FD',
      interestRatePct: 7.5,
      notes: 'Quarterly compounding payout',
    },
    {
      id: 7,
      userId,
      name: 'Employees Provident Fund (EPF)',
      assetType: 'PROVIDENT_FUND',
      purchaseDate: '2019-01-01',
      investedAmount: 600000,
      pfSchemeType: 'EPF',
      isActiveContribution: true,
      monthlyContribution: 25000,
      pfInterestRate: 8.25,
      notes: 'Tax-exempt long-term retirement corpus',
    },
  ];

  const currentRates = rates || await fetchCurrentRates();
  const calculated = defaultAssets.map((a) => ({
    ...a,
    metrics: calculateAssetMetrics(a, currentRates),
  }));

  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(defaultAssets));
  return calculated;
}

export async function createOrUpdateAsset(asset: Asset, userId = 'default_user', rates?: MetalRates): Promise<Asset> {
  const payload = {
    ...asset,
    userId: asset.userId || userId,
  };

  try {
    const url = asset.id ? `/api/assets/${asset.id}` : '/api/assets';
    const method = asset.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      const saved = await res.json();
      const currentRates = rates || await fetchCurrentRates();
      return {
        ...saved,
        metrics: calculateAssetMetrics(saved, currentRates),
      };
    }
  } catch {
    // Expected on static hosting
  }

  // Local storage fallback
  const primaryKey = `${LOCAL_STORAGE_KEY}_${userId}`;
  const legacyKey = `wealth_assets_${userId}`;
  const local = localStorage.getItem(primaryKey) || localStorage.getItem(legacyKey);
  let list: Asset[] = local ? JSON.parse(local) : [];

  let savedAsset: Asset;
  if (asset.id) {
    list = list.map((item) => (String(item.id) === String(asset.id) ? { ...asset } : item));
    savedAsset = asset;
  } else {
    savedAsset = {
      ...asset,
      id: Date.now(),
      userId,
    };
    list.unshift(savedAsset);
  }

  localStorage.setItem(primaryKey, JSON.stringify(list));
  localStorage.setItem(legacyKey, JSON.stringify(list));

  const currentRates = rates || await fetchCurrentRates();
  return {
    ...savedAsset,
    metrics: calculateAssetMetrics(savedAsset, currentRates),
  };
}

export async function deleteAsset(id: number | string, userId = 'default_user'): Promise<boolean> {
  try {
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch {
    // Expected on static hosting
  }

  const primaryKey = `${LOCAL_STORAGE_KEY}_${userId}`;
  const legacyKey = `wealth_assets_${userId}`;
  
  const raw = localStorage.getItem(primaryKey) || localStorage.getItem(legacyKey);
  if (raw) {
    const list: Asset[] = JSON.parse(raw);
    const filtered = list.filter((a) => String(a.id) !== String(id));
    localStorage.setItem(primaryKey, JSON.stringify(filtered));
    localStorage.setItem(legacyKey, JSON.stringify(filtered));
  }
  return true;
}

export async function getNetWorthSummary(
  userId = 'default_user', 
  assets?: Asset[], 
  rates?: MetalRates,
  liabilities?: Liability[]
): Promise<NetWorthSummary> {
  try {
    const res = await fetch(`/api/assets/summary?userId=${encodeURIComponent(userId)}`);
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      return await res.json();
    }
  } catch {
    // Fallback
  }

  const currentRates = rates || await fetchCurrentRates();
  const currentAssets = assets || await getAssets(userId, currentRates);
  const currentLiabilities = liabilities || await getLiabilities(userId);
  return computePortfolioSummary(currentAssets, currentRates, userId, currentLiabilities);
}

export async function syncLiveMarketRates(): Promise<MetalRates> {
  try {
    const res = await fetch('/api/portfolio/rates/sync', { method: 'POST' });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      const data = await res.json();
      return {
        gold: data.goldRate || data.gold,
        gold24k: data.gold24k || data.goldRate,
        gold22k: data.gold22k,
        silver: data.silverRate || data.silver,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        source: 'Live Bangalore Rates Sync',
      };
    }
  } catch {
    // Fallback
  }
  return await fetchCurrentRates();
}

export async function updateManualRates(rates: { gold: number; silver: number }): Promise<MetalRates> {
  try {
    const res = await fetch('/api/portfolio/rates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rates),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      const data = await res.json();
      return {
        gold: data.goldRate || data.gold,
        gold24k: data.gold24k || data.goldRate,
        gold22k: data.gold22k || data.gold * 0.916,
        silver: data.silverRate || data.silver,
        lastUpdated: new Date().toISOString(),
        source: 'Custom User Rate',
      };
    }
  } catch {
    // Fallback
  }
  return {
    gold: rates.gold,
    gold24k: rates.gold,
    gold22k: rates.gold * 0.916,
    silver: rates.silver,
    lastUpdated: new Date().toISOString(),
    source: 'Custom User Rate',
  };
}

