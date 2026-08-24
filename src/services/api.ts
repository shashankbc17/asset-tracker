import { Asset, MetalRates, NetWorthSummary } from '../types/portfolio';
import { calculateAssetMetrics, computePortfolioSummary } from '../utils/calculations';
import { fetchCurrentRates } from './ratesService';

const LOCAL_STORAGE_KEY = 'precious_metals_assets_v3';

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

  // Fallback to localStorage
  const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  if (local) {
    try {
      const parsed: Asset[] = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
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

  // Seed default data if empty
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

export async function createOrUpdateAsset(asset: Asset, userId = 'default_user'): Promise<Asset> {
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
      return await res.json();
    }
  } catch {
    // Expected on static hosting
  }

  // Local storage fallback
  const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  let list: Asset[] = local ? JSON.parse(local) : [];

  if (asset.id) {
    list = list.map((item) => (item.id === asset.id ? { ...asset } : item));
  } else {
    const newAsset = {
      ...asset,
      id: Date.now(),
      userId,
    };
    list.unshift(newAsset);
  }

  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(list));
  return asset;
}

export async function deleteAsset(id: number, userId = 'default_user'): Promise<boolean> {
  try {
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch {
    // Expected on static hosting
  }

  const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  if (local) {
    const list: Asset[] = JSON.parse(local);
    const filtered = list.filter((a) => a.id !== id);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(filtered));
  }
  return true;
}

export async function getNetWorthSummary(userId = 'default_user', assets?: Asset[], rates?: MetalRates): Promise<NetWorthSummary> {
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
  return computePortfolioSummary(currentAssets, currentRates, userId);
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
