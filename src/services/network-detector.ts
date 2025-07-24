import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS } from '../utils/config.js';
import { ConfigError } from '../types/config.js';

/**
 * Network detection and RPC provider intelligence service
 * Provides automatic provider testing, capability detection, and smart recommendations
 */

export interface ProviderCapabilities {
  traceSupport: boolean;
  archiveSupport: boolean;
  rateLimit?: number;
  latency?: number;
  reliability: 'high' | 'medium' | 'low';
}

export interface ConnectionTestResult {
  connected: boolean;
  blockNumber?: number;
  chainId?: number;
  latency?: number;
  error?: string;
  capabilities?: ProviderCapabilities;
  provider?: ProviderInfo;
}

export interface ProviderInfo {
  name: string;
  type: 'tenderly' | 'alchemy' | 'infura' | 'public' | 'custom';
  traceSupport: boolean;
  recommendedFor: string[];
  setupUrl?: string;
}

export interface NetworkRecommendation {
  network: string;
  providers: ProviderRecommendation[];
}

export interface ProviderRecommendation {
  provider: ProviderInfo;
  url: string;
  reason: string;
  confidence: number;
}

export class NetworkDetector {
  
  /**
   * Test RPC connection and detect capabilities
   */
  static async testRpcConnection(rpcUrl: string, network?: string): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Test basic connectivity
      const [blockNumber, chainId] = await Promise.all([
        provider.getBlockNumber(),
        provider.getNetwork().then(n => Number(n.chainId))
      ]);
      
      const latency = Date.now() - startTime;
      
      // Detect provider info
      const providerInfo = this.detectProvider(rpcUrl);
      
      // Test capabilities
      const capabilities = await this.testProviderCapabilities(provider, providerInfo);
      
      // Validate chain ID if network specified
      if (network && SUPPORTED_NETWORKS[network]) {
        const expectedChainId = SUPPORTED_NETWORKS[network].chainId;
        if (chainId !== expectedChainId) {
          return {
            connected: false,
            error: `Chain ID mismatch: expected ${expectedChainId} for ${network}, got ${chainId}`
          };
        }
      }
      
      return {
        connected: true,
        blockNumber,
        chainId,
        latency,
        capabilities,
        provider: providerInfo
      };
      
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown connection error',
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Detect RPC provider from URL
   */
  static detectProvider(rpcUrl: string): ProviderInfo {
    const url = rpcUrl.toLowerCase();
    
    if (url.includes('tenderly.co')) {
      return {
        name: 'Tenderly',
        type: 'tenderly',
        traceSupport: true,
        recommendedFor: ['development', 'debugging', 'trace analysis'],
        setupUrl: 'https://tenderly.co'
      };
    }
    
    if (url.includes('alchemy.com')) {
      return {
        name: 'Alchemy',
        type: 'alchemy',
        traceSupport: false, // Limited on free tier
        recommendedFor: ['production', 'high-volume'],
        setupUrl: 'https://alchemy.com'
      };
    }
    
    if (url.includes('infura.io')) {
      return {
        name: 'Infura',
        type: 'infura',
        traceSupport: false, // Requires add-on
        recommendedFor: ['production', 'reliability'],
        setupUrl: 'https://infura.io'
      };
    }
    
    if (url.includes('cloudflare-eth.com') || url.includes('polygon-rpc.com') || url.includes('arbitrum.io')) {
      return {
        name: 'Public RPC',
        type: 'public',
        traceSupport: false,
        recommendedFor: ['testing', 'getting started']
      };
    }
    
    return {
      name: 'Custom Provider',
      type: 'custom',
      traceSupport: false,
      recommendedFor: ['custom setup']
    };
  }

  /**
   * Test provider capabilities
   */
  static async testProviderCapabilities(provider: ethers.JsonRpcProvider, providerInfo: ProviderInfo): Promise<ProviderCapabilities> {
    const capabilities: ProviderCapabilities = {
      traceSupport: false,
      archiveSupport: false,
      reliability: 'medium'
    };

    try {
      // Test trace support with a minimal call
      await provider.send('debug_traceTransaction', [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        { tracer: 'callTracer' }
      ]);
      capabilities.traceSupport = true;
    } catch (error: any) {
      // Expected to fail for non-existent tx, but we can detect if method exists
      if (error.code !== -32601) { // Method not found
        capabilities.traceSupport = true;
      }
    }

    // Test archive support by checking very old block
    try {
      await provider.getBalance('0x0000000000000000000000000000000000000000', 1);
      capabilities.archiveSupport = true;
    } catch {
      capabilities.archiveSupport = false;
    }

    // Set reliability based on provider type
    switch (providerInfo.type) {
      case 'tenderly':
      case 'alchemy':
      case 'infura':
        capabilities.reliability = 'high';
        break;
      case 'public':
        capabilities.reliability = 'low';
        break;
      default:
        capabilities.reliability = 'medium';
    }

    return capabilities;
  }

  /**
   * Get recommended providers for a network
   */
  static getProviderRecommendations(network: string): NetworkRecommendation {
    const providers: ProviderRecommendation[] = [];

    // Tenderly (best for development and debugging)
    providers.push({
      provider: {
        name: 'Tenderly',
        type: 'tenderly',
        traceSupport: true,
        recommendedFor: ['development', 'debugging', 'trace analysis'],
        setupUrl: 'https://tenderly.co'
      },
      url: `https://${network}.gateway.tenderly.co/YOUR_ACCESS_KEY`,
      reason: 'Excellent trace support and debugging tools',
      confidence: 0.95
    });

    // Alchemy (good for production)
    providers.push({
      provider: {
        name: 'Alchemy',
        type: 'alchemy',
        traceSupport: false,
        recommendedFor: ['production', 'high-volume'],
        setupUrl: 'https://alchemy.com'
      },
      url: `https://${network === 'ethereum' ? 'eth-mainnet' : network + '-mainnet'}.g.alchemy.com/v2/YOUR_API_KEY`,
      reason: 'Reliable and fast for production applications',
      confidence: 0.8
    });

    // Infura (reliable fallback)
    providers.push({
      provider: {
        name: 'Infura',
        type: 'infura',
        traceSupport: false,
        recommendedFor: ['production', 'reliability'],
        setupUrl: 'https://infura.io'
      },
      url: `https://${network === 'ethereum' ? 'mainnet' : network + '-mainnet'}.infura.io/v3/YOUR_PROJECT_ID`,
      reason: 'Established and reliable infrastructure',
      confidence: 0.75
    });

    return {
      network,
      providers
    };
  }

  /**
   * Auto-detect working RPC provider for a network
   */
  static async findWorkingProvider(network: string): Promise<string | null> {
    if (!SUPPORTED_NETWORKS[network]) {
      throw new ConfigError(`Unsupported network: ${network}`, 'INVALID_NETWORK');
    }

    const fallbackUrls = [
      SUPPORTED_NETWORKS[network].rpcUrl, // Default from config
    ];

    // Add common public RPCs as fallbacks
    if (network === 'ethereum') {
      fallbackUrls.push(
        'https://cloudflare-eth.com',
        'https://rpc.ankr.com/eth',
        'https://eth.public-rpc.com'
      );
    } else if (network === 'polygon') {
      fallbackUrls.push(
        'https://polygon-rpc.com',
        'https://rpc.ankr.com/polygon',
        'https://polygon.public-rpc.com'
      );
    } else if (network === 'arbitrum') {
      fallbackUrls.push(
        'https://arb1.arbitrum.io/rpc',
        'https://rpc.ankr.com/arbitrum',
        'https://arbitrum.public-rpc.com'
      );
    }

    for (const url of fallbackUrls) {
      try {
        const result = await this.testRpcConnection(url, network);
        if (result.connected) {
          return url;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Generate provider setup instructions
   */
  static getProviderSetupInstructions(providerType: 'tenderly' | 'alchemy' | 'infura'): string[] {
    switch (providerType) {
      case 'tenderly':
        return [
          '1. Sign up at https://tenderly.co',
          '2. Create a new project',
          '3. Go to Settings → Gateway',
          '4. Copy your Access Key',
          '5. Use: aura config rpc <network> https://<network>.gateway.tenderly.co/YOUR_ACCESS_KEY'
        ];
      
      case 'alchemy':
        return [
          '1. Sign up at https://alchemy.com',
          '2. Create a new app',
          '3. Select your network (Ethereum, Polygon, etc.)',
          '4. Copy the HTTP URL',
          '5. Use: aura config rpc <network> <YOUR_ALCHEMY_URL>'
        ];
      
      case 'infura':
        return [
          '1. Sign up at https://infura.io',
          '2. Create a new project',
          '3. Select your network',
          '4. Copy the HTTPS endpoint',
          '5. Use: aura config rpc <network> <YOUR_INFURA_URL>'
        ];
      
      default:
        return ['Provider setup instructions not available'];
    }
  }

  /**
   * Validate network configuration and suggest improvements
   */
  static async validateNetworkConfig(network: string, rpcUrl?: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
    testResult?: ConnectionTestResult;
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Validate network name
    if (!SUPPORTED_NETWORKS[network]) {
      issues.push(`Unsupported network: ${network}`);
      suggestions.push(`Supported networks: ${Object.keys(SUPPORTED_NETWORKS).join(', ')}`);
      return { isValid: false, issues, suggestions };
    }

    // Test RPC URL if provided
    let testResult: ConnectionTestResult | undefined;
    if (rpcUrl) {
      testResult = await this.testRpcConnection(rpcUrl, network);
      
      if (!testResult.connected) {
        issues.push(`RPC connection failed: ${testResult.error}`);
        suggestions.push('Try a different RPC provider or check your API key');
      } else {
        // Check capabilities and make suggestions
        if (testResult.capabilities && !testResult.capabilities.traceSupport) {
          suggestions.push('For transaction tracing, consider using Tenderly which has excellent trace support');
        }
        
        if (testResult.latency && testResult.latency > 2000) {
          suggestions.push('High latency detected. Consider using a different RPC provider closer to your location');
        }
      }
    } else {
      suggestions.push(`Configure an RPC URL for ${network} network`);
      const recommendations = this.getProviderRecommendations(network);
      suggestions.push(`Recommended: ${recommendations.providers[0].provider.name} - ${recommendations.providers[0].reason}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      testResult
    };
  }
}
