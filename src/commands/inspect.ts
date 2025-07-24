import chalk from 'chalk';
import { RpcProvider } from '../providers/rpc.js';
import { TraceParser } from '../parsers/trace-parser.js';
import { TraceFormatter } from '../formatters/trace-formatter.js';
import { TokenService } from '../services/token.js';
import { validateTransactionHash, DEFAULT_NETWORK, getProviderRecommendation, supportsAdvancedTrace } from '../utils/config.js';
import { InspectOptions, AuraError } from '../types/index.js';

export async function inspectCommand(
  txHash: string,
  options: InspectOptions
): Promise<void> {
  try {
    // Validate inputs
    validateTransactionHash(txHash);
    const network = options.network || DEFAULT_NETWORK;

    // Suppress progress messages in JSON mode
    const showProgress = !options.json;

    if (showProgress) {
      console.log(chalk.cyan(`🔍 Inspecting transaction: ${txHash}`));
      console.log(chalk.gray(`Network: ${network}`));
      console.log('');
    }

    // Initialize services
    const provider = new RpcProvider(network);
    const parser = new TraceParser();
    const formatter = new TraceFormatter();
    const tokenService = new TokenService(provider);
    
    // Enhance formatter with token context
    formatter.setTokenService(tokenService);
    
    // Check connection
    if (showProgress) {
      console.log(chalk.yellow('⏳ Connecting to RPC provider...'));
    }
    const isConnected = await provider.checkConnection();
    if (!isConnected) {
      throw new AuraError(
        'Failed to connect to RPC provider. Please check your network configuration.',
        'CONNECTION_ERROR'
      );
    }
    if (showProgress) {
      const tenderlyStatus = provider.getTenderlyStatus();
      console.log(chalk.green('✅ Connected to RPC provider'));
      console.log('');
    }

    // Fetch transaction info and trace data in parallel
    if (showProgress) {
      console.log(chalk.yellow('⏳ Fetching transaction data and trace...'));
    }
    const txInfo = await provider.getTransactionInfo(txHash);
    
    // Try to fetch trace data, but gracefully handle if not available
    let rawTrace;
    let hasTraceData = false;
    
    try {
      rawTrace = await provider.getTransactionTrace(txHash);
      hasTraceData = true;
    } catch (traceError: any) {
      if (traceError.code === 'TRACE_NOT_SUPPORTED' || 
          traceError.message?.includes('not available on the Free tier') ||
          traceError.message?.includes('debug_traceTransaction')) {
        if (showProgress) {
          console.log(chalk.yellow('⚠️  Trace data not available (RPC provider limitation)'));
          console.log('');
        }
        hasTraceData = false;
      } else {
        throw traceError; // Re-throw if it's a different error
      }
    }
    
    if (showProgress) {
      console.log(chalk.green('✅ Data retrieved\n'));
    }

    if (hasTraceData && rawTrace) {
      // Full trace analysis
      const parsedTrace = await parser.parseTrace(rawTrace, txInfo);
      
      // Parse logs if available
      const receipt = await provider.getTransactionReceipt(txInfo.hash);
      if (receipt && receipt.logs) {
        await parser.parseLogs([...receipt.logs], parsedTrace);
      }

      if (showProgress) {
        console.log(chalk.green('✅ Trace parsed successfully\n'));
      }

      // Output results
      if (options.json) {
        console.log(JSON.stringify(parsedTrace, null, 2));
      } else {
        const formattedOutput = formatter.formatTrace(parsedTrace, options);
        formattedOutput.forEach(line => console.log(line));
      }
    } else {
      // Fallback to basic transaction info + logs
      if (options.json) {
        // JSON output for basic info
        const receipt = await provider.getTransactionReceipt(txInfo.hash);
        const basicInfo = {
          transaction: txInfo,
          receipt: receipt,
          note: "Full trace data not available - RPC provider limitation"
        };
        console.log(JSON.stringify(basicInfo, null, 2));
      } else {
        await displayBasicTransactionInfo(txInfo, provider, options);
      }
    }

    // Add explorer link
    if (!options.json) {
      console.log('\n' + chalk.gray('─'.repeat(60)));
      console.log(`${chalk.bold('Explorer:')} ${provider.getNetworkConfig().explorer}/tx/${txHash}`);
    }

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

/**
 * Display basic transaction information when trace data is not available
 */
async function displayBasicTransactionInfo(
  txInfo: any, 
  provider: RpcProvider, 
  options: InspectOptions
): Promise<void> {
  console.log(chalk.bold('📋 Transaction Details:'));
  console.log(chalk.gray('─'.repeat(60)));
  
  const statusColor = txInfo.status === 1 ? chalk.green : chalk.red;
  const statusText = txInfo.status === 1 ? '✅ Success' : '❌ Failed';
  
  console.log(`${chalk.bold('Hash:')} ${txInfo.hash}`);
  console.log(`${chalk.bold('Block:')} ${txInfo.blockNumber}`);
  console.log(`${chalk.bold('Status:')} ${statusColor(statusText)}`);
  console.log(`${chalk.bold('From:')} ${txInfo.from}`);
  console.log(`${chalk.bold('To:')} ${txInfo.to || chalk.gray('Contract Creation')}`);
  console.log(`${chalk.bold('Value:')} ${chalk.cyan(txInfo.value)} ETH`);
  console.log(`${chalk.bold('Gas Used:')} ${chalk.yellow(Number(txInfo.gasUsed).toLocaleString())}`);
  console.log(`${chalk.bold('Gas Price:')} ${txInfo.gasPrice} gwei`);
  
  // Try to show events if available
  const receipt = await provider.getTransactionReceipt(txInfo.hash);
  if (receipt && receipt.logs && receipt.logs.length > 0) {
    console.log('');
    console.log(chalk.bold('📝 Transaction Events:'));
    console.log(chalk.gray('─'.repeat(60)));
    
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      console.log(`${chalk.magenta('•')} Event ${i + 1} at ${chalk.cyan(shortenAddress(log.address))}`);
      
      if (log.topics && log.topics.length > 0) {
        // Show the event signature
        console.log(`  ${chalk.gray('Signature:')} ${log.topics[0]}`);
        
        // Try to identify common events
        const eventName = identifyCommonEvent(log.topics[0]);
        if (eventName) {
          console.log(`  ${chalk.green('Type:')} ${eventName}`);
        }
      }
    }
  }
  
  console.log('');
  console.log(chalk.yellow('💡 Tip: For detailed call traces, use an RPC provider with debug_traceTransaction support'));
  console.log(chalk.gray('   Recommended providers: Tenderly, Alchemy (paid), Infura (with add-ons), or your own node'));
}

/**
 * Shorten ethereum addresses for display
 */
function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Identify common event types by their topic0 hash
 */
function identifyCommonEvent(topic0: string): string | null {
  const commonEvents: { [key: string]: string } = {
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer (ERC20/ERC721)',
    '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval (ERC20)',
    '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31': 'ApprovalForAll (ERC721)',
    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62': 'TransferSingle (ERC1155)',
    '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb': 'TransferBatch (ERC1155)'
  };
  
  return commonEvents[topic0] || null;
}
