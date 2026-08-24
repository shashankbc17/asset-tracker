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

export interface NetWorthSummary {
  userId: string;
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalPercentageGainLoss: number;
  allocations: AssetAllocation[];
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
