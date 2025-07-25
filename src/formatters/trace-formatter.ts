import chalk from 'chalk';
import { ethers } from 'ethers';
import { ParsedTrace, ParsedCall, ParsedEvent, InspectOptions, DefiAnalysis } from '../types/index.js';
import { TokenService } from '../services/token.js';
import { RpcProvider } from '../providers/rpc.js';

/**
 * Formatter for creating human-readable trace output
 * Handles color coding, indentation, and various display options
 */
export class TraceFormatter {
  private tokenService?: TokenService;

  /**
   * Initialize formatter with optional token service for enhanced context
   */
  setTokenService(tokenService: TokenService) {
    this.tokenService = tokenService;
  }
  
  /**
   * Format complete trace for display
   */
  formatTrace(trace: ParsedTrace, options: InspectOptions, defiAnalysis?: DefiAnalysis): string[] {
    const output: string[] = [];
    
    // Add transaction summary
    output.push(...this.formatTransactionSummary(trace));
    output.push('');
    
    // Add DeFi analysis if requested and available
    if (options.analyzeDefi && defiAnalysis) {
      output.push(...this.formatDefiAnalysis(defiAnalysis));
      output.push('');
    }
    
    // Add call trace
    if (!options.eventsOnly) {
      output.push(chalk.bold('🌳 Call Trace:'));
      output.push(...this.formatCall(trace.rootCall, '', options));
      output.push('');
    }
    
    // Add events summary if there are events
    if (!options.contractsOnly && trace.events.length > 0) {
      output.push(chalk.bold('📝 Events Summary:'));
      output.push(...this.formatEvents(trace.events, options));
    }
    
    return output;
  }

  /**
   * Format transaction summary information
   */
  private formatTransactionSummary(trace: ParsedTrace): string[] {
    const tx = trace.transaction;
    const output: string[] = [];
    
    output.push(chalk.bold('📋 Transaction Summary:'));
    output.push(chalk.gray('─'.repeat(60)));
    
    const statusColor = tx.status === 1 ? chalk.green : chalk.red;
    const statusText = tx.status === 1 ? '✅ Success' : '❌ Failed';
    
    output.push(`${chalk.bold('Status:')} ${statusColor(statusText)}`);
    output.push(`${chalk.bold('Gas Used:')} ${chalk.yellow(Number(trace.totalGasUsed).toLocaleString())}`);
    output.push(`${chalk.bold('Gas Price:')} ${chalk.cyan(tx.gasPrice)} gwei`);
    
    // Calculate total transaction fee
    const gasUsedNum = parseInt(trace.totalGasUsed);
    const gasPriceGwei = parseFloat(tx.gasPrice);
    const totalCostEth = (gasUsedNum * gasPriceGwei / 1e9).toFixed(9);
    output.push(`${chalk.bold('Transaction Fee:')} ${chalk.magenta(totalCostEth)} ETH`);
    
    if (tx.value !== '0.0') {
      output.push(`${chalk.bold('Value:')} ${chalk.cyan(tx.value)} ETH`);
    }
    
    output.push(chalk.gray('─'.repeat(60)));
    
    return output;
  }

  /**
   * Format individual call with proper indentation
   */
  private formatCall(call: ParsedCall, prefix: string, options: InspectOptions): string[] {
    const output: string[] = [];
    
    // Skip if depth limit exceeded
    if (options.depth && call.depth >= options.depth) {
      return output;
    }
    
    // Format the call line
    const callLine = this.formatCallLine(call);
    output.push(callLine);
    
    // Add events for this call
    if (call.events.length > 0 && !options.contractsOnly) {
      for (const event of call.events) {
        const eventLine = this.formatEventLine(event, prefix + '│  ');
        output.push(eventLine);
      }
    }
    
    // Add gas usage if significant
    const gasUsed = parseInt(call.gasUsed);
    if (gasUsed > 1000) {
      const gasLine = `${prefix}│  ${chalk.dim('⚡')} ${chalk.gray(`Gas: ${gasUsed.toLocaleString()}`)}`;
      output.push(gasLine);
    }
    
    // Process subcalls
    for (let i = 0; i < call.subcalls.length; i++) {
      const isLast = i === call.subcalls.length - 1;
      const newPrefix = prefix + (isLast ? '└─ ' : '├─ ');
      const childPrefix = prefix + (isLast ? '   ' : '│  ');
      
      const subcallLines = this.formatCall(call.subcalls[i], newPrefix, {
        ...options,
        depth: options.depth // Pass through depth limit
      });
      
      // Replace the first line prefix
      if (subcallLines.length > 0) {
        subcallLines[0] = subcallLines[0].replace(/^/, newPrefix);
        for (let j = 1; j < subcallLines.length; j++) {
          subcallLines[j] = subcallLines[j].replace(/^/, childPrefix);
        }
      }
      
      output.push(...subcallLines);
    }
    
    return output;
  }

  /**
   * Format a single call line
   */
  private formatCallLine(call: ParsedCall): string {
    let line = '';
    
    // Call type icon
    const icon = this.getCallIcon(call.type);
    line += chalk.blue(icon) + ' ';
    
    // Contract address with name if available
    line += this.formatContractAddress(call.to);
    
    // Function call if decoded
    if (call.decodedFunction) {
      line += chalk.white('.') + chalk.green(call.decodedFunction.name) + chalk.white('(');
      
      const params = call.decodedFunction.inputs.map(input => {
        const value = this.formatParameterValue(input.value, input.type, call.to);
        const paramName = this.getReadableParameterName(input.name, input.type);
        return `${chalk.yellow(paramName)}: ${chalk.white(value)}`;
      }).join(', ');
      
      line += params + chalk.white(')');
    } else if (call.type === 'create' || call.type === 'create2') {
      line += chalk.magenta(' [Contract Creation]');
    } else {
      // Determine if this is a simple ETH transfer or unknown contract call
      const hasValue = call.value && call.value !== '0x0' && call.value !== '0' && parseFloat(ethers.formatEther(call.value)) > 0;
      
      // For simple ETH transfers, don't add any extra text - the value display is enough
      if (!hasValue) {
        // Only show "Unknown Function" for contract calls without value
        line += chalk.gray(' [Unknown Function]');
      }
      // If has value, don't add anything - the {X ETH} will show it's a transfer
    }
    
    // Value transfer
    if (call.value && call.value !== '0x0' && call.value !== '0') {
      const ethValue = ethers.formatEther(call.value);
      if (parseFloat(ethValue) > 0) {
        line += chalk.green(` {${ethValue} ETH}`);
      }
    }
    
    // Error indication
    if (!call.success) {
      line += chalk.red(' ❌');
      if (call.revertReason) {
        line += chalk.red(` "${call.revertReason}"`);
      }
    }
    
    return line;
  }

  /**
   * Format event line
   */
  private formatEventLine(event: ParsedEvent, prefix: string): string {
    let line = prefix + chalk.magenta('📝 ');
    
    if (event.decodedEvent) {
      line += chalk.green(event.decodedEvent.name) + chalk.white('(');
      
      const params = event.decodedEvent.inputs.map(input => {
        const value = this.formatParameterValue(input.value, input.type, event.address);
        const paramName = this.getReadableParameterName(input.name, input.type);
        return `${chalk.yellow(paramName)}: ${chalk.white(value)}`;
      }).join(', ');
      
      line += params + chalk.white(')');
    } else {
      line += chalk.gray(`Unknown Event (${this.shortenAddress(event.address)})`);
    }
    
    return line;
  }

  /**
   * Format events summary
   */
  private formatEvents(events: ParsedEvent[], options: InspectOptions): string[] {
    const output: string[] = [];
    
    for (const event of events) {
      if (event.decodedEvent) {
        let line = `  ${chalk.magenta('•')} ${chalk.green(event.decodedEvent.name)} `;
        line += chalk.gray(`at ${this.shortenAddress(event.address)}`);
        output.push(line);
        
        // Add parameters
        for (const input of event.decodedEvent.inputs) {
          const value = this.formatParameterValue(input.value, input.type, event.address);
          const indexedMarker = input.indexed ? chalk.blue('[indexed]') : '';
          output.push(`    ${chalk.yellow(input.name)}: ${chalk.white(value)} ${indexedMarker}`);
        }
        output.push('');
      }
    }
    
    return output;
  }

  /**
   * Get appropriate icon for call type
   */
  private getCallIcon(type: string): string {
    switch (type) {
      case 'call': return '📞';
      case 'staticcall': return '👁️';
      case 'delegatecall': return '🔄';
      case 'create': return '🏗️';
      case 'create2': return '🏭';
      default: return '📞';
    }
  }

  /**
   * Shorten ethereum addresses for display
   */
  private shortenAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format contract address with name if available
   */
  private formatContractAddress(address: string): string {
    const shortened = this.shortenAddress(address);
    
    if (this.tokenService) {
      const tokenInfo = this.tokenService.getCachedTokenInfo(address);
      if (tokenInfo) {
        return `${chalk.cyan(shortened)} ${chalk.gray(`(${tokenInfo.symbol})`)}`;
      }
    }
    
    return chalk.cyan(shortened);
  }

  /**
   * Format parameter values for display
   */
  private formatParameterValue(value: any, type: string, contractAddress?: string): string {
    if (type === 'address') {
      return this.shortenAddress(value.toString());
    }
    
    if (type.startsWith('uint') || type.startsWith('int')) {
      const num = value.toString();
      
      // Check for max uint256 (unlimited approval)
      if (num === '115792089237316195423570985008687907853269984665640564039457584007913129639935' ||
          num === '115792089237316195423570985008687907853269984665640564039457584007727448869935') {
        return chalk.yellow('∞ (unlimited)');
      }
      
      // Try to format with token context if we have a contract address
      if (contractAddress && this.tokenService) {
        const tokenInfo = this.tokenService.getCachedTokenInfo(contractAddress);
        if (tokenInfo) {
          try {
            return this.tokenService.formatTokenAmount(BigInt(num), tokenInfo);
          } catch {
            // Fall through to generic formatting
          }
        }
      }
      
      // Format token amounts (fallback to generic decimal detection)
      const numValue = BigInt(num);
      
      // If it's a very large number, likely a token amount
      if (num.length > 15) {
        // Try different decimal places
        const formatted18 = this.formatTokenAmount(numValue, 18);
        const formatted6 = this.formatTokenAmount(numValue, 6);
        const formatted5 = this.formatTokenAmount(numValue, 5); // GALA uses 5 decimals
        
        // Choose the most reasonable formatting based on result
        if (formatted5.includes('.') && parseFloat(formatted5) > 0.001) {
          return `${formatted5} ${chalk.dim('(5 decimals)')}`;
        } else if (formatted6.includes('.') && parseFloat(formatted6) > 0.001) {
          return `${formatted6} ${chalk.dim('(6 decimals)')}`;
        } else if (formatted18.includes('.') && parseFloat(formatted18) > 0.001) {
          return `${formatted18} ${chalk.dim('(18 decimals)')}`;
        }
      }
      
      // For numbers between 10-15 digits, likely token amounts too
      if (num.length >= 10 && num.length <= 15) {
        const formatted5 = this.formatTokenAmount(numValue, 5);
        const formatted6 = this.formatTokenAmount(numValue, 6);
        const formatted18 = this.formatTokenAmount(numValue, 18);
        
        // Choose the best formatting
        if (parseFloat(formatted5) >= 1 && parseFloat(formatted5) < 1000000) {
          return `${formatted5} ${chalk.dim('tokens')}`;
        } else if (parseFloat(formatted6) >= 1 && parseFloat(formatted6) < 1000000) {
          return `${formatted6} ${chalk.dim('tokens')}`;
        } else if (parseFloat(formatted18) >= 1) {
          return `${formatted18} ${chalk.dim('tokens')}`;
        }
      }
      
      // Format regular numbers with commas
      if (num.length > 6) {
        try {
          return parseInt(num).toLocaleString();
        } catch {
          return this.shortenLargeNumber(num);
        }
      }
      return num;
    }
    
    if (type === 'bool') {
      return value ? 'true' : 'false';
    }
    
    if (type.startsWith('bytes')) {
      const str = value.toString();
      if (str.length > 20) {
        return `${str.slice(0, 10)}...${str.slice(-6)}`;
      }
      return str;
    }
    
    const str = value.toString();
    if (str.length > 50) {
      return `${str.slice(0, 25)}...${str.slice(-10)}`;
    }
    
    return str;
  }

  /**
   * Format token amounts with proper decimal places
   */
  private formatTokenAmount(value: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;
    
    if (remainder === 0n) {
      return quotient.toString();
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmedRemainder = remainderStr.replace(/0+$/, '');
    
    if (trimmedRemainder === '') {
      return quotient.toString();
    }
    
    return `${quotient}.${trimmedRemainder}`;
  }

  /**
   * Shorten very large numbers for display
   */
  private shortenLargeNumber(numStr: string): string {
    if (numStr.length > 20) {
      return `${numStr.slice(0, 8)}...${numStr.slice(-4)} ${chalk.dim('(large number)')}`;
    }
    return numStr;
  }

  /**
   * Get more readable parameter names
   */
  private getReadableParameterName(paramName: string, paramType: string): string {
    // Handle generic parameter names
    if (paramName.startsWith('param') || paramName === '_to' || paramName === '_from') {
      if (paramType === 'address') {
        if (paramName.includes('to') || paramName === 'param1') return 'to';
        if (paramName.includes('from') || paramName === 'param0') return 'from';
        if (paramName.includes('spender')) return 'spender';
        if (paramName.includes('owner')) return 'owner';
        return 'address';
      }
      if (paramType.includes('uint') && (paramName.includes('amount') || paramName.includes('value'))) {
        return 'amount';
      }
    }
    
    return paramName;
  }

  /**
   * Format DeFi analysis results
   */
  private formatDefiAnalysis(defiAnalysis: DefiAnalysis): string[] {
    const output: string[] = [];
    
    output.push(chalk.bold('🔄 DeFi Analysis:'));
    
    if (defiAnalysis.interactions.length === 0) {
      output.push(chalk.gray('  No DeFi protocol interactions detected'));
      return output;
    }
    
    for (const interaction of defiAnalysis.interactions) {
      output.push(chalk.cyan(`  🏛️  ${interaction.protocol.toUpperCase()}`));
      output.push(chalk.yellow(`     Type: ${interaction.type}`));
      output.push(chalk.gray(`     Description: ${interaction.description}`));
      
      // Handle swap-specific details with enhanced formatting
      if (interaction.type === 'swap' && interaction.details.swapDetails) {
        const swap = interaction.details.swapDetails as any;
        
        // Display the swap direction
        output.push(chalk.green(`     Swap: ${swap.tokenIn?.symbol || 'Token'} → ${swap.tokenOut?.symbol || 'Token'}`));
        
        // Format amounts with proper decimals
        if (swap.amountIn && swap.tokenIn && swap.amountIn !== '0') {
          try {
            const amountFormatted = ethers.formatUnits(swap.amountIn, swap.tokenIn.decimals);
            output.push(`     Amount In: ${amountFormatted} ${swap.tokenIn.symbol}`);
          } catch {
            output.push(`     Amount In: ${swap.amountIn} ${swap.tokenIn.symbol} (raw)`);
          }
        }
        
        if (swap.amountOut && swap.tokenOut && swap.amountOut !== '0') {
          try {
            const amountFormatted = ethers.formatUnits(swap.amountOut, swap.tokenOut.decimals);
            output.push(`     Amount Out: ${amountFormatted} ${swap.tokenOut.symbol}`);
          } catch {
            output.push(`     Amount Out: ${swap.amountOut} ${swap.tokenOut.symbol} (raw)`);
          }
        }
        
        // Show routing for multi-hop swaps
        if (swap.route && swap.route.length > 2) {
          const routeSymbols = swap.route.map((token: any) => token.symbol).join(' → ');
          output.push(chalk.blue(`     Route: ${routeSymbols} (${swap.route.length - 1} hop${swap.route.length > 2 ? 's' : ''})`));
        } else if (swap.isMultiHop) {
          output.push(chalk.blue(`     Route: Multi-hop swap detected`));
        }
        
        // Calculate and show exchange rate if we have both amounts
        if (swap.amountIn && swap.amountOut && swap.tokenIn && swap.tokenOut && 
            swap.amountIn !== '0' && swap.amountOut !== '0') {
          try {
            const amountInFormatted = parseFloat(ethers.formatUnits(swap.amountIn, swap.tokenIn.decimals));
            const amountOutFormatted = parseFloat(ethers.formatUnits(swap.amountOut, swap.tokenOut.decimals));
            
            if (amountInFormatted > 0) {
              const exchangeRate = (amountOutFormatted / amountInFormatted).toFixed(6);
              output.push(chalk.magenta(`     Rate: 1 ${swap.tokenIn.symbol} = ${exchangeRate} ${swap.tokenOut.symbol}`));
            }
          } catch {
            // Skip exchange rate calculation if formatting fails
          }
        }
      }
      
      // Handle liquidity-specific details
      if ((interaction.type === 'liquidity_add' || interaction.type === 'liquidity_remove') && interaction.details.liquidityDetails) {
        const liq = interaction.details.liquidityDetails as any;
        const action = interaction.type === 'liquidity_add' ? 'Add' : 'Remove';
        output.push(chalk.green(`     Liquidity ${action}: ${liq.token0?.symbol || 'Token0'}/${liq.token1?.symbol || 'Token1'}`));
        
        if (liq.amount0 && liq.token0) {
          try {
            const amount0Formatted = ethers.formatUnits(liq.amount0, liq.token0.decimals);
            output.push(`     Token0: ${amount0Formatted} ${liq.token0.symbol}`);
          } catch {
            output.push(`     Token0: ${liq.amount0} ${liq.token0.symbol} (raw)`);
          }
        }
        if (liq.amount1 && liq.token1) {
          try {
            const amount1Formatted = ethers.formatUnits(liq.amount1, liq.token1.decimals);
            output.push(`     Token1: ${amount1Formatted} ${liq.token1.symbol}`);
          } catch {
            output.push(`     Token1: ${liq.amount1} ${liq.token1.symbol} (raw)`);
          }
        }
      }
      
      // Show gas usage if available
      if (interaction.details.gasUsed) {
        const gasUsed = parseInt(interaction.details.gasUsed);
        if (gasUsed > 0) {
          output.push(chalk.cyan(`     Gas Used: ${gasUsed.toLocaleString()}`));
        }
      }
      
      output.push(chalk.gray(`     Contract: ${interaction.contractAddress}`));
      if (interaction.functionName) {
        output.push(chalk.gray(`     Function: ${interaction.functionName}`));
      }
      output.push(chalk.gray(`     Confidence: ${Math.round(interaction.confidence * 100)}%`));
      output.push('');
    }
    
    return output;
  }
}
