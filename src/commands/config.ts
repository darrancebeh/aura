import chalk from 'chalk';
import { ConfigManager } from '../services/config-manager.js';
import { ConfigValidator } from '../services/config-validator.js';
import { NetworkDetector } from '../services/network-detector.js';
import { ConfigKey, ConfigError } from '../types/config.js';

/**
 * Enhanced configuration command handlers with Pass 2 improvements
 * Provides CLI interface for managing Aura configuration with smart validation and error handling
 */

interface ConfigCommandOptions {
  format?: 'human' | 'json';
  verbose?: boolean;
}

/**
 * Handle 'aura config get <key>' command with enhanced error handling
 */
export async function configGetCommand(
  key: string,
  options: any = {}
): Promise<void> {
  try {
    const configManager = new ConfigManager();
    
    // Enhanced key validation with suggestions
    const keyValidation = ConfigValidator.validateConfigKey(key);
    if (!keyValidation.isValid) {
      console.error(chalk.red('❌ Configuration Error:'), keyValidation.errors[0]?.message || 'Invalid key');
      if (keyValidation.suggestions.length > 0) {
        console.log(chalk.yellow('💡 Did you mean:'));
        keyValidation.suggestions.forEach(suggestion => {
          console.log(`   ${chalk.cyan(suggestion)}`);
        });
      }
      process.exit(1);
    }
    
    const value = await configManager.getValue(key as ConfigKey);

    if (options.json) {
      console.log(JSON.stringify({ key, value }, null, 2));
    } else {
      if (value === undefined) {
        console.log(chalk.yellow(`⚠️  Configuration key '${key}' is not set`));
        
        // Provide helpful context for empty values
        if (key.startsWith('rpc.')) {
          const network = key.split('.')[1];
          console.log(chalk.blue('💡 Set it with:'), chalk.cyan(`aura config rpc ${network} <url>`));
          
          // Show provider recommendations
          const recommendations = NetworkDetector.getProviderRecommendations(network);
          if (recommendations.providers.length > 0) {
            console.log(chalk.blue('📋 Recommended providers:'));
            recommendations.providers.slice(0, 2).forEach(rec => {
              console.log(`   • ${rec.provider.name}: ${rec.reason}`);
            });
          }
        }
      } else {
        console.log(chalk.green(`✅ ${key}:`), formatValueForDisplay(value));
        
        // Show additional context for RPC URLs
        if (key.startsWith('rpc.') && typeof value === 'string') {
          const provider = NetworkDetector.detectProvider(value);
          console.log(chalk.blue(`   📊 Provider: ${provider.name} (${provider.type})`));
          console.log(chalk.blue(`   🔍 Trace support: ${provider.traceSupport ? '✅' : '❌'}`));
        }
      }
    }
  } catch (error) {
    handleConfigError(error, options.verbose);
  }
}

/**
 * Handle 'aura config set <key> <value>' command with enhanced validation
 */
export async function configSetCommand(
  key: string,
  value: string,
  options: any = {}
): Promise<void> {
  try {
    const configManager = new ConfigManager();
    
    // Enhanced key validation
    const keyValidation = ConfigValidator.validateConfigKey(key);
    if (!keyValidation.isValid) {
      console.error(chalk.red('❌ Invalid configuration key:'), keyValidation.errors[0]?.message || 'Invalid key');
      if (keyValidation.suggestions.length > 0) {
        console.log(chalk.yellow('💡 Did you mean:'));
        keyValidation.suggestions.forEach(suggestion => {
          console.log(`   ${chalk.cyan(suggestion)}`);
        });
      }
      process.exit(1);
    }
    
    // Parse value based on key type
    const parsedValue = parseValueByKey(key, value);
    
    // Enhanced value validation
    const valueValidation = ConfigValidator.validateConfigValue(key, parsedValue);
    if (!valueValidation.isValid) {
      console.error(chalk.red('❌ Invalid configuration value:'));
      valueValidation.errors.forEach(error => {
        console.error(`   ${error.message}`);
        if (error.suggestion) {
          console.log(chalk.yellow(`   💡 ${error.suggestion}`));
        }
      });
      process.exit(1);
    }
    
    // Show warnings if any
    if (valueValidation.warnings.length > 0) {
      valueValidation.warnings.forEach(warning => {
        console.log(chalk.yellow(`⚠️  ${warning.message}`));
        if (warning.suggestion) {
          console.log(chalk.blue(`   💡 ${warning.suggestion}`));
        }
      });
    }
    
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
 * Handle 'aura config rpc <network> [url]' command with enhanced validation and testing
 */
export async function configRpcCommand(
  network: string,
  url?: string,
  options: any = {}
): Promise<void> {
  try {
    const configManager = new ConfigManager();

    // Enhanced network validation
    const networkValidation = ConfigValidator.validateNetworkName(network);
    if (!networkValidation.isValid) {
      console.error(chalk.red('❌ Invalid network:'), networkValidation.errors[0]?.message || 'Invalid network');
      if (networkValidation.suggestions.length > 0) {
        console.log(chalk.yellow('💡 Did you mean:'));
        networkValidation.suggestions.forEach(suggestion => {
          console.log(`   ${chalk.cyan(suggestion)}`);
        });
      }
      process.exit(1);
    }

    if (url) {
      // Enhanced URL validation
      const urlValidation = ConfigValidator.validateConfigValue(`rpc.${network}`, url);
      if (!urlValidation.isValid) {
        console.error(chalk.red('❌ Invalid RPC URL:'));
        urlValidation.errors.forEach(error => {
          console.error(`   ${error.message}`);
        });
        process.exit(1);
      }

      // Test connection before saving
      console.log(chalk.blue('🧪 Testing RPC connection...'));
      const testResult = await NetworkDetector.testRpcConnection(url, network);
      
      if (!testResult.connected) {
        console.error(chalk.red('❌ Connection test failed:'), testResult.error);
        console.log(chalk.yellow('⚠️  URL will be saved anyway. Use --force to skip testing.'));
        
        if (!options.force) {
          process.exit(1);
        }
      } else {
        console.log(chalk.green('✅ Connection successful!'));
        console.log(chalk.blue(`   📊 Latest block: ${testResult.blockNumber}`));
        console.log(chalk.blue(`   ⚡ Latency: ${testResult.latency}ms`));
        
        if (testResult.capabilities) {
          console.log(chalk.blue(`   🔍 Trace support: ${testResult.capabilities.traceSupport ? '✅' : '❌'}`));
          console.log(chalk.blue(`   📚 Archive support: ${testResult.capabilities.archiveSupport ? '✅' : '❌'}`));
        }
        
        if (testResult.provider) {
          console.log(chalk.blue(`   🏷️  Provider: ${testResult.provider.name} (${testResult.provider.type})`));
        }
      }
      
      // Set RPC URL
      await configManager.setRpcUrl(network, url);
      
      if (options.json) {
        console.log(JSON.stringify({ 
          success: true, 
          network, 
          rpcUrl: url,
          testResult 
        }, null, 2));
      } else {
        console.log(chalk.green(`✅ RPC URL updated for ${network}`));
        console.log(chalk.gray(`${network}: ${url}`));
      }
    } else {
      // Get RPC URL with enhanced display
      const rpcUrl = await configManager.getRpcUrl(network);
      
      if (options.json) {
        console.log(JSON.stringify({ network, rpcUrl }, null, 2));
      } else {
        if (rpcUrl) {
          console.log(chalk.green(`✅ ${network}:`), rpcUrl);
          
          // Show provider info
          const provider = NetworkDetector.detectProvider(rpcUrl);
          console.log(chalk.blue(`   📊 Provider: ${provider.name} (${provider.type})`));
          console.log(chalk.blue(`   🔍 Trace support: ${provider.traceSupport ? '✅' : '❌'}`));
        } else {
          console.log(chalk.yellow(`⚠️  No RPC URL configured for ${network}`));
          console.log(chalk.blue('💡 Configure with:'), chalk.cyan(`aura config rpc ${network} <url>`));
          
          // Show recommendations
          const recommendations = NetworkDetector.getProviderRecommendations(network);
          if (recommendations.providers.length > 0) {
            console.log(chalk.blue('📋 Recommended providers:'));
            recommendations.providers.slice(0, 2).forEach(rec => {
              console.log(`   • ${rec.provider.name}: ${rec.reason}`);
            });
          }
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
