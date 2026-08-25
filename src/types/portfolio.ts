export type AssetType = 
  | 'PRECIOUS_METALS' 
  | 'EQUITY' 
  | 'REAL_ESTATE' 
  | 'CASH_SAVINGS' 
  | 'PROVIDENT_FUND';

export type MetalType = 'GOLD' | 'SILVER';

export type CategoryType = 'JEWELRY' | 'COIN_BAR';

export interface Asset {
  id?: number;
  userId?: string;
  name: string;
  assetType: AssetType;
  purchaseDate: string;
  investedAmount: number;
  notes?: string;
  displayOrder?: number;

  // Precious Metals
  metalType?: MetalType;
  categoryType?: CategoryType;
  grams?: number;
  rateBought?: number;
  deduction?: number;

  // Equities & Stocks
  ticker?: string;
  quantity?: number;
  buyPrice?: number;
  currentPrice?: number;

  // Real Estate
  location?: string;
  areaSqFt?: number;
  estimatedMarketValue?: number;
  monthlyRentalIncome?: number;

  // Cash / FDs / Savings
  bankName?: string;
  interestRatePct?: number;
  maturityDate?: string;

  // Provident Fund (EPF / PPF / VPF)
  pfSchemeType?: string;
  uanOrAccountId?: string;
  isActiveContribution?: boolean;
  monthlyContribution?: number;
  pfInterestRate?: number;

  // UI Computed metrics
  metrics?: AssetMetrics;
}

export interface AssetMetrics {
  investedAmount: number;
  grossValue: number;
  currentValue: number;
  profitLoss: number;
  returnPct: number;
  isProfitable: boolean;
  cagr?: number | null;
  cagrDisplay?: string;
  imagePath?: string;
  categoryBadge?: string;
  keyMetricDisplay?: string;
}

export interface AssetAllocation {
  assetType: AssetType;
  investedValue: number;
  currentValue: number;
  percentageOfPortfolio: number;
  assetCount: number;
}

export type LoanType = 
  | 'PERSONAL' 
  | 'HOME' 
  | 'GOLD' 
  | 'VEHICLE' 
  | 'EDUCATION' 
  | 'BUSINESS' 
  | 'OTHER';

export interface PrepaymentRecord {
  id?: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface EmiScheduleItem {
  monthIndex: number;
  dueDate: string;
  emiAmount: number;
  principal: number;
  interest: number;
  outstandingPrincipal: number;
  isPaid: boolean;
}

export interface LiabilityMetrics {
  elapsedMonths: number;
  emisPaid: number;
  emisRemaining: number;
  principalPaid: number;
  principalOutstanding: number;
  interestPaidSoFar: number;
  totalInterestPayable: number;
  remainingInterestPayable: number;
  totalRepaymentAmount: number;
  progressPct: number;
  nextEmiDate: string;
  daysUntilNextEmi: number;
  monthlyEmi: number;
  amortizationSchedule: EmiScheduleItem[];
}

export interface Liability {
  id?: number | string;
  userId?: string;
  name: string;
  lender: string;
  accountNumber?: string;
  loanType: LoanType;
  sanctionDate: string;
  firstEmiDate: string;
  dueDayOfMonth: number;
  principalAmount: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyEmi?: number;
  processingFee?: number;
  linkedAssetId?: number;
  notes?: string;
  prepayments?: PrepaymentRecord[];
  metrics?: LiabilityMetrics;
}

export interface NetWorthSummary {
  userId: string;
  totalInvested: number;
  totalCurrentValue: number; // Gross asset value
  totalGainLoss: number;
  totalPercentageGainLoss: number;
  allocations: AssetAllocation[];
  
  // Liabilities & True Net Worth
  totalLiabilitiesValue: number; // Total outstanding debt
  netWorth: number; // Total Assets - Total Liabilities
  totalMonthlyEmi: number;
  totalInterestPaidSoFar: number;
  totalFutureInterestPayable: number;
  debtToAssetRatio: number; // (Total Debt / Total Assets) * 100
  activeLoansCount: number;
}

export interface MetalRates {
  gold: number;
  gold24k?: number;
  gold22k?: number;
  silver: number;
  lastUpdated?: string;
  source?: string;
  state?: string;
  city?: string;
}

export interface HistoricalRateRecord {
  date: string;
  gold22k: number;
  gold24k: number;
  silver: number;
}

