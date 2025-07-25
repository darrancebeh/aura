import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS, validateNetwork } from '../utils/config.js';
import { TransactionInfo, AuraError, RawTrace, TraceCall } from '../types/index.js';
import { ConfigManager } from '../services/config-manager.js';
import { NetworkDetector } from '../services/network-detector.js';

export class RpcProvider {
  private provider: ethers.JsonRpcProvider;
  private networkName: string;
  private isTenderly: boolean = false;
  private hasTraceSupport: boolean = false;
  private configManager: ConfigManager;

  constructor(network: string) {
    validateNetwork(network);
    this.networkName = network;
    this.configManager = new ConfigManager();
    
    // We'll initialize the provider async in a separate method
    this.provider = this.createProvider();
  }

  /**
   * Create provider with configuration fallback
   */
  private createProvider(): ethers.JsonRpcProvider {
    const config = SUPPORTED_NETWORKS[this.networkName];
    
    // For now, use the config from SUPPORTED_NETWORKS
    // Later, this will be enhanced to use ConfigManager async
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Detect provider capabilities
    const providerInfo = NetworkDetector.detectProvider(config.rpcUrl);
    this.isTenderly = providerInfo.type === 'tenderly';
    this.hasTraceSupport = providerInfo.traceSupport;
    
    return provider;
  }

  /**
   * Initialize provider with user configuration and detect capabilities
   */
  async initializeWithConfig(): Promise<void> {
    try {
      const rpcUrl = await this.configManager.getRpcUrl(this.networkName);
      
      if (rpcUrl) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Enhanced provider detection with capabilities
        const providerInfo = NetworkDetector.detectProvider(rpcUrl);
        this.isTenderly = providerInfo.type === 'tenderly';
        this.hasTraceSupport = providerInfo.traceSupport;
        
        // Test capabilities if not already known
        if (!this.hasTraceSupport) {
          try {
            const testResult = await NetworkDetector.testRpcConnection(rpcUrl, this.networkName);
            if (testResult.capabilities) {
              this.hasTraceSupport = testResult.capabilities.traceSupport;
            }
          } catch {
            // Silently continue if capability test fails
          }
        }
      }
    } catch (error) {
      // Silently fall back to default if config fails
      // This ensures backward compatibility
    }
  }

  /**
   * Check if current provider supports transaction tracing
   */
  supportsTracing(): boolean {
    return this.hasTraceSupport;
  }

  /**
   * Get provider information for troubleshooting
   */
  async getProviderInfo(): Promise<{
    url: string;
    type: string;
    traceSupport: boolean;
    recommendations?: string[];
  }> {
    const rpcUrl = await this.configManager.getRpcUrl(this.networkName);
    const currentUrl = rpcUrl || SUPPORTED_NETWORKS[this.networkName].rpcUrl;
    
    const providerInfo = NetworkDetector.detectProvider(currentUrl);
    const recommendations: string[] = [];
    
    if (!providerInfo.traceSupport) {
      recommendations.push('For transaction tracing, consider using Tenderly which has excellent trace support');
      recommendations.push('Alternative: Use Alchemy with debug API add-on');
      recommendations.push(`Configure with: aura config rpc ${this.networkName} <tenderly_url>`);
    }
    
    return {
      url: currentUrl,
      type: providerInfo.name,
      traceSupport: providerInfo.traceSupport,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  }

  async getTransactionInfo(txHash: string): Promise<TransactionInfo> {
    try {
      // Get transaction and receipt in parallel
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash)
      ]);

      if (!tx) {
        throw new AuraError(
          `Transaction not found: ${txHash}`,
          'TX_NOT_FOUND'
        );
      }

      if (!receipt) {
        throw new AuraError(
          `Transaction receipt not found. Transaction may be pending: ${txHash}`,
          'TX_PENDING'
        );
      }

      return {
        hash: tx.hash,
        blockNumber: tx.blockNumber!,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: ethers.formatUnits(tx.gasPrice || 0, 'gwei'),
        status: receipt.status!
      };
    } catch (error) {
      if (error instanceof AuraError) {
        throw error;
      }
      throw new AuraError(
        `Failed to fetch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RPC_ERROR'
      );
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }

  getNetworkName(): string {
    return this.networkName;
  }

  getNetworkConfig() {
    return SUPPORTED_NETWORKS[this.networkName];
  }

  /**
   * Get transaction receipt (public method)
   */
  async getTransactionReceipt(txHash: string) {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Fetch transaction trace using debug_traceTransaction
   * This provides the complete execution trace including internal calls
   */
  async getTransactionTrace(txHash: string): Promise<RawTrace> {
    try {
      console.log('⏳ Fetching transaction trace...');
      
      // Check if provider supports tracing and provide helpful guidance
      if (!this.hasTraceSupport) {
        const providerInfo = await this.getProviderInfo();
        throw new AuraError(
          `Transaction tracing not supported by ${providerInfo.type} provider.\n` +
          `Current URL: ${providerInfo.url}\n` +
          `💡 Recommendations:\n` +
          `${providerInfo.recommendations?.map(r => `   • ${r}`).join('\n') || '   • Use a provider with debug API support'}\n` +
          `📚 Setup guide: https://docs.tenderly.co/web3-gateway/web3-gateway`,
          'TRACE_NOT_SUPPORTED'
        );
      }
      
      // Use call tracer for structured output
      // Tenderly supports this excellently with detailed logs
      const trace = await this.provider.send('debug_traceTransaction', [
        txHash,
        {
          tracer: 'callTracer',
          tracerConfig: {
            withLog: true,
            ...(this.isTenderly && {
              // Tenderly-specific optimizations
              onlyTopCall: false,
              withInternalCalls: true
            })
          }
        }
      ]);

      if (!trace) {
        throw new AuraError(
          'No trace data received. This RPC provider may not support debug_traceTransaction.',
          'NO_TRACE_DATA'
        );
      }

      // Normalize the trace format (Tenderly has excellent consistent format)
      return this.normalizeTrace(trace);
    } catch (error: any) {
      if (error instanceof AuraError) {
        throw error;
      }

      // Handle common RPC errors with enhanced guidance
      if (error.code === -32601) {
        const providerInfo = await this.getProviderInfo();
        throw new AuraError(
          `This RPC provider does not support transaction tracing (debug_traceTransaction).\n` +
          `Provider: ${providerInfo.type}\n` +
          `💡 Switch to a provider with trace support:\n` +
          `${providerInfo.recommendations?.map(r => `   • ${r}`).join('\n') || '   • Use Tenderly, Alchemy with debug add-on, or similar'}\n` +
          `📚 Setup guide: https://docs.tenderly.co/web3-gateway/web3-gateway`,
          'TRACE_NOT_SUPPORTED'
        );
      }

      if (error.message?.includes('transaction not found')) {
        throw new AuraError(
          `Transaction not found: ${txHash}`,
          'TX_NOT_FOUND'
        );
      }

      // Provider-specific error handling
      if (error.message?.includes('rate limit')) {
        throw new AuraError(
          'Rate limit reached. Please wait a moment before retrying.',
          'RATE_LIMIT'
        );
      }

      throw new AuraError(
        `Failed to fetch trace: ${error.message || 'Unknown error'}`,
        'TRACE_ERROR'
      );
    }
  }

  /**
   * Normalize trace data format across different providers
   * Tenderly provides excellent, consistent trace format
   */
  private normalizeTrace(trace: any): RawTrace {
    // Handle Tenderly/Geth callTracer format (most common)
    if (trace.type && trace.from && trace.to) {
      return {
        calls: [trace as TraceCall],
        gasUsed: trace.gasUsed || '0'
      };
    }

    // Handle wrapped result format
    if (trace.result) {
      return {
        calls: [trace.result as TraceCall],
        gasUsed: trace.result.gasUsed || '0'
      };
    }

    // Handle array format
    if (Array.isArray(trace)) {
      return {
        calls: trace,
        gasUsed: trace[0]?.gasUsed || '0'
      };
    }

    // Handle object with calls array
    if (trace.calls || trace.logs) {
      return {
        calls: trace.calls || [],
        gasUsed: trace.gasUsed || '0',
        logs: trace.logs
      };
    }

    throw new AuraError(
      'Unexpected trace format received from RPC provider',
      'INVALID_TRACE_FORMAT'
    );
  }

  /**
   * Check if provider supports advanced features
   */
  getTenderlyStatus(): { isTenderly: boolean; message: string } {
    if (this.isTenderly) {
      return {
        isTenderly: true,
        message: 'Connected to Tenderly RPC'
      };
    }
    return {
      isTenderly: false,
      message: 'Connected to RPC provider'
    };
  }
}
