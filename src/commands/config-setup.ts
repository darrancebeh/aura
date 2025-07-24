import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { ConfigManager } from '../services/config-manager.js';
import { NetworkDetector } from '../services/network-detector.js';
import { SUPPORTED_NETWORKS } from '../utils/config.js';
import { ConfigError } from '../types/config.js';

const execAsync = promisify(exec);

/**
 * Interactive configuration setup commands
 * Provides guided setup flows for first-time users and configuration management
 */

interface SetupFlow {
  step: number;
  totalSteps: number;
  network?: string;
  provider?: string;
  rpcUrl?: string;
}

export class ConfigSetup {
  
  /**
   * Check if this is a first-time user
   */
  static async isFirstTimeUser(): Promise<boolean> {
    try {
      const configManager = new ConfigManager();
      const configPath = configManager.getPaths().configFile;
      await fs.access(configPath);
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Interactive first-time setup
   */
  static async runFirstTimeSetup(): Promise<void> {
    const isFirstTime = await this.isFirstTimeUser();
    
    if (!isFirstTime) {
      console.log('✅ Aura is already configured!');
      console.log('   Use "aura config --help" to manage your configuration');
      return;
    }

    console.log('🌟 Welcome to Aura! Let\'s set up your configuration.\n');
    
    const flow: SetupFlow = { step: 1, totalSteps: 3 };
    
    // Step 1: Choose primary network
    await this.setupPrimaryNetwork(flow);
    
    // Step 2: Configure RPC provider
    await this.setupRpcProvider(flow);
    
    // Step 3: Test configuration
    await this.testConfiguration(flow);
    
    console.log('\n🎉 Setup complete! Aura is ready to use.');
    console.log('   Try: aura inspect <transaction_hash>');
  }

  /**
   * Step 1: Setup primary network
   */
  static async setupPrimaryNetwork(flow: SetupFlow): Promise<void> {
    console.log(`\n📡 Step ${flow.step}/${flow.totalSteps}: Choose your primary network`);
    console.log('   This will be used as the default for transaction analysis.\n');
    
    const networks = Object.keys(SUPPORTED_NETWORKS);
    networks.forEach((network, index) => {
      const networkInfo = SUPPORTED_NETWORKS[network];
      console.log(`   ${index + 1}. ${network} (Chain ID: ${networkInfo.chainId})`);
    });
    
    // For demo purposes, we'll default to ethereum
    // In a real implementation, you'd use readline or inquirer for interactive input
    const defaultNetwork = 'ethereum';
    flow.network = defaultNetwork;
    
    console.log(`\n✅ Selected: ${defaultNetwork}`);
    flow.step++;
  }

  /**
   * Step 2: Setup RPC provider
   */
  static async setupRpcProvider(flow: SetupFlow): Promise<void> {
    if (!flow.network) return;
    
    console.log(`\n🔗 Step ${flow.step}/${flow.totalSteps}: Configure RPC provider for ${flow.network}`);
    console.log('   We recommend providers with good trace support for transaction analysis.\n');
    
    const recommendations = NetworkDetector.getProviderRecommendations(flow.network);
    
    console.log('   Recommended providers:');
    recommendations.providers.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.provider.name} - ${rec.reason}`);
      if (rec.provider.setupUrl) {
        console.log(`      Setup: ${rec.provider.setupUrl}`);
      }
      console.log(`      URL format: ${rec.url}`);
      console.log('');
    });
    
    // Try to find a working public provider as fallback
    console.log('   🔍 Testing public providers...');
    const workingProvider = await NetworkDetector.findWorkingProvider(flow.network);
    
    if (workingProvider) {
      console.log(`   ✅ Found working provider: ${workingProvider}`);
      flow.rpcUrl = workingProvider;
      
      // Store the configuration
      const configManager = new ConfigManager();
      await configManager.setRpcUrl(flow.network, workingProvider);
      await configManager.setValue('defaultNetwork', flow.network);
    } else {
      console.log('   ⚠️  No working public providers found');
      console.log('   You can configure a provider later with: aura config rpc <network> <url>');
    }
    
    flow.step++;
  }

  /**
   * Step 3: Test configuration
   */
  static async testConfiguration(flow: SetupFlow): Promise<void> {
    if (!flow.network || !flow.rpcUrl) {
      console.log(`\n⏭️  Step ${flow.step}/${flow.totalSteps}: Skipped (no RPC configured)`);
      return;
    }
    
    console.log(`\n🧪 Step ${flow.step}/${flow.totalSteps}: Testing configuration`);
    
    const testResult = await NetworkDetector.testRpcConnection(flow.rpcUrl, flow.network);
    
    if (testResult.connected) {
      console.log('   ✅ Connection successful!');
      console.log(`   📊 Latest block: ${testResult.blockNumber}`);
      console.log(`   ⚡ Latency: ${testResult.latency}ms`);
      
      if (testResult.capabilities) {
        console.log(`   🔍 Trace support: ${testResult.capabilities.traceSupport ? '✅' : '❌'}`);
        console.log(`   📚 Archive support: ${testResult.capabilities.archiveSupport ? '✅' : '❌'}`);
      }
      
      if (testResult.provider) {
        console.log(`   🏷️  Provider: ${testResult.provider.name}`);
      }
    } else {
      console.log('   ❌ Connection failed');
      console.log(`   Error: ${testResult.error}`);
    }
  }

  /**
   * Interactive provider setup wizard
   */
  static async setupProvider(network: string, providerType?: string): Promise<void> {
    console.log(`\n🔧 Setting up RPC provider for ${network}`);
    
    if (!SUPPORTED_NETWORKS[network]) {
      throw new ConfigError(`Unsupported network: ${network}`, 'INVALID_NETWORK');
    }
    
    if (!providerType) {
      // Show recommendations
      const recommendations = NetworkDetector.getProviderRecommendations(network);
      console.log('\nRecommended providers:');
      recommendations.providers.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.provider.name} - ${rec.reason}`);
      });
      
      console.log('\nFor this demo, we\'ll show Tenderly setup instructions:');
      providerType = 'tenderly';
    }
    
    // Show setup instructions
    if (providerType === 'tenderly' || providerType === 'alchemy' || providerType === 'infura') {
      const instructions = NetworkDetector.getProviderSetupInstructions(providerType);
      console.log(`\n📋 ${providerType.charAt(0).toUpperCase() + providerType.slice(1)} Setup Instructions:`);
      instructions.forEach(instruction => console.log(`   ${instruction}`));
    }
    
    // Test public fallback
    console.log('\n🔍 Looking for working public providers...');
    const fallbackUrl = await NetworkDetector.findWorkingProvider(network);
    
    if (fallbackUrl) {
      console.log(`✅ Found fallback provider: ${fallbackUrl}`);
      console.log('   You can use this temporarily while setting up your preferred provider.');
      
      // Optionally set as temporary provider
      const configManager = new ConfigManager();
      await configManager.setRpcUrl(network, fallbackUrl);
      console.log(`   Temporarily configured for ${network} network.`);
    }
  }

  /**
   * Health check for current configuration
   */
  static async healthCheck(): Promise<void> {
    console.log('🏥 Running Aura configuration health check...\n');
    
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      
      // Check if config exists
      if (Object.keys(config).length === 0) {
        console.log('❌ No configuration found');
        console.log('   Run: aura config setup');
        return;
      }
      
      console.log('✅ Configuration file exists');
      
      // Check default network
      const defaultNetwork = config.defaultNetwork;
      if (defaultNetwork) {
        console.log(`✅ Default network: ${defaultNetwork}`);
      } else {
        console.log('⚠️  No default network configured');
        console.log('   Run: aura config set defaultNetwork <network>');
      }
      
      // Check RPC configurations
      const rpcConfig = config.rpcEndpoints || {};
      const networks = Object.keys(rpcConfig);
      
      if (networks.length === 0) {
        console.log('❌ No RPC providers configured');
        console.log('   Run: aura config rpc <network> <url>');
        return;
      }
      
      console.log(`\n📡 Testing ${networks.length} RPC provider(s)...`);
      
      for (const network of networks) {
        const rpcUrl = rpcConfig[network];
        console.log(`\n🧪 Testing ${network}: ${rpcUrl}`);
        
        const result = await NetworkDetector.testRpcConnection(rpcUrl, network);
        
        if (result.connected) {
          console.log(`   ✅ Connected (${result.latency}ms)`);
          console.log(`   📊 Block: ${result.blockNumber}`);
          
          if (result.capabilities) {
            console.log(`   🔍 Trace: ${result.capabilities.traceSupport ? '✅' : '❌'}`);
            console.log(`   📚 Archive: ${result.capabilities.archiveSupport ? '✅' : '❌'}`);
          }
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
          console.log('   💡 Try: aura config rpc ' + network + ' <new_url>');
        }
      }
      
      console.log('\n🎯 Configuration analysis complete!');
      
    } catch (error) {
      console.log('❌ Health check failed:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Guided network migration
   */
  static async migrateNetwork(fromNetwork: string, toNetwork: string): Promise<void> {
    console.log(`\n🔄 Migrating configuration from ${fromNetwork} to ${toNetwork}`);
    
    // Validate networks
    if (!SUPPORTED_NETWORKS[fromNetwork] || !SUPPORTED_NETWORKS[toNetwork]) {
      throw new ConfigError('Invalid source or target network', 'INVALID_NETWORK');
    }
    
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();
    
    // Check if source network has RPC configured
    const sourceRpc = config.rpcEndpoints?.[fromNetwork];
    if (!sourceRpc) {
      console.log(`⚠️  No RPC configured for ${fromNetwork}`);
      return;
    }
    
    console.log(`📋 Current ${fromNetwork} RPC: ${sourceRpc}`);
    
    // Get recommendations for target network
    const recommendations = NetworkDetector.getProviderRecommendations(toNetwork);
    console.log(`\n💡 Recommendations for ${toNetwork}:`);
    recommendations.providers.slice(0, 2).forEach(rec => {
      console.log(`   • ${rec.provider.name}: ${rec.reason}`);
    });
    
    // Try to find working provider for target network
    console.log(`\n🔍 Finding working provider for ${toNetwork}...`);
    const workingProvider = await NetworkDetector.findWorkingProvider(toNetwork);
    
    if (workingProvider) {
      const configManager = new ConfigManager();
      await configManager.setRpcUrl(toNetwork, workingProvider);
      console.log(`✅ Configured ${toNetwork} with: ${workingProvider}`);
      
      // Update default network if it was the source
      if (config.defaultNetwork === fromNetwork) {
        await configManager.setValue('defaultNetwork', toNetwork);
        console.log(`✅ Updated default network to ${toNetwork}`);
      }
    } else {
      console.log(`❌ Could not find working provider for ${toNetwork}`);
      console.log('   Please configure manually with: aura config rpc ' + toNetwork + ' <url>');
    }
  }

  /**
   * Environment-specific setup (development, staging, production)
   */
  static async setupEnvironment(env: 'dev' | 'staging' | 'prod'): Promise<void> {
    console.log(`\n🏗️  Setting up ${env} environment configuration`);
    
    const envConfig: Record<string, any> = {};
    
    switch (env) {
      case 'dev':
        envConfig.environment = 'development';
        envConfig.debug = true;
        envConfig.verbose = true;
        console.log('   📝 Enabled debug and verbose logging');
        
        // Set up Tenderly for development (best for debugging)
        console.log('   🔧 Recommending Tenderly for development (excellent trace support)');
        console.log('   📋 Setup: https://tenderly.co');
        break;
        
      case 'staging':
        envConfig.environment = 'staging';
        envConfig.debug = false;
        envConfig.verbose = false;
        console.log('   🎭 Production-like configuration');
        break;
        
      case 'prod':
        envConfig.environment = 'production';
        envConfig.debug = false;
        envConfig.verbose = false;
        envConfig.errorReporting = true;
        console.log('   🏭 Production configuration with error reporting');
        break;
    }
    
    // Apply configuration
    const configManager = new ConfigManager();
    for (const [key, value] of Object.entries(envConfig)) {
      await configManager.setValue(key as any, value);
    }
    
    console.log(`✅ ${env} environment configured`);
  }
}

/**
 * Register setup commands
 */
export function registerSetupCommands(program: Command): void {
  const setupCmd = program
    .command('setup')
    .description('Interactive configuration setup and management');

  // Main setup command
  setupCmd
    .command('init')
    .description('Run first-time interactive setup')
    .action(async () => {
      try {
        await ConfigSetup.runFirstTimeSetup();
      } catch (error) {
        console.error('Setup failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Provider setup
  setupCmd
    .command('provider <network> [type]')
    .description('Setup RPC provider for a network')
    .action(async (network: string, type?: string) => {
      try {
        await ConfigSetup.setupProvider(network, type);
      } catch (error) {
        console.error('Provider setup failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Health check
  setupCmd
    .command('check')
    .alias('health')
    .description('Run configuration health check')
    .action(async () => {
      try {
        await ConfigSetup.healthCheck();
      } catch (error) {
        console.error('Health check failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Network migration
  setupCmd
    .command('migrate <from> <to>')
    .description('Migrate configuration from one network to another')
    .action(async (from: string, to: string) => {
      try {
        await ConfigSetup.migrateNetwork(from, to);
      } catch (error) {
        console.error('Migration failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Environment setup
  setupCmd
    .command('env <environment>')
    .description('Setup environment-specific configuration')
    .action(async (env: string) => {
      try {
        if (!['dev', 'staging', 'prod'].includes(env)) {
          throw new Error('Environment must be: dev, staging, or prod');
        }
        await ConfigSetup.setupEnvironment(env as 'dev' | 'staging' | 'prod');
      } catch (error) {
        console.error('Environment setup failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
