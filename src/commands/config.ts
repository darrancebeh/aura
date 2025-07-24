import chalk from 'chalk';
import { ConfigManager } from '../services/config-manager.js';
import { ConfigKey, ConfigError } from '../types/config.js';

/**
 * Configuration command handlers
 * Provides CLI interface for managing Aura configuration
 */

interface ConfigCommandOptions {
  format?: 'human' | 'json';
  verbose?: boolean;
}

/**
 * Handle 'aura config get <key>' command
 */
export async function configGetCommand(
  key: string,
  options: any = {}
): Promise<void> {
  try {
    const configManager = new ConfigManager();
    const value = await configManager.getValue(key as ConfigKey);

    if (options.json) {
      console.log(JSON.stringify({ key, value }, null, 2));
    } else {
      if (value === undefined) {
        console.log(chalk.yellow(`Configuration key '${key}' is not set`));
      } else {
        console.log(chalk.green(`${key}:`), formatValueForDisplay(value));
      }
    }
  } catch (error) {
    handleConfigError(error, options.verbose);
  }
}

/**
 * Handle 'aura config set <key> <value>' command
 */
export async function configSetCommand(
  key: string,
  value: string,
  options: any = {}
): Promise<void> {
  try {
    const configManager = new ConfigManager();
    
    // Parse value based on key type
    const parsedValue = parseValueByKey(key, value);
    
    await configManager.setValue(key as ConfigKey, parsedValue);
    
    if (options.json) {
      console.log(JSON.stringify({ 
        success: true, 
        key, 
        value: parsedValue 
      }, null, 2));
    } else {
      console.log(chalk.green('✅ Configuration updated'));
      console.log(chalk.gray(`${key} = ${formatValueForDisplay(parsedValue)}`));
    }
  } catch (error) {
    handleConfigError(error, options.verbose);
  }
}

/**
 * Handle 'aura config list' command
 */
export async function configListCommand(
  options: any = {}
): Promise<void> {
  try {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();

    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
    } else {
      displayConfigHuman(config);
    }
  } catch (error) {
    handleConfigError(error, options.verbose);
  }
}

/**
 * Handle 'aura config reset' command
 */
export async function configResetCommand(
  options: any = {}
): Promise<void> {
  try {
    const configManager = new ConfigManager();
    await configManager.resetConfig();
    
    if (options.json) {
      console.log(JSON.stringify({ success: true, message: 'Configuration reset to defaults' }));
    } else {
      console.log(chalk.green('✅ Configuration reset to defaults'));
      console.log(chalk.gray('Previous configuration backed up automatically'));
    }
  } catch (error) {
    handleConfigError(error, options.verbose);
  }
}

/**
 * Handle 'aura config path' command
 */
export async function configPathCommand(
  options: any = {}
): Promise<void> {
  try {
    const configManager = new ConfigManager();
    const paths = configManager.getPaths();

    if (options.json) {
      console.log(JSON.stringify(paths, null, 2));
    } else {
      console.log(chalk.bold('📂 Aura Configuration Paths:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.cyan('Config Directory:')} ${paths.configDir}`);
      console.log(`${chalk.cyan('Config File:')} ${paths.configFile}`);
      console.log(`${chalk.cyan('Cache Directory:')} ${paths.cacheDir}`);
      console.log(`${chalk.cyan('Backup Directory:')} ${paths.backupDir}`);
    }
  } catch (error) {
    handleConfigError(error, options.verbose);
  }
}

/**
 * Handle 'aura config rpc <network> [url]' command
 */
export async function configRpcCommand(
  network: string,
  url?: string,
  options: any = {}
): Promise<void> {
  try {
    const configManager = new ConfigManager();

    if (url) {
      // Set RPC URL
      await configManager.setRpcUrl(network, url);
      
      if (options.json) {
        console.log(JSON.stringify({ 
          success: true, 
          network, 
          rpcUrl: url 
        }, null, 2));
      } else {
        console.log(chalk.green(`✅ RPC URL updated for ${network}`));
        console.log(chalk.gray(`${network}: ${url}`));
      }
    } else {
      // Get RPC URL
      const rpcUrl = await configManager.getRpcUrl(network);
      
      if (options.json) {
        console.log(JSON.stringify({ network, rpcUrl }, null, 2));
      } else {
        if (rpcUrl) {
          console.log(chalk.green(`${network}:`), rpcUrl);
        } else {
          console.log(chalk.yellow(`No RPC URL configured for ${network}`));
        }
      }
    }
  } catch (error) {
    handleConfigError(error, options.verbose);
  }
}

/**
 * Display configuration in human-readable format
 */
function displayConfigHuman(config: any): void {
  console.log(chalk.bold('🔧 Aura Configuration'));
  console.log(chalk.gray('─'.repeat(60)));
  
  // Basic settings
  console.log(chalk.bold('\n📋 General Settings:'));
  console.log(`  ${chalk.cyan('Version:')} ${config.version}`);
  console.log(`  ${chalk.cyan('Default Network:')} ${config.defaultNetwork}`);
  console.log(`  ${chalk.cyan('Created:')} ${new Date(config.createdAt).toLocaleString()}`);
  console.log(`  ${chalk.cyan('Updated:')} ${new Date(config.updatedAt).toLocaleString()}`);

  // Display settings
  console.log(chalk.bold('\n🎨 Display Settings:'));
  Object.entries(config.settings).forEach(([key, value]) => {
    console.log(`  ${chalk.cyan(key + ':')} ${formatValueForDisplay(value)}`);
  });

  // Networks
  console.log(chalk.bold('\n🌐 Networks:'));
  Object.entries(config.networks).forEach(([name, network]: [string, any]) => {
    const customTag = network.isCustom ? chalk.yellow(' [custom]') : '';
    console.log(`  ${chalk.cyan(name + ':')} ${network.name}${customTag}`);
    console.log(`    ${chalk.gray('Chain ID:')} ${network.chainId}`);
    console.log(`    ${chalk.gray('RPC:')} ${network.rpcUrl}`);
    console.log(`    ${chalk.gray('Explorer:')} ${network.explorer}`);
  });

  // RPC Endpoints
  if (Object.keys(config.rpcEndpoints).length > 0) {
    console.log(chalk.bold('\n🔗 Custom RPC Endpoints:'));
    Object.entries(config.rpcEndpoints).forEach(([network, url]) => {
      console.log(`  ${chalk.cyan(network + ':')} ${url}`);
    });
  }

  console.log(chalk.gray('\n─'.repeat(60)));
}

/**
 * Parse string value based on configuration key
 */
function parseValueByKey(key: string, value: string): any {
  // Boolean values
  if (key.includes('Output') || key.includes('Mode') || key.includes('Enabled')) {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
      return true;
    } else if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
      return false;
    } else {
      throw new ConfigError(`Invalid boolean value: ${value}. Use true/false, 1/0, or yes/no.`, 'INVALID_BOOLEAN');
    }
  }

  // Number values
  if (key.includes('Depth') || key.includes('chainId')) {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      throw new ConfigError(`Invalid number value: ${value}`, 'INVALID_NUMBER');
    }
    return numValue;
  }

  // String values (default)
  return value;
}

/**
 * Format value for human-readable display
 */
function formatValueForDisplay(value: any): string {
  if (typeof value === 'boolean') {
    return value ? chalk.green('true') : chalk.red('false');
  }
  if (typeof value === 'number') {
    return chalk.yellow(value.toString());
  }
  if (typeof value === 'string') {
    return chalk.white(value);
  }
  if (value === null || value === undefined) {
    return chalk.gray('(not set)');
  }
  return chalk.white(JSON.stringify(value));
}

/**
 * Handle configuration errors with proper formatting
 */
function handleConfigError(error: unknown, verbose?: boolean): void {
  if (error instanceof ConfigError) {
    console.error(chalk.red(`❌ Configuration Error: ${error.message}`));
    if (verbose && error.code) {
      console.error(chalk.gray(`Code: ${error.code}`));
    }
  } else {
    console.error(chalk.red('❌ Unexpected configuration error'));
    if (verbose) {
      console.error(chalk.gray(error instanceof Error ? error.stack : String(error)));
    }
  }
  process.exit(1);
}
