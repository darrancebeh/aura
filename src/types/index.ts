export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorer: string;
}

export interface SupportedNetworks {
  [key: string]: NetworkConfig;
}

export interface TransactionInfo {
  hash: string;
  blockNumber: number;
  from: string;
  to: string | null;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: number;
}

export interface InspectOptions {
  network: string;
  verbose?: boolean;
  depth?: number;
  contractsOnly?: boolean;
  eventsOnly?: boolean;
  json?: boolean;
}

// Trace-related types
export interface TraceCall {
  type: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasUsed: string;
  input: string;
  output: string;
  error?: string;
  revertReason?: string;
  calls?: TraceCall[];
}

export interface TraceLog {
  address: string;
  topics: string[];
  data: string;
}

export interface RawTrace {
  calls?: TraceCall[];
  logs?: TraceLog[];
  gasUsed: string;
}

// ABI and decoding types
export interface ABIFunction {
  name: string;
  type: string;
  inputs: ABIParameter[];
  outputs?: ABIParameter[];
  stateMutability?: string;
}

export interface ABIEvent {
  name: string;
  type: string;
  inputs: ABIParameter[];
  anonymous?: boolean;
}

export interface ABIParameter {
  name: string;
  type: string;
  indexed?: boolean; // Only for event parameters
}

export interface DecodedFunction {
  name: string;
  signature: string;
  inputs: { name: string; type: string; value: any }[];
}

export interface DecodedEvent {
  name: string;
  signature: string;
  inputs: { name: string; type: string; value: any; indexed: boolean }[];
}

// Parsed trace structures
export interface ParsedCall {
  type: 'call' | 'staticcall' | 'delegatecall' | 'create' | 'create2';
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasUsed: string;
  success: boolean;
  error?: string;
  revertReason?: string;
  depth: number;
  decodedFunction?: DecodedFunction;
  events: ParsedEvent[];
  subcalls: ParsedCall[];
}

export interface ParsedEvent {
  address: string;
  logIndex: number;
  decodedEvent?: DecodedEvent;
  rawTopics: string[];
  rawData: string;
}

export interface ParsedTrace {
  transaction: TransactionInfo;
  rootCall: ParsedCall;
  totalGasUsed: string;
  events: ParsedEvent[];
}

export class AuraError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuraError';
  }
}

// Export configuration types
export * from './config.js';
