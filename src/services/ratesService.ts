import { HistoricalRateRecord, MetalRates } from '../types/portfolio';

let cachedHistoricalRates: HistoricalRateRecord[] = [];

const DEFAULT_FALLBACK_RATES: MetalRates = {
  gold: 15295,
  gold24k: 15295,
  gold22k: 14010,
  silver: 238,
  lastUpdated: new Date().toISOString(),
  source: 'Karnataka Bullion Market / Bengaluru Trade',
  state: 'Karnataka',
  city: 'Bengaluru',
};

export async function loadHistoricalRates(): Promise<HistoricalRateRecord[]> {
  if (cachedHistoricalRates.length > 0) return cachedHistoricalRates;
  try {
    const basePath = import.meta.env.BASE_URL || './';
    const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const response = await fetch(`${cleanBase}historical-rates.json?_t=${Date.now()}`);
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && (contentType.includes('json') || contentType.includes('text') || contentType === '')) {
      const data = await response.json();
      cachedHistoricalRates = data.rates || [];
      return cachedHistoricalRates;
    }
  } catch (err) {
    console.warn('Could not load historical rates:', err);
  }
  return [];
}

export async function getRateForDate(dateStr: string): Promise<{ gold24k?: number; gold22k?: number; silver?: number; matchedDate?: string } | null> {
  try {
    const rates = await loadHistoricalRates();
    if (!rates || rates.length === 0) return null;

    const targetDate = new Date(dateStr).getTime();
    if (isNaN(targetDate)) return null;

    // Find exact or closest preceding date
    let closest: HistoricalRateRecord | null = null;
    let minDiff = Infinity;

    for (const record of rates) {
      const recordTime = new Date(record.date).getTime();
      const diff = Math.abs(targetDate - recordTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = record;
      }
    }

    if (closest) {
      return {
        gold24k: closest.gold24k,
        gold22k: closest.gold22k,
        silver: closest.silver,
        matchedDate: closest.date,
      };
    }
  } catch (e) {
    console.warn('getRateForDate lookup error:', e);
  }
  return null;
}

function parseRatesPayload(data: any): MetalRates | null {
  if (!data) return null;
  const g24 = Number(data.gold_24kt || data.gold24k || data.gold || data.goldRate || 0);
  const g22 = Number(data.gold_22kt || data.gold22k || (g24 > 0 ? Math.round(g24 * 0.916) : 0));
  const sil = Number(data.silver || data.silverRate || 0);

  if (g24 > 0 || g22 > 0 || sil > 0) {
    return {
      gold: g24 || DEFAULT_FALLBACK_RATES.gold,
      gold24k: g24 || DEFAULT_FALLBACK_RATES.gold24k,
      gold22k: g22 || DEFAULT_FALLBACK_RATES.gold22k,
      silver: sil || DEFAULT_FALLBACK_RATES.silver,
      lastUpdated: data.lastUpdated || data.rate_updated_time || new Date().toISOString(),
      source: data.source || 'Karnataka Bullion Market / Bengaluru',
      state: data.state || 'Karnataka',
      city: data.city || 'Bengaluru',
      isManual: false,
    };
  }
  return null;
}

export async function fetchCurrentRates(forceFresh = false): Promise<MetalRates> {
  const timestamp = Date.now();
  const cacheOption: RequestInit = forceFresh ? { cache: 'no-store' } : {};

  // Tier 1: Fetch raw rates from GitHub repository (always up to date, CORS enabled globally)
  try {
    const rawGithubUrl = `https://raw.githubusercontent.com/shashankbc17/asset-tracker/main/rates.json?_t=${timestamp}`;
    const res = await fetch(rawGithubUrl, { ...cacheOption, headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const parsed = parseRatesPayload(data);
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn('GitHub raw rates fetch skipped:', err);
  }

  // Tier 2: Fetch via jsDelivr CDN
  try {
    const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/shashankbc17/asset-tracker@main/rates.json?_t=${timestamp}`;
    const res = await fetch(jsdelivrUrl, { ...cacheOption, headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const parsed = parseRatesPayload(data);
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn('jsDelivr CDN rates fetch skipped:', err);
  }

  // Tier 3: Fetch static rates.json deployed with the frontend build
  try {
    const basePath = import.meta.env.BASE_URL || './';
    const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const localUrl = `${cleanBase}rates.json?_t=${timestamp}`;
    const res = await fetch(localUrl, cacheOption);
    const ct = res.headers.get('content-type') || '';
    if (res.ok && (ct.includes('json') || ct.includes('text') || ct === '')) {
      const data = await res.json();
      const parsed = parseRatesPayload(data);
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn('Local rates.json fetch skipped:', err);
  }

  // Tier 4: Try Spring Boot Backend REST API (if running locally)
  try {
    const res = await fetch('/api/portfolio/rates');
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      const data = await res.json();
      const parsed = parseRatesPayload(data);
      if (parsed) return parsed;
    }
  } catch {
    // Expected on static hosting like GitHub Pages & Firebase
  }

  return DEFAULT_FALLBACK_RATES;
}
