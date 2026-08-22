/**
 * Service to handle localStorage persistence and default sample data.
 */

const STORAGE_KEY = 'myMetalsCsvProject';
const RATES_KEY = 'myMetalsRates';

export const DEFAULT_PORTFOLIO = [
  { id: 101, metal: 'Gold', category: 'Coin/Bar', grams: 10, rateBought: 12499, date: '2025-12-23', deduction: 0 },
  { id: 102, metal: 'Silver', category: 'Coin/Bar', grams: 500, rateBought: 230, date: '2025-12-23', deduction: 0 },
  { id: 103, metal: 'Gold', category: 'Jewelry', grams: 80.2, rateBought: 11865, date: '2025-11-02', deduction: 4 },
  { id: 104, metal: 'Silver', category: 'Coin/Bar', grams: 2000, rateBought: 213, date: '2025-11-02', deduction: 0 },
  { id: 105, metal: 'Silver', category: 'Coin/Bar', grams: 1000, rateBought: 190, date: '2025-11-02', deduction: 0 },
  { id: 106, metal: 'Gold', category: 'Coin/Bar', grams: 1, rateBought: 10190, date: '2025-09-14', deduction: 0 },
  { id: 107, metal: 'Gold', category: 'Jewelry', grams: 41, rateBought: 8755, date: '2025-05-03', deduction: 4 }
];

export const DEFAULT_RATES = {
  gold: 14900,
  silver: 240,
  lastUpdated: null
};

export const StorageService = {
  loadPortfolio() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [...DEFAULT_PORTFOLIO];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [...DEFAULT_PORTFOLIO];
    } catch (e) {
      console.error('Failed to load portfolio from localStorage:', e);
      return [...DEFAULT_PORTFOLIO];
    }
  },

  savePortfolio(portfolio) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    } catch (e) {
      console.error('Failed to save portfolio to localStorage:', e);
    }
  },

  loadRates() {
    try {
      const data = localStorage.getItem(RATES_KEY);
      if (!data) return { ...DEFAULT_RATES };
      return JSON.parse(data);
    } catch (e) {
      return { ...DEFAULT_RATES };
    }
  },

  saveRates(rates) {
    try {
      localStorage.setItem(RATES_KEY, JSON.stringify(rates));
    } catch (e) {
      console.error('Failed to save rates to localStorage:', e);
    }
  }
};
