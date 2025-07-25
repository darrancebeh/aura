/**
 * DeFi-specific type definitions for protocol analysis and detection
 */

/**
 * Configuration options for DeFi analysis
 */
export interface DefiAnalysisOptions {
  enabled: boolean;
  protocols?: string[];
  detailed?: boolean;
}

/**
 * Main DeFi analysis result containing all detected interactions
 */
export interface DefiAnalysis {
  detected: boolean;
  protocol?: string;
  version?: string;
  interactions: DefiInteraction[];
  summary: string;
  confidence?: number;
}

/**
 * Individual DeFi protocol interaction
 */
export interface DefiInteraction {
  type: DefiInteractionType;
  protocol: string;
  version?: string;
  description: string;
  success: boolean;
  details: Record<string, any>;
  contractAddress: string;
  functionName?: string;
  confidence: number;
}

/**
 * Types of DeFi interactions we can detect
 */
export type DefiInteractionType = 
  | 'swap' 
  | 'liquidity_add' 
  | 'liquidity_remove'
  | 'lending' 
  | 'borrowing'
  | 'staking' 
  | 'unstaking'
  | 'yield_farming'
  | 'flash_loan'
  | 'unknown';

/**
 * Supported DeFi protocols
 */
export enum SupportedProtocols {
  UNISWAP_V2 = 'uniswap-v2',
  UNISWAP_V3 = 'uniswap-v3',
  SUSHISWAP = 'sushiswap',
  PANCAKESWAP = 'pancakeswap',
  CURVE = 'curve',
  BALANCER = 'balancer',
  AAVE = 'aave',
  COMPOUND = 'compound'
}

/**
 * Swap-specific analysis details
 */
export interface SwapDetails {
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  inputAmount: string;
  outputAmount: string;
  exchangeRate: string;
  route?: string[];
  slippage?: string;
  priceImpact?: string;
  fees?: FeeInfo[];
}

/**
 * Token information for DeFi analysis
 */
export interface TokenInfo {
  address: string;
  symbol: string;
  name?: string;
  decimals: number;
  amount: string;
  valueUSD?: string;
}

/**
 * Fee information
 */
export interface FeeInfo {
  type: 'protocol' | 'gas' | 'slippage' | 'lp';
  amount: string;
  token: string;
  percentage?: string;
}

/**
 * Liquidity operation details
 */
export interface LiquidityDetails {
  pool: PoolInfo;
  tokens: TokenInfo[];
  operation: 'add' | 'remove';
  lpTokens?: {
    amount: string;
    address: string;
  };
  share?: string;
}

/**
 * Pool information
 */
export interface PoolInfo {
  address: string;
  tokens: string[];
  fee?: string;
  type: 'constant_product' | 'stable' | 'concentrated';
  version?: string;
}
