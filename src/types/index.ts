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
}

export class AuraError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuraError';
  }
}
