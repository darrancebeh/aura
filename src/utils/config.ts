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

/**
 * Check if the configured RPC provider supports advanced trace features
 */
export function supportsAdvancedTrace(network: string): boolean {
  const config = SUPPORTED_NETWORKS[network];
  if (!config) return false;
  
  // Tenderly has excellent trace support
  if (config.rpcUrl.includes('tenderly.co')) return true;
  
  // Alchemy has limited trace support (pay-as-you-go only)
  if (config.rpcUrl.includes('alchemy.com')) return false;
  
  // Assume other providers need to be tested
  return false;
}

/**
 * Get provider-specific recommendations
 */
export function getProviderRecommendation(network: string): string {
  const config = SUPPORTED_NETWORKS[network];
  if (!config) return '';
  
  if (config.rpcUrl.includes('tenderly.co')) {
    return 'Connected to Tenderly RPC';
  }
  
  if (config.rpcUrl.includes('alchemy.com')) {
    return 'Connected to Alchemy RPC';
  }
  
  if (config.rpcUrl.includes('infura.io')) {
    return 'Connected to Infura RPC';
  }
  
  return 'Connected to custom RPC provider';
}

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
