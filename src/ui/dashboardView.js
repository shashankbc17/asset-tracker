/**
 * Dashboard View: Summary Cards Rendering.
 */
import { store } from '../state/store.js';
import { calculatePortfolioSummary } from '../utils/calculations.js';
import { formatINR, formatPercent } from '../utils/formatters.js';

export function initDashboard() {
  const investedEl = document.getElementById('total-invested');
  const currentValueEl = document.getElementById('current-value');
  const liquidValueEl = document.getElementById('liquid-value');
  const realProfitEl = document.getElementById('real-profit');
  const roiBadgeEl = document.getElementById('roi-badge');

  function render() {
    const portfolio = store.getPortfolio();
    const rates = store.getRates();
    const summary = calculatePortfolioSummary(portfolio, rates.gold, rates.silver);

    investedEl.innerText = formatINR(summary.totalInvested);
    currentValueEl.innerText = formatINR(summary.totalGross);
    liquidValueEl.innerText = formatINR(summary.totalLiquid);

    const sign = summary.netProfit >= 0 ? '+' : '';
    realProfitEl.innerText = `${sign}${formatINR(summary.netProfit)}`;

    if (summary.isNetProfitable) {
      realProfitEl.className = 'stat-value text-success';
    } else {
      realProfitEl.className = 'stat-value text-danger';
    }

    if (roiBadgeEl) {
      roiBadgeEl.innerText = `${formatPercent(summary.netReturnPct)} ROI`;
      roiBadgeEl.className = `stat-subtitle ${summary.isNetProfitable ? 'text-success' : 'text-danger'}`;
    }
  }

  store.subscribe(render);
  render();
}
