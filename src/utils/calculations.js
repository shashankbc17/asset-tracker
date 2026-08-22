/**
 * Pure calculation functions for precious metals portfolio.
 */

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

/**
 * Calculates financial metrics for an individual purchase record.
 * @param {Object} record - Portfolio item { grams, rateBought, deduction, date, metal }
 * @param {number} currentRate - Current market spot rate for this metal in ₹/g
 * @param {Date} [referenceDate=new Date()] - Date to evaluate CAGR against
 */
export function calculateRecordMetrics(record, currentRate, referenceDate = new Date()) {
  const grams = Number(record.grams) || 0;
  const rateBought = Number(record.rateBought) || 0;
  const deduction = Number(record.deduction) || 0;

  const invested = grams * rateBought;
  const grossValue = grams * (Number(currentRate) || 0);
  const liquidValue = grossValue - (grossValue * (deduction / 100));

  let totalReturnPct = 0;
  let isProfitable = true;
  if (invested > 0) {
    totalReturnPct = ((liquidValue - invested) / invested) * 100;
    isProfitable = totalReturnPct >= 0;
  }

  // Calculate CAGR
  let cagr = null;
  let cagrDisplay = "(< 1 yr)";
  
  if (record.date) {
    const purchaseDate = new Date(record.date);
    if (!isNaN(purchaseDate.getTime())) {
      const yearsHeld = (referenceDate.getTime() - purchaseDate.getTime()) / MS_PER_YEAR;
      if (yearsHeld >= 1 && invested > 0) {
        if (liquidValue > 0) {
          cagr = (Math.pow(liquidValue / invested, 1 / yearsHeld) - 1) * 100;
          const sign = cagr >= 0 ? '+' : '';
          cagrDisplay = `${sign}${cagr.toFixed(2)}% p.a.`;
        } else {
          cagr = -100;
          cagrDisplay = "-100.00% p.a.";
        }
      }
    }
  }

  return {
    invested,
    grossValue,
    liquidValue,
    totalReturnPct,
    isProfitable,
    cagr,
    cagrDisplay
  };
}

/**
 * Aggregates portfolio totals given list of items and current live rates.
 * @param {Array} portfolio - List of records
 * @param {number} rateGold - Gold price ₹/g
 * @param {number} rateSilver - Silver price ₹/g
 */
export function calculatePortfolioSummary(portfolio, rateGold, rateSilver) {
  let totalInvested = 0;
  let totalGross = 0;
  let totalLiquid = 0;

  portfolio.forEach((record) => {
    const currentRate = record.metal === 'Gold' ? rateGold : rateSilver;
    const metrics = calculateRecordMetrics(record, currentRate);
    totalInvested += metrics.invested;
    totalGross += metrics.grossValue;
    totalLiquid += metrics.liquidValue;
  });

  const netProfit = totalLiquid - totalInvested;
  const netReturnPct = totalInvested > 0 ? ((totalLiquid - totalInvested) / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalGross,
    totalLiquid,
    netProfit,
    netReturnPct,
    isNetProfitable: netProfit >= 0
  };
}
