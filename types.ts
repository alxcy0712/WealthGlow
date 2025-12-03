export enum RiskLevel {
  R1 = 'R1', // Conservative
  R2 = 'R2', // Cautious
  R3 = 'R3', // Balanced
  R4 = 'R4', // Aggressive
  R5 = 'R5', // Speculative
}

export interface Asset {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  amount: number;
  expectedReturnRate: number; // Percentage, e.g., 5.5 for 5.5%
}

export interface SimulationYear {
  year: number;
  totalValue: number;
  totalWithdrawn: number;
  breakdown: { [assetName: string]: number };
}

export interface OptimizationResult {
  analysis: string;
  suggestedPortfolio: Asset[];
}

export type Language = 'en' | 'zh';
export type Currency = 'USD' | 'CNY';
