import { Asset, AssetMetrics, MetalRates, NetWorthSummary, AssetAllocation, AssetType } from '../types/portfolio';

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toLocaleString('en-IN');
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatNumber(amount: number | undefined | null, decimals = 2): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return amount.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function calculateAssetMetrics(asset: Asset, rates: MetalRates, refDate: Date = new Date()): AssetMetrics {
  let invested = Math.max(0, asset.investedAmount || 0);
  let grossValue = invested;
  let currentValue = invested;
  let imagePath = '/images/gold-bar.jpg';
  let categoryBadge: string = asset.assetType;
  let keyMetricDisplay = '';

  const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date();
  const diffTime = Math.max(0, refDate.getTime() - purchaseDate.getTime());
  const daysHeld = diffTime / (1000 * 60 * 60 * 24);
  const yearsHeld = Math.max(0, daysHeld / 365.25);

  switch (asset.assetType) {
    case 'PRECIOUS_METALS': {
      const grams = asset.grams || 0;
      const rateBought = asset.rateBought || 0;
      const deduction = asset.deduction || 0;
      const metal = asset.metalType || 'GOLD';
      const cat = asset.categoryType || 'COIN_BAR';

      invested = grams * rateBought;
      const currentSpot = metal === 'GOLD' ? (rates.gold24k || rates.gold || 16408) : (rates.silver || 257);
      grossValue = grams * currentSpot;
      currentValue = grossValue - (grossValue * (deduction / 100));

      imagePath = metal === 'GOLD'
        ? (cat === 'COIN_BAR' ? '/images/gold-bar.jpg' : '/images/gold-jewelry.jpg')
        : (cat === 'COIN_BAR' ? '/images/silver-bar.jpg' : '/images/silver-jewelry.jpg');

      categoryBadge = `${metal === 'GOLD' ? 'Gold' : 'Silver'} • ${cat === 'COIN_BAR' ? 'Coin/Bar' : 'Jewelry'}`;
      keyMetricDisplay = `${formatNumber(grams, 2)} g @ ₹${formatNumber(rateBought, 0)}/g`;
      break;
    }

    case 'EQUITY': {
      const qty = asset.quantity || 0;
      const buyPrice = asset.buyPrice || 0;
      const curPrice = (asset.currentPrice && asset.currentPrice > 0) ? asset.currentPrice : buyPrice;

      invested = qty * buyPrice;
      grossValue = qty * curPrice;
      currentValue = grossValue;

      imagePath = '/images/equity.jpg';
      categoryBadge = asset.ticker || 'Stock/ETF';
      keyMetricDisplay = `${formatNumber(qty, 0)} Units @ ₹${formatNumber(buyPrice, 0)} (CMP: ₹${formatNumber(curPrice, 0)})`;
      break;
    }

    case 'REAL_ESTATE': {
      invested = asset.investedAmount || 0;
      const appraisal = (asset.estimatedMarketValue && asset.estimatedMarketValue > 0)
        ? asset.estimatedMarketValue
        : invested;
      grossValue = appraisal;
      currentValue = appraisal;

      imagePath = '/images/real-estate.jpg';
      categoryBadge = asset.location || 'Property';
      const areaStr = (asset.areaSqFt && asset.areaSqFt > 0) ? `${formatNumber(asset.areaSqFt, 0)} sq ft` : 'Real Estate';
      const rentStr = (asset.monthlyRentalIncome && asset.monthlyRentalIncome > 0) ? ` • Rent: ${formatINR(asset.monthlyRentalIncome)}/mo` : '';
      keyMetricDisplay = areaStr + rentStr;
      break;
    }

    case 'CASH_SAVINGS': {
      invested = asset.investedAmount || 0;
      const rate = asset.interestRatePct || 0;
      const accruedInterest = (rate > 0 && yearsHeld > 0) ? invested * (rate / 100) * yearsHeld : 0;
      grossValue = invested + accruedInterest;
      currentValue = grossValue;

      imagePath = '/images/cash.jpg';
      categoryBadge = asset.bankName || 'Cash / FD';
      keyMetricDisplay = rate > 0 ? `${formatNumber(rate, 2)}% p.a. Interest` : 'Liquid Balance';
      break;
    }

    case 'PROVIDENT_FUND': {
      const initialBalance = asset.investedAmount || 0;
      const isActive = asset.isActiveContribution !== false;
      const monthlyContrib = (isActive && asset.monthlyContribution) ? asset.monthlyContribution : 0;
      const pfRate = (asset.pfInterestRate && asset.pfInterestRate > 0) ? asset.pfInterestRate : 8.25;

      const elapsedMonths = yearsHeld * 12.0;
      const totalContributions = initialBalance + (monthlyContrib * elapsedMonths);
      invested = totalContributions;

      const interestOnBase = yearsHeld > 0 ? initialBalance * (Math.pow(1.0 + (pfRate / 100.0), yearsHeld) - 1.0) : 0;
      const interestOnContrib = (monthlyContrib > 0 && yearsHeld > 0) ? (monthlyContrib * elapsedMonths) * (pfRate / 200.0) * yearsHeld : 0;

      grossValue = totalContributions + interestOnBase + interestOnContrib;
      currentValue = grossValue;

      imagePath = '/images/pf.jpg';
      const scheme = asset.pfSchemeType || 'EPF';
      const statusStr = isActive ? 'Active' : 'Dormant';
      categoryBadge = `${scheme} • ${statusStr}`;
      keyMetricDisplay = isActive
        ? `₹${formatNumber(monthlyContrib, 0)}/mo • ${formatNumber(pfRate, 2)}% Govt Rate`
        : `Dormant • ${formatNumber(pfRate, 2)}% Govt Rate`;
      break;
    }
  }

  const profitLoss = currentValue - invested;
  const returnPct = invested > 0 ? (profitLoss / invested) * 100 : 0;
  const isProfitable = profitLoss >= 0;

  let cagr: number | null = null;
  let cagrDisplay = '(< 1 yr)';
  if (yearsHeld >= 1.0 && invested > 0) {
    if (currentValue > 0) {
      cagr = (Math.pow(currentValue / invested, 1.0 / yearsHeld) - 1.0) * 100.0;
      const sign = cagr >= 0 ? '+' : '';
      cagrDisplay = `${sign}${formatNumber(cagr, 2)}% p.a.`;
    } else {
      cagr = -100.0;
      cagrDisplay = '-100.00% p.a.';
    }
  }

  return {
    investedAmount: invested,
    grossValue,
    currentValue,
    profitLoss,
    returnPct,
    isProfitable,
    cagr,
    cagrDisplay,
    imagePath,
    categoryBadge,
    keyMetricDisplay,
  };
}

export function computePortfolioSummary(assets: Asset[], rates: MetalRates, userId = 'default_user'): NetWorthSummary {
  let totalInvested = 0;
  let totalCurrentValue = 0;

  const allocationMap: Record<AssetType, { invested: number; current: number; count: number }> = {
    PRECIOUS_METALS: { invested: 0, current: 0, count: 0 },
    EQUITY: { invested: 0, current: 0, count: 0 },
    REAL_ESTATE: { invested: 0, current: 0, count: 0 },
    CASH_SAVINGS: { invested: 0, current: 0, count: 0 },
    PROVIDENT_FUND: { invested: 0, current: 0, count: 0 },
  };

  assets.forEach((asset) => {
    const metrics = asset.metrics || calculateAssetMetrics(asset, rates);
    totalInvested += metrics.investedAmount;
    totalCurrentValue += metrics.currentValue;

    if (allocationMap[asset.assetType]) {
      allocationMap[asset.assetType].invested += metrics.investedAmount;
      allocationMap[asset.assetType].current += metrics.currentValue;
      allocationMap[asset.assetType].count += 1;
    }
  });

  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalPercentageGainLoss = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  const allocations: AssetAllocation[] = Object.entries(allocationMap).map(([type, data]) => ({
    assetType: type as AssetType,
    investedValue: data.invested,
    currentValue: data.current,
    percentageOfPortfolio: totalCurrentValue > 0 ? (data.current / totalCurrentValue) * 100 : 0,
    assetCount: data.count,
  }));

  return {
    userId,
    totalInvested,
    totalCurrentValue,
    totalGainLoss,
    totalPercentageGainLoss,
    allocations,
  };
}
