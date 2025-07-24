import { config } from 'dotenv';
import { SupportedNetworks, AuraError } from '../types/index.js';

// Load environment variables
config();

export const SUPPORTED_NETWORKS: SupportedNetworks = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://cloudflare-eth.com',
    explorer: 'https://etherscan.io'
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com'
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io'
  }
};

export const DEFAULT_NETWORK = 'ethereum';

export function validateNetwork(network: string): void {
  if (!SUPPORTED_NETWORKS[network]) {
    const supportedList = Object.keys(SUPPORTED_NETWORKS).join(', ');
    throw new AuraError(
      `Unsupported network: ${network}. Supported networks: ${supportedList}`,
      'INVALID_NETWORK'
    );
  }
}

export function validateTransactionHash(hash: string): void {
  const hexPattern = /^0x[a-fA-F0-9]{64}$/;
  if (!hexPattern.test(hash)) {
    throw new AuraError(
      'Invalid transaction hash format. Expected 0x followed by 64 hex characters.',
      'INVALID_TX_HASH'
    );
  }
}
