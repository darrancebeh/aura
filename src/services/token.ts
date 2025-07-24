import { ethers } from 'ethers';
import { RpcProvider } from '../providers/rpc.js';

/**
 * Token information cache entry
 */
interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
}

/**
 * Service for fetching token and contract information
 * Automatically detects token details from contract addresses
 */
export class TokenService {
  private tokenCache = new Map<string, TokenInfo>();
  private contractNameCache = new Map<string, string>();
  private provider: RpcProvider;

  // Standard ERC20 ABI for name, symbol, decimals
  private readonly erc20ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)'
  ];

  constructor(provider: RpcProvider) {
    this.provider = provider;
    this.loadWellKnownTokens();
  }

  /**
   * Load well-known token addresses to avoid RPC calls
   */
  private loadWellKnownTokens() {
    // Ethereum mainnet tokens
    const wellKnownTokens: TokenInfo[] = [
      { address: '0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA', name: 'Gala (V1)', symbol: 'GALA', decimals: 8 },
      { address: '0xdBf4d0c1b85BB7fEFDbF7C14f7D83CC4F3Bd79BB', name: 'Gala', symbol: 'GALA', decimals: 8 },
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether USD', symbol: 'USDT', decimals: 6 },
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', name: 'DAI Stablecoin', symbol: 'DAI', decimals: 18 },
      { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Wrapped Ether', symbol: 'WETH', decimals: 18 },
      { address: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b', name: 'Curve.fi Registry Exchange', symbol: 'CRV Exchange', decimals: 0 }
    ];

    for (const token of wellKnownTokens) {
      this.tokenCache.set(token.address.toLowerCase(), token);
    }
  }

  /**
   * Get token information for a contract address
   */
  async getTokenInfo(address: string): Promise<TokenInfo | null> {
    const lowerAddress = address.toLowerCase();
    
    // Check cache first
    if (this.tokenCache.has(lowerAddress)) {
      return this.tokenCache.get(lowerAddress)!;
    }

    try {
      // Try to call ERC20 functions
      const contract = new ethers.Contract(
        address, 
        this.erc20ABI, 
        this.provider['provider'] // Access the internal provider
      );

      const [name, symbol, decimals] = await Promise.all([
        contract.name().catch(() => ''),
        contract.symbol().catch(() => ''),
        contract.decimals().catch(() => 18)
      ]);

      if (name || symbol) {
        const tokenInfo: TokenInfo = {
          name: name || 'Unknown Token',
          symbol: symbol || 'UNK',
          decimals: Number(decimals),
          address
        };

        this.tokenCache.set(lowerAddress, tokenInfo);
        return tokenInfo;
      }
    } catch (error) {
      // Silently fail - not all contracts are tokens
    }

    return null;
  }

  /**
   * Get human-readable contract name
   */
  async getContractName(address: string): Promise<string | null> {
    const lowerAddress = address.toLowerCase();
    
    // Check cache first
    if (this.contractNameCache.has(lowerAddress)) {
      return this.contractNameCache.get(lowerAddress)!;
    }

    // Try token info first
    const tokenInfo = await this.getTokenInfo(address);
    if (tokenInfo) {
      const name = tokenInfo.name || tokenInfo.symbol;
      this.contractNameCache.set(lowerAddress, name);
      return name;
    }

    // Could integrate with services like Etherscan API here
    // For now, return null for unknown contracts
    return null;
  }

  /**
   * Format token amount with proper decimals and symbol
   */
  formatTokenAmount(value: bigint, tokenInfo: TokenInfo): string {
    const divisor = BigInt(10 ** tokenInfo.decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;
    
    if (remainder === 0n) {
      return `${quotient} ${tokenInfo.symbol}`;
    }
    
    const remainderStr = remainder.toString().padStart(tokenInfo.decimals, '0');
    const trimmedRemainder = remainderStr.replace(/0+$/, '');
    
    if (trimmedRemainder === '') {
      return `${quotient} ${tokenInfo.symbol}`;
    }
    
    return `${quotient}.${trimmedRemainder} ${tokenInfo.symbol}`;
  }

  /**
   * Check if an address is a known token contract
   */
  isKnownToken(address: string): boolean {
    return this.tokenCache.has(address.toLowerCase());
  }

  /**
   * Get cached token info without network call
   */
  getCachedTokenInfo(address: string): TokenInfo | null {
    return this.tokenCache.get(address.toLowerCase()) || null;
  }
}
