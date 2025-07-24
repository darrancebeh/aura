import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS, validateNetwork } from '../utils/config.js';
import { TransactionInfo, AuraError, RawTrace, TraceCall } from '../types/index.js';

export class RpcProvider {
  private provider: ethers.JsonRpcProvider;
  private networkName: string;
  private isTenderly: boolean;

  constructor(network: string) {
    validateNetwork(network);
    this.networkName = network;
    const config = SUPPORTED_NETWORKS[network];
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Detect if using Tenderly for optimizations
    this.isTenderly = config.rpcUrl.includes('tenderly.co');
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
   * Optimized for Tenderly's excellent trace support
   */
  async getTransactionTrace(txHash: string): Promise<RawTrace> {
    try {
      if (this.isTenderly) {
        console.log('⏳ Fetching transaction trace (Using Tenderly - excellent trace support available!)...');
      } else {
        console.log('⏳ Fetching transaction trace...');
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

      // Handle common RPC errors with provider-specific guidance
      if (error.code === -32601) {
        const suggestion = this.isTenderly 
          ? 'Unexpected error - Tenderly should support tracing. Please check your API key.'
          : 'This RPC provider does not support transaction tracing. Consider using Tenderly for excellent trace support.';
        
        throw new AuraError(
          suggestion,
          'TRACE_NOT_SUPPORTED'
        );
      }

      if (error.message?.includes('transaction not found')) {
        throw new AuraError(
          `Transaction not found: ${txHash}`,
          'TX_NOT_FOUND'
        );
      }

      // Tenderly-specific error handling
      if (this.isTenderly && error.message?.includes('rate limit')) {
        throw new AuraError(
          'Tenderly rate limit reached. Please wait a moment before retrying.',
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
        message: 'Using Tenderly - excellent trace support available!'
      };
    }
    return {
      isTenderly: false,
      message: 'Consider using Tenderly for superior trace support'
    };
  }
}
