import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { AuraConfig, ConfigValidationResult, ConfigPaths, ConfigKey, ConfigError, UserNetworkConfig } from '../types/config.js';
import { SUPPORTED_NETWORKS } from '../utils/config.js';

/**
 * Configuration Manager for Aura CLI
 * Handles reading, writing, and validating user configuration
 * Stores config in ~/.aura/config.json
 */
export class ConfigManager {
  private config: AuraConfig | null = null;
  private paths: ConfigPaths;

  constructor() {
    this.paths = this.initializePaths();
    this.ensureConfigDirectory();
  }

  /**
   * Initialize configuration paths
   */
  private initializePaths(): ConfigPaths {
    const configDir = join(homedir(), '.aura');
    return {
      configDir,
      configFile: join(configDir, 'config.json'),
      cacheDir: join(configDir, 'cache'),
      backupDir: join(configDir, 'backups')
    };
  }

  /**
   * Ensure configuration directory structure exists
   */
  private ensureConfigDirectory(): void {
    try {
      if (!existsSync(this.paths.configDir)) {
        mkdirSync(this.paths.configDir, { recursive: true });
      }
      if (!existsSync(this.paths.cacheDir)) {
        mkdirSync(this.paths.cacheDir, { recursive: true });
      }
      if (!existsSync(this.paths.backupDir)) {
        mkdirSync(this.paths.backupDir, { recursive: true });
      }
    } catch (error) {
      throw new ConfigError(
        `Failed to create config directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONFIG_DIR_ERROR'
      );
    }
  }

  /**
   * Load configuration from file or create default if not exists
   */
  async loadConfig(): Promise<AuraConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      if (existsSync(this.paths.configFile)) {
        const configData = readFileSync(this.paths.configFile, 'utf8');
        const parsedConfig = JSON.parse(configData);
        
        // Validate and migrate if needed
        const validationResult = this.validateConfig(parsedConfig);
        if (!validationResult.isValid) {
          throw new ConfigError(
            `Invalid configuration: ${validationResult.errors.join(', ')}`,
            'INVALID_CONFIG'
          );
        }

        this.config = parsedConfig;
      } else {
        // Create default configuration
        this.config = this.createDefaultConfig();
        await this.saveConfig();
      }

      return this.config!;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      throw new ConfigError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONFIG_LOAD_ERROR'
      );
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new ConfigError('No configuration to save', 'NO_CONFIG');
    }

    try {
      // Create backup before saving
      if (existsSync(this.paths.configFile)) {
        const backupPath = join(
          this.paths.backupDir, 
          `config-${Date.now()}.json.bak`
        );
        copyFileSync(this.paths.configFile, backupPath);
      }

      // Update timestamp
      this.config.updatedAt = new Date().toISOString();

      // Write configuration
      const configJson = JSON.stringify(this.config, null, 2);
      writeFileSync(this.paths.configFile, configJson, 'utf8');
    } catch (error) {
      throw new ConfigError(
        `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONFIG_SAVE_ERROR'
      );
    }
  }

  /**
   * Get configuration value by key (supports dot notation)
   */
  async getValue(key: ConfigKey): Promise<any> {
    const config = await this.loadConfig();
    return this.getNestedValue(config, key);
  }

  /**
   * Set configuration value by key (supports dot notation)
   */
  async setValue(key: ConfigKey, value: any): Promise<void> {
    const config = await this.loadConfig();
    
    // Validate the value based on the key
    this.validateKeyValue(key, value);
    
    // Set the value
    this.setNestedValue(config, key, value);
    
    // Save the updated configuration
    await this.saveConfig();
  }

  /**
   * Get entire configuration
   */
  async getConfig(): Promise<AuraConfig> {
    return await this.loadConfig();
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfig(): Promise<void> {
    // Create backup before reset
    if (existsSync(this.paths.configFile)) {
      const backupPath = join(
        this.paths.backupDir, 
        `config-reset-${Date.now()}.json.bak`
      );
      copyFileSync(this.paths.configFile, backupPath);
    }

    this.config = this.createDefaultConfig();
    await this.saveConfig();
  }

  /**
   * Get configuration file paths
   */
  getPaths(): ConfigPaths {
    return { ...this.paths };
  }

  /**
   * Get RPC URL for a network (with fallback to environment)
   */
  async getRpcUrl(network: string): Promise<string | null> {
    const config = await this.loadConfig();
    
    // Check config file first
    if (config.rpcEndpoints[network]) {
      return config.rpcEndpoints[network];
    }
    
    // Check network-specific config
    if (config.networks[network]?.rpcUrl) {
      return config.networks[network].rpcUrl;
    }
    
    // Fallback to built-in networks
    if (SUPPORTED_NETWORKS[network]) {
      return SUPPORTED_NETWORKS[network].rpcUrl;
    }
    
    return null;
  }

  /**
   * Set RPC URL for a network
   */
  async setRpcUrl(network: string, rpcUrl: string): Promise<void> {
    const config = await this.loadConfig();
    
    // Validate URL format
    try {
      new URL(rpcUrl);
    } catch {
      throw new ConfigError(`Invalid RPC URL format: ${rpcUrl}`, 'INVALID_URL');
    }
    
    config.rpcEndpoints[network] = rpcUrl;
    await this.saveConfig();
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): AuraConfig {
    const now = new Date().toISOString();
    
    return {
      version: '0.1.0',
      defaultNetwork: 'ethereum',
      networks: { ...SUPPORTED_NETWORKS },
      settings: {
        outputFormat: 'human',
        colorOutput: true,
        verboseMode: false,
        cacheEnabled: true,
        defaultDepth: undefined
      },
      rpcEndpoints: {},
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: any): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!config.version) errors.push('Missing version field');
    if (!config.defaultNetwork) errors.push('Missing defaultNetwork field');
    if (!config.networks) errors.push('Missing networks field');
    if (!config.settings) errors.push('Missing settings field');
    if (!config.rpcEndpoints) errors.push('Missing rpcEndpoints field');

    // Validate settings
    if (config.settings) {
      const { outputFormat, colorOutput, verboseMode, cacheEnabled } = config.settings;
      
      if (outputFormat && !['human', 'json'].includes(outputFormat)) {
        errors.push('Invalid outputFormat: must be "human" or "json"');
      }
      
      if (colorOutput !== undefined && typeof colorOutput !== 'boolean') {
        errors.push('Invalid colorOutput: must be boolean');
      }
      
      if (verboseMode !== undefined && typeof verboseMode !== 'boolean') {
        errors.push('Invalid verboseMode: must be boolean');
      }
      
      if (cacheEnabled !== undefined && typeof cacheEnabled !== 'boolean') {
        errors.push('Invalid cacheEnabled: must be boolean');
      }
    }

    // Validate networks
    if (config.networks && typeof config.networks === 'object') {
      for (const [networkName, networkConfig] of Object.entries(config.networks)) {
        const network = networkConfig as any;
        if (!network.name) errors.push(`Network ${networkName} missing name`);
        if (!network.chainId) errors.push(`Network ${networkName} missing chainId`);
        if (!network.rpcUrl) errors.push(`Network ${networkName} missing rpcUrl`);
        if (!network.explorer) errors.push(`Network ${networkName} missing explorer`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate key-value pairs before setting
   */
  private validateKeyValue(key: ConfigKey, value: any): void {
    if (key === 'defaultNetwork') {
      if (typeof value !== 'string') {
        throw new ConfigError('defaultNetwork must be a string', 'INVALID_VALUE');
      }
    } else if (key === 'settings.outputFormat') {
      if (!['human', 'json'].includes(value)) {
        throw new ConfigError('outputFormat must be "human" or "json"', 'INVALID_VALUE');
      }
    } else if (key.startsWith('settings.') && key.endsWith('Output') || key.endsWith('Mode') || key.endsWith('Enabled')) {
      if (typeof value !== 'boolean') {
        throw new ConfigError(`${key} must be a boolean`, 'INVALID_VALUE');
      }
    } else if (key.includes('.rpcUrl')) {
      try {
        new URL(value);
      } catch {
        throw new ConfigError(`Invalid RPC URL format: ${value}`, 'INVALID_URL');
      }
    }
  }

  /**
   * Get nested value using dot notation
   */
  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((current, segment) => {
      return current?.[segment];
    }, obj);
  }

  /**
   * Set nested value using dot notation
   */
  private setNestedValue(obj: any, key: string, value: any): void {
    const segments = key.split('.');
    const lastSegment = segments.pop()!;
    
    let current = obj;
    for (const segment of segments) {
      if (!current[segment] || typeof current[segment] !== 'object') {
        current[segment] = {};
      }
      current = current[segment];
    }
    
    current[lastSegment] = value;
  }
}
