import { HistoricalRateRecord, MetalRates } from '../types/portfolio';

let cachedHistoricalRates: HistoricalRateRecord[] = [];

const DEFAULT_FALLBACK_RATES: MetalRates = {
  gold: 16408,
  gold24k: 16408,
  gold22k: 15030,
  silver: 257,
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
    const response = await fetch(`${cleanBase}historical-rates.json`);
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

export async function fetchCurrentRates(): Promise<MetalRates> {
  // 1. Try Spring Boot Backend REST API
  try {
    const res = await fetch('/api/portfolio/rates');
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      const data = await res.json();
      return {
        gold: data.goldRate || data.gold || DEFAULT_FALLBACK_RATES.gold,
        gold24k: data.gold24k || data.goldRate || DEFAULT_FALLBACK_RATES.gold24k,
        gold22k: data.gold22k || DEFAULT_FALLBACK_RATES.gold22k,
        silver: data.silverRate || data.silver || DEFAULT_FALLBACK_RATES.silver,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        source: data.source || 'Bangalore Bullion Market',
      };
    }
  } catch {
    // Expected on static hosting like GitHub Pages
  }

  // 2. Try static rates.json via relative base path
  try {
    const basePath = import.meta.env.BASE_URL || './';
    const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const res = await fetch(`${cleanBase}rates.json`);
    const ct = res.headers.get('content-type') || '';
    if (res.ok && (ct.includes('json') || ct.includes('text') || ct === '')) {
      const data = await res.json();
      if (data && (data.gold_24kt || data.gold24k || data.gold)) {
        return {
          gold: data.gold_24kt || data.gold24k || data.gold || DEFAULT_FALLBACK_RATES.gold,
          gold24k: data.gold_24kt || data.gold24k || data.gold || DEFAULT_FALLBACK_RATES.gold24k,
          gold22k: data.gold_22kt || data.gold22k || DEFAULT_FALLBACK_RATES.gold22k,
          silver: data.silver || data.silverRate || DEFAULT_FALLBACK_RATES.silver,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          source: data.source || DEFAULT_FALLBACK_RATES.source,
          state: data.state || 'Karnataka',
          city: data.city || 'Bengaluru',
        };
      }
    }
  } catch (err) {
    console.warn('rates.json fallback warning:', err);
  }

  return DEFAULT_FALLBACK_RATES;
}
