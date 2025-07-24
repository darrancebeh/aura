import chalk from 'chalk';
import { RpcProvider } from '../providers/rpc.js';
import { validateTransactionHash, DEFAULT_NETWORK } from '../utils/config.js';
import { InspectOptions, AuraError } from '../types/index.js';

export async function inspectCommand(
  txHash: string,
  options: InspectOptions
): Promise<void> {
  try {
    // Validate inputs
    validateTransactionHash(txHash);
    const network = options.network || DEFAULT_NETWORK;

    console.log(chalk.cyan(`🔍 Inspecting transaction: ${txHash}`));
    console.log(chalk.gray(`Network: ${network}\n`));

    // Initialize provider
    const provider = new RpcProvider(network);
    
    // Check connection
    console.log(chalk.yellow('⏳ Connecting to RPC provider...'));
    const isConnected = await provider.checkConnection();
    if (!isConnected) {
      throw new AuraError(
        'Failed to connect to RPC provider. Please check your network configuration.',
        'CONNECTION_ERROR'
      );
    }
    console.log(chalk.green('✅ Connected to RPC provider\n'));

    // Fetch transaction info
    console.log(chalk.yellow('⏳ Fetching transaction data...'));
    const txInfo = await provider.getTransactionInfo(txHash);
    console.log(chalk.green('✅ Transaction data retrieved\n'));

    // Display transaction information
    displayTransactionInfo(txInfo, provider.getNetworkConfig());

    // Note about upcoming features
    console.log(chalk.dim('\n📝 Note: Trace parsing and call stack visualization coming in next update!'));

  } catch (error) {
    if (error instanceof AuraError) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      if (options.verbose && error.code) {
        console.error(chalk.gray(`Code: ${error.code}`));
      }
    } else {
      console.error(chalk.red('❌ Unexpected error occurred'));
      if (options.verbose) {
        console.error(chalk.gray(error instanceof Error ? error.stack : String(error)));
      }
    }
    process.exit(1);
  }
}

function displayTransactionInfo(txInfo: any, networkConfig: any): void {
  console.log(chalk.bold('📋 Transaction Details:'));
  console.log(chalk.gray('─'.repeat(50)));
  
  console.log(`${chalk.bold('Hash:')} ${txInfo.hash}`);
  console.log(`${chalk.bold('Block:')} ${txInfo.blockNumber}`);
  console.log(`${chalk.bold('Status:')} ${txInfo.status === 1 ? chalk.green('✅ Success') : chalk.red('❌ Failed')}`);
  console.log(`${chalk.bold('From:')} ${txInfo.from}`);
  console.log(`${chalk.bold('To:')} ${txInfo.to || chalk.gray('Contract Creation')}`);
  console.log(`${chalk.bold('Value:')} ${txInfo.value} ETH`);
  console.log(`${chalk.bold('Gas Used:')} ${Number(txInfo.gasUsed).toLocaleString()}`);
  console.log(`${chalk.bold('Gas Price:')} ${txInfo.gasPrice} gwei`);
  
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`${chalk.bold('Explorer:')} ${networkConfig.explorer}/tx/${txInfo.hash}`);
}
