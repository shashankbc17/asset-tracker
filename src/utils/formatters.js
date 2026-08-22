/**
 * Formatting helpers for currency, dates, and numbers.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const inrDecimalFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
});

export function formatINR(value, includeDecimals = false) {
  const num = Number(value) || 0;
  return includeDecimals ? inrDecimalFormatter.format(num) : inrFormatter.format(num);
}

export function formatSignedINR(value, includeDecimals = false) {
  const num = Number(value) || 0;
  const sign = num >= 0 ? '+' : '';
  return `${sign}${formatINR(num, includeDecimals)}`;
}

export function formatPercent(value, decimals = 2) {
  const num = Number(value) || 0;
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toISOString().split('T')[0];
}

export function formatGrams(grams) {
  const num = Number(grams) || 0;
  return `${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}g`;
}
