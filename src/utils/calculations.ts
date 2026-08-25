import { 
  Asset, 
  AssetMetrics, 
  MetalRates, 
  NetWorthSummary, 
  AssetAllocation, 
  AssetType,
  Liability,
  LiabilityMetrics,
  EmiScheduleItem
} from '../types/portfolio';

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

export function calculateLiabilityMetrics(liability: Liability, refDate: Date = new Date()): LiabilityMetrics {
  const principal = Math.max(0, liability.principalAmount || 0);
  const annualRate = Math.max(0, liability.annualInterestRate || 0);
  const tenure = Math.max(1, liability.tenureMonths || 36);
  const dueDay = liability.dueDayOfMonth || 7;
  
  const monthlyRate = (annualRate / 12) / 100;
  
  // Calculate Standard EMI if not explicitly provided
  let monthlyEmi = liability.monthlyEmi || 0;
  if (!monthlyEmi || monthlyEmi <= 0) {
    if (monthlyRate > 0) {
      monthlyEmi = Math.round(
        (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1)
      );
    } else {
      monthlyEmi = Math.round(principal / tenure);
    }
  }

  // Parse start and first EMI dates
  const firstEmiDate = liability.firstEmiDate ? new Date(liability.firstEmiDate) : new Date();
  
  let currentBalance = principal;
  let totalInterestPayable = 0;
  const schedule: EmiScheduleItem[] = [];

  for (let i = 1; i <= tenure; i++) {
    // Determine payment due date for month i
    const itemDueDate = new Date(firstEmiDate.getFullYear(), firstEmiDate.getMonth() + (i - 1), dueDay);
    // Set end of day for precise comparison
    const dueTimeEnd = new Date(itemDueDate.getFullYear(), itemDueDate.getMonth(), itemDueDate.getDate(), 23, 59, 59).getTime();
    
    const interest = currentBalance * monthlyRate;
    let principalPart = monthlyEmi - interest;
    
    if (i === tenure || principalPart > currentBalance) {
      principalPart = currentBalance;
    }
    
    currentBalance = Math.max(0, currentBalance - principalPart);
    totalInterestPayable += interest;

    const isPaid = dueTimeEnd <= refDate.getTime();

    schedule.push({
      monthIndex: i,
      dueDate: itemDueDate.toISOString().split('T')[0],
      emiAmount: monthlyEmi,
      principal: principalPart,
      interest: interest,
      outstandingPrincipal: currentBalance,
      isPaid,
    });
  }

  const paidItems = schedule.filter((item) => item.isPaid);
  const emisPaid = paidItems.length;
  const emisRemaining = Math.max(0, tenure - emisPaid);
  
  const principalPaid = paidItems.reduce((sum, item) => sum + item.principal, 0);
  const interestPaidSoFar = paidItems.reduce((sum, item) => sum + item.interest, 0);
  const principalOutstanding = emisPaid >= tenure ? 0 : (paidItems.length > 0 ? paidItems[paidItems.length - 1].outstandingPrincipal : principal);
  const remainingInterestPayable = Math.max(0, totalInterestPayable - interestPaidSoFar);
  const totalRepaymentAmount = principal + totalInterestPayable;
  const progressPct = principal > 0 ? Math.min(100, (principalPaid / principal) * 100) : 100;

  const nextUpcoming = schedule.find((item) => !item.isPaid);
  const nextEmiDate = nextUpcoming ? nextUpcoming.dueDate : 'Loan Completed';
  
  let daysUntilNextEmi = 0;
  if (nextUpcoming) {
    const nextDueObj = new Date(nextUpcoming.dueDate);
    const diffMs = nextDueObj.getTime() - refDate.getTime();
    daysUntilNextEmi = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return {
    elapsedMonths: emisPaid,
    emisPaid,
    emisRemaining,
    principalPaid,
    principalOutstanding,
    interestPaidSoFar,
    totalInterestPayable,
    remainingInterestPayable,
    totalRepaymentAmount,
    progressPct,
    nextEmiDate,
    daysUntilNextEmi,
    monthlyEmi,
    amortizationSchedule: schedule,
  };
}

export function simulatePrepayment(
  liability: Liability,
  prepaymentAmount: number,
  refDate: Date = new Date()
): {
  newTenureMonths: number;
  monthsSaved: number;
  interestSaved: number;
  newRemainingInterest: number;
} {
  const currentMetrics = liability.metrics || calculateLiabilityMetrics(liability, refDate);
  const currentBalance = currentMetrics.principalOutstanding;
  if (prepaymentAmount <= 0 || currentBalance <= 0) {
    return {
      newTenureMonths: currentMetrics.emisRemaining,
      monthsSaved: 0,
      interestSaved: 0,
      newRemainingInterest: currentMetrics.remainingInterestPayable,
    };
  }

  const effectiveBalance = Math.max(0, currentBalance - prepaymentAmount);
  if (effectiveBalance <= 0) {
    return {
      newTenureMonths: 0,
      monthsSaved: currentMetrics.emisRemaining,
      interestSaved: currentMetrics.remainingInterestPayable,
      newRemainingInterest: 0,
    };
  }

  const monthlyRate = ((liability.annualInterestRate || 9.99) / 12) / 100;
  const monthlyEmi = currentMetrics.monthlyEmi;

  let balance = effectiveBalance;
  let newInterestTotal = 0;
  let newMonthsCount = 0;

  while (balance > 0 && newMonthsCount < 600) {
    newMonthsCount++;
    const interest = balance * monthlyRate;
    let principal = monthlyEmi - interest;
    if (principal > balance || principal <= 0) {
      principal = balance;
    }
    balance = Math.max(0, balance - principal);
    newInterestTotal += interest;
  }

  const monthsSaved = Math.max(0, currentMetrics.emisRemaining - newMonthsCount);
  const interestSaved = Math.max(0, currentMetrics.remainingInterestPayable - newInterestTotal);

  return {
    newTenureMonths: newMonthsCount,
    monthsSaved,
    interestSaved,
    newRemainingInterest: newInterestTotal,
  };
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

export function computePortfolioSummary(
  assets: Asset[], 
  rates: MetalRates, 
  userId = 'default_user',
  liabilities: Liability[] = []
): NetWorthSummary {
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

  // Liabilities Calculations
  let totalLiabilitiesValue = 0;
  let totalMonthlyEmi = 0;
  let totalInterestPaidSoFar = 0;
  let totalFutureInterestPayable = 0;
  let activeLoansCount = 0;

  liabilities.forEach((liability) => {
    const metrics = liability.metrics || calculateLiabilityMetrics(liability);
    totalLiabilitiesValue += metrics.principalOutstanding;
    totalInterestPaidSoFar += metrics.interestPaidSoFar;
    totalFutureInterestPayable += metrics.remainingInterestPayable;
    if (metrics.emisRemaining > 0) {
      totalMonthlyEmi += metrics.monthlyEmi;
      activeLoansCount += 1;
    }
  });

  const netWorth = totalCurrentValue - totalLiabilitiesValue;
  const debtToAssetRatio = totalCurrentValue > 0 
    ? (totalLiabilitiesValue / totalCurrentValue) * 100 
    : (totalLiabilitiesValue > 0 ? 100 : 0);

  return {
    userId,
    totalInvested,
    totalCurrentValue,
    totalGainLoss,
    totalPercentageGainLoss,
    allocations,
    totalLiabilitiesValue,
    netWorth,
    totalMonthlyEmi,
    totalInterestPaidSoFar,
    totalFutureInterestPayable,
    debtToAssetRatio,
    activeLoansCount,
  };
}

