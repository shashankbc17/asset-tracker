/**
 * Central State Store with Pub/Sub subscriptions.
 */
import { StorageService } from '../services/storageService.js';
import { calculateRecordMetrics } from '../utils/calculations.js';

class PortfolioStore {
  constructor() {
    this.portfolio = StorageService.loadPortfolio();
    const loadedRates = StorageService.loadRates();
    this.rates = {
      gold: loadedRates.gold || 14900,
      silver: loadedRates.silver || 240,
      lastUpdated: loadedRates.lastUpdated || null
    };

    this.filters = {
      metal: 'ALL', // 'ALL' | 'Gold' | 'Silver'
      category: 'ALL' // 'ALL' | 'Jewelry' | 'Coin/Bar'
    };

    this.sortBy = 'manual'; // 'manual' | 'date-desc' | 'date-asc' | 'return-desc' | 'value-desc'
    this.editingId = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this);
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    });
  }

  getPortfolio() {
    return this.portfolio;
  }

  getRates() {
    return this.rates;
  }

  getEditingRecord() {
    if (!this.editingId) return null;
    return this.portfolio.find((r) => r.id === this.editingId) || null;
  }

  getFilteredAndSortedPortfolio() {
    let result = [...this.portfolio];

    // Metal filter
    if (this.filters.metal !== 'ALL') {
      result = result.filter((r) => r.metal.toLowerCase() === this.filters.metal.toLowerCase());
    }

    // Category filter
    if (this.filters.category !== 'ALL') {
      result = result.filter((r) => r.category.toLowerCase() === this.filters.category.toLowerCase());
    }

    // Sorting
    if (this.sortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (this.sortBy === 'date-asc') {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (this.sortBy === 'return-desc') {
      result.sort((a, b) => {
        const rateA = a.metal === 'Gold' ? this.rates.gold : this.rates.silver;
        const rateB = b.metal === 'Gold' ? this.rates.gold : this.rates.silver;
        const retA = calculateRecordMetrics(a, rateA).totalReturnPct;
        const retB = calculateRecordMetrics(b, rateB).totalReturnPct;
        return retB - retA;
      });
    } else if (this.sortBy === 'value-desc') {
      result.sort((a, b) => {
        const rateA = a.metal === 'Gold' ? this.rates.gold : this.rates.silver;
        const rateB = b.metal === 'Gold' ? this.rates.gold : this.rates.silver;
        const valA = calculateRecordMetrics(a, rateA).liquidValue;
        const valB = calculateRecordMetrics(b, rateB).liquidValue;
        return valB - valA;
      });
    }

    return result;
  }

  // Mutations
  addRecord(record) {
    const newRecord = {
      ...record,
      id: Date.now() + Math.floor(Math.random() * 1000)
    };
    this.portfolio.unshift(newRecord);
    this.save();
    this.notify();
    return newRecord;
  }

  updateRecord(id, updatedFields) {
    const index = this.portfolio.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.portfolio[index] = { ...this.portfolio[index], ...updatedFields };
      this.editingId = null;
      this.save();
      this.notify();
    }
  }

  deleteRecord(id) {
    this.portfolio = this.portfolio.filter((r) => r.id !== id);
    if (this.editingId === id) {
      this.editingId = null;
    }
    this.save();
    this.notify();
  }

  bulkAppend(newRecords) {
    if (!Array.isArray(newRecords) || newRecords.length === 0) return;
    this.portfolio.push(...newRecords);
    this.save();
    this.notify();
  }

  reorder(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const [movedItem] = this.portfolio.splice(fromIndex, 1);
    this.portfolio.splice(toIndex, 0, movedItem);
    this.save();
    this.notify();
  }

  setRates(rates) {
    this.rates = { ...this.rates, ...rates };
    StorageService.saveRates(this.rates);
    this.notify();
  }

  setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
    this.notify();
  }

  setSort(sortBy) {
    this.sortBy = sortBy;
    this.notify();
  }

  setEditingId(id) {
    this.editingId = id;
    this.notify();
  }

  save() {
    StorageService.savePortfolio(this.portfolio);
  }
}

export const store = new PortfolioStore();
