import chalk from 'chalk';
import { ethers } from 'ethers';
import { ParsedTrace, ParsedCall, ParsedEvent, InspectOptions } from '../types/index.js';

/**
 * Formatter for creating human-readable trace output
 * Handles color coding, indentation, and various display options
 */
export class TraceFormatter {
  
  /**
   * Format complete trace for display
   */
  formatTrace(trace: ParsedTrace, options: InspectOptions): string[] {
    const output: string[] = [];
    
    // Add transaction summary
    output.push(...this.formatTransactionSummary(trace));
    output.push('');
    
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
    
    // Contract address (shortened)
    line += chalk.cyan(this.shortenAddress(call.to));
    
    // Function call if decoded
    if (call.decodedFunction) {
      line += chalk.white('.') + chalk.green(call.decodedFunction.name) + chalk.white('(');
      
      const params = call.decodedFunction.inputs.map(input => {
        const value = this.formatParameterValue(input.value, input.type);
        return `${chalk.yellow(input.name)}: ${chalk.white(value)}`;
      }).join(', ');
      
      line += params + chalk.white(')');
    } else if (call.type === 'create' || call.type === 'create2') {
      line += chalk.magenta(' [Contract Creation]');
    } else {
      line += chalk.gray(' [Unknown Function]');
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
        const value = this.formatParameterValue(input.value, input.type);
        return `${chalk.yellow(input.name)}: ${chalk.white(value)}`;
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
          const value = this.formatParameterValue(input.value, input.type);
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
   * Format parameter values for display
   */
  private formatParameterValue(value: any, type: string): string {
    if (type === 'address') {
      return this.shortenAddress(value.toString());
    }
    
    if (type.startsWith('uint') || type.startsWith('int')) {
      const num = value.toString();
      // Format large numbers with commas
      if (num.length > 6) {
        return parseInt(num).toLocaleString();
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
}
