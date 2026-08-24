import { HistoricalRateRecord, MetalRates } from '../types/portfolio';

let cachedHistoricalRates: HistoricalRateRecord[] = [];

export async function loadHistoricalRates(): Promise<HistoricalRateRecord[]> {
  if (cachedHistoricalRates.length > 0) return cachedHistoricalRates;
  try {
    const response = await fetch('/historical-rates.json');
    if (response.ok) {
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
  return null;
}

export async function fetchCurrentRates(): Promise<MetalRates> {
  try {
    const res = await fetch('/api/portfolio/rates');
    if (res.ok) {
      const data = await res.json();
      return {
        gold: data.goldRate || data.gold || 16408,
        gold24k: data.gold24k || data.goldRate || 16408,
        gold22k: data.gold22k || 15030,
        silver: data.silverRate || data.silver || 257,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        source: data.source || 'Bangalore Bullion Market',
      };
    }
  } catch (e) {
    console.warn('Backend rates API unavailable, loading rates.json fallback:', e);
  }

  // Fallback to local rates.json
  try {
    const res = await fetch('/rates.json');
    if (res.ok) {
      const data = await res.json();
      return {
        gold: data.gold_24kt || 16408,
        gold24k: data.gold_24kt || 16408,
        gold22k: data.gold_22kt || 15030,
        silver: data.silver || 257,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        source: data.source || 'Karnataka Bullion Market / Lalithaa Showroom Trade',
        state: data.state || 'Karnataka',
        city: data.city || 'Bengaluru',
      };
    }
  } catch (err) {
    console.warn('Fallback rates error:', err);
  }

  return {
    gold: 16408,
    gold24k: 16408,
    gold22k: 15030,
    silver: 257,
    lastUpdated: new Date().toISOString(),
    source: 'Karnataka Bullion Market',
  };
}
