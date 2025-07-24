#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { inspectCommand } from '../commands/inspect.js';
import { SUPPORTED_NETWORKS } from '../utils/config.js';

const program = new Command();

// CLI metadata
program
  .name('aura')
  .description('On-chain transaction inspector for Web3 developers')
  .version('0.1.0', '-v, --version', 'display version number');

// Inspect command
program
  .command('inspect')
  .description('Inspect a transaction and display its execution trace')
  .argument('<txHash>', 'transaction hash to inspect')
  .option('-n, --network <network>', `blockchain network (${Object.keys(SUPPORTED_NETWORKS).join(', ')})`, 'ethereum')
  .option('--verbose', 'enable verbose error reporting')
  .option('--depth <number>', 'limit call stack depth', parseInt)
  .option('--contracts-only', 'show only contract calls')
  .option('--events-only', 'show only events')
  .option('--json', 'output raw trace data in JSON format')
  .action(async (txHash: string, options: any) => {
    await inspectCommand(txHash, options);
  });

// Help and examples
program.on('--help', () => {
  console.log('');
  console.log(chalk.bold('Examples:'));
  console.log('  $ aura inspect 0x1234...abcd');
  console.log('  $ aura inspect 0x1234...abcd --network polygon');
  console.log('  $ aura inspect 0x1234...abcd --depth 3');
  console.log('  $ aura inspect 0x1234...abcd --contracts-only');
  console.log('  $ aura inspect 0x1234...abcd --events-only');
  console.log('  $ aura inspect 0x1234...abcd --json');
  console.log('  $ aura inspect 0x1234...abcd --verbose');
  console.log('');
  console.log(chalk.bold('Supported Networks:'));
  Object.entries(SUPPORTED_NETWORKS).forEach(([key, config]) => {
    console.log(`  ${chalk.cyan(key.padEnd(10))} ${config.name} (Chain ID: ${config.chainId})`);
  });
});

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('❌ Invalid command: %s'), program.args.join(' '));
  console.log(chalk.gray('See --help for a list of available commands.'));
  process.exit(1);
});

// Parse CLI arguments
program.parse();
