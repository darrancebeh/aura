import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS, validateNetwork } from '../utils/config.js';
import { TransactionInfo, AuraError } from '../types/index.js';

export class RpcProvider {
  private provider: ethers.JsonRpcProvider;
  private networkName: string;

  constructor(network: string) {
    validateNetwork(network);
    this.networkName = network;
    const config = SUPPORTED_NETWORKS[network];
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
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
}
