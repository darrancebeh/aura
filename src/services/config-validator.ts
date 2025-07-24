import { ConfigKey, ConfigError, AuraConfig } from '../types/config.js';
import { SUPPORTED_NETWORKS } from '../utils/config.js';

/**
 * Advanced configuration validator with smart error messages and suggestions
 * Provides typo detection, helpful suggestions, and comprehensive validation
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  suggestion?: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ConfigKeyInfo {
  key: string;
  type: string;
  description: string;
  examples: string[];
  allowedValues?: string[];
}

export class ConfigValidator {
  private static readonly VALID_CONFIG_KEYS: ConfigKeyInfo[] = [
    {
      key: 'defaultNetwork',
      type: 'string',
      description: 'Default blockchain network for transactions',
      examples: ['ethereum', 'polygon', 'arbitrum'],
      allowedValues: Object.keys(SUPPORTED_NETWORKS)
    },
    {
      key: 'settings.outputFormat',
      type: 'string',
      description: 'Output format for CLI commands',
      examples: ['human', 'json'],
      allowedValues: ['human', 'json']
    },
    {
      key: 'settings.colorOutput',
      type: 'boolean',
      description: 'Enable colored terminal output',
      examples: ['true', 'false']
    },
    {
      key: 'settings.verboseMode',
      type: 'boolean', 
      description: 'Enable verbose error reporting and debug information',
      examples: ['true', 'false']
    },
    {
      key: 'settings.cacheEnabled',
      type: 'boolean',
      description: 'Enable caching for improved performance',
      examples: ['true', 'false']
    },
    {
      key: 'settings.defaultDepth',
      type: 'number',
      description: 'Default call stack depth limit for transaction traces',
      examples: ['3', '5', '10']
    }
  ];

  /**
   * Validate a configuration key exists and suggest corrections
   */
  static validateConfigKey(key: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Check if key is valid (exact match)
    const isValidKey = this.isValidConfigKey(key);
    
    if (!isValidKey) {
      // Try to find similar keys for typo detection
      const suggestion = this.findSimilarKey(key);
      
      errors.push({
        field: key,
        message: `Unknown configuration key: '${key}'`,
        suggestion: suggestion ? `Did you mean '${suggestion}'?` : undefined,
        code: 'INVALID_CONFIG_KEY'
      });

      if (suggestion) {
        suggestions.push(`Use 'aura config set ${suggestion} <value>' instead`);
      }
      
      suggestions.push("Use 'aura config keys' to see all available configuration keys");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate a configuration value for a given key
   */
  static validateConfigValue(key: string, value: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    const keyInfo = this.getKeyInfo(key);
    if (!keyInfo) {
      // Key validation should happen first
      return this.validateConfigKey(key);
    }

    // Type-specific validation
    switch (keyInfo.type) {
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: key,
            message: `Expected boolean value for '${key}', received ${typeof value}`,
            suggestion: `Use 'true' or 'false'`,
            code: 'INVALID_TYPE'
          });
          suggestions.push(`Example: aura config set ${key} true`);
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field: key,
            message: `Expected number value for '${key}', received ${typeof value}`,
            suggestion: `Use a numeric value`,
            code: 'INVALID_TYPE'
          });
          suggestions.push(`Example: aura config set ${key} 5`);
        } else {
          // Additional number validation
          if (key === 'settings.defaultDepth' && (value < 1 || value > 20)) {
            warnings.push({
              field: key,
              message: `Depth value ${value} may cause performance issues`,
              suggestion: 'Recommended range: 1-10'
            });
          }
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: key,
            message: `Expected string value for '${key}', received ${typeof value}`,
            code: 'INVALID_TYPE'
          });
        } else if (keyInfo.allowedValues) {
          // Validate against allowed values
          if (!keyInfo.allowedValues.includes(value)) {
            const suggestion = this.findSimilarValue(value, keyInfo.allowedValues);
            errors.push({
              field: key,
              message: `Invalid value '${value}' for '${key}'`,
              suggestion: suggestion ? `Did you mean '${suggestion}'?` : undefined,
              code: 'INVALID_VALUE'
            });
            suggestions.push(`Allowed values: ${keyInfo.allowedValues.join(', ')}`);
          }
        }
        break;
    }

    // Special validation for specific keys
    if (key.includes('.rpcUrl') || key.startsWith('rpcEndpoints.')) {
      if (typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          errors.push({
            field: key,
            message: `Invalid RPC URL format: ${value}`,
            suggestion: 'URL must start with http:// or https://',
            code: 'INVALID_URL'
          });
          suggestions.push('Example: https://mainnet.infura.io/v3/YOUR_KEY');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate network name
   */
  static validateNetworkName(network: string): ValidationResult {
    const errors: ValidationError[] = [];
    const suggestions: string[] = [];
    
    const supportedNetworks = Object.keys(SUPPORTED_NETWORKS);
    
    if (!supportedNetworks.includes(network)) {
      const suggestion = this.findSimilarValue(network, supportedNetworks);
      
      errors.push({
        field: 'network',
        message: `Unsupported network: '${network}'`,
        suggestion: suggestion ? `Did you mean '${suggestion}'?` : undefined,
        code: 'INVALID_NETWORK'
      });
      
      suggestions.push(`Supported networks: ${supportedNetworks.join(', ')}`);
      if (suggestion) {
        suggestions.push(`Use 'aura config set defaultNetwork ${suggestion}' to switch`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      suggestions
    };
  }

  /**
   * Get all available configuration keys
   */
  static getAvailableKeys(): ConfigKeyInfo[] {
    const baseKeys = [...this.VALID_CONFIG_KEYS];
    
    // Add dynamic network-specific keys
    Object.keys(SUPPORTED_NETWORKS).forEach(network => {
      baseKeys.push({
        key: `networks.${network}.rpcUrl`,
        type: 'string',
        description: `Custom RPC URL for ${network} network`,
        examples: [`https://mainnet.infura.io/v3/YOUR_KEY`]
      });
      
      baseKeys.push({
        key: `rpcEndpoints.${network}`,
        type: 'string', 
        description: `RPC endpoint for ${network} network`,
        examples: [`https://${network}.gateway.tenderly.co/YOUR_KEY`]
      });
    });

    return baseKeys;
  }

  /**
   * Get information about a specific configuration key
   */
  static getKeyInfo(key: string): ConfigKeyInfo | null {
    const allKeys = this.getAvailableKeys();
    return allKeys.find(k => k.key === key) || null;
  }

  /**
   * Check if a configuration key is valid
   */
  private static isValidConfigKey(key: string): boolean {
    const allKeys = this.getAvailableKeys();
    
    // Direct match
    if (allKeys.some(k => k.key === key)) {
      return true;
    }
    
    // Check for dynamic keys (networks.*, rpcEndpoints.*)
    if (key.startsWith('networks.') && key.endsWith('.rpcUrl')) {
      const network = key.split('.')[1];
      return Object.keys(SUPPORTED_NETWORKS).includes(network);
    }
    
    if (key.startsWith('rpcEndpoints.')) {
      const network = key.split('.')[1];
      return Object.keys(SUPPORTED_NETWORKS).includes(network);
    }
    
    return false;
  }

  /**
   * Find similar key for typo detection using Levenshtein distance
   */
  private static findSimilarKey(input: string): string | null {
    const allKeys = this.getAvailableKeys().map(k => k.key);
    
    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    
    for (const key of allKeys) {
      const distance = this.levenshteinDistance(input.toLowerCase(), key.toLowerCase());
      
      // Only suggest if distance is reasonable (max 3 edits for keys up to 20 chars)
      if (distance <= 3 && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = key;
      }
    }
    
    return bestMatch;
  }

  /**
   * Find similar value for typo detection
   */
  private static findSimilarValue(input: string, allowedValues: string[]): string | null {
    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    
    for (const value of allowedValues) {
      const distance = this.levenshteinDistance(input.toLowerCase(), value.toLowerCase());
      
      // Only suggest if distance is reasonable
      if (distance <= 2 && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = value;
      }
    }
    
    return bestMatch;
  }

  /**
   * Calculate Levenshtein distance for typo detection
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Validate entire configuration object
   */
  static validateConfiguration(config: AuraConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Validate required fields
    if (!config.version) {
      errors.push({
        field: 'version',
        message: 'Missing required field: version',
        code: 'MISSING_FIELD'
      });
    }

    if (!config.defaultNetwork) {
      errors.push({
        field: 'defaultNetwork',
        message: 'Missing required field: defaultNetwork',
        code: 'MISSING_FIELD'
      });
    } else {
      const networkValidation = this.validateNetworkName(config.defaultNetwork);
      errors.push(...networkValidation.errors);
      warnings.push(...networkValidation.warnings);
      suggestions.push(...networkValidation.suggestions);
    }

    // Validate settings
    if (config.settings) {
      Object.entries(config.settings).forEach(([key, value]) => {
        const fullKey = `settings.${key}`;
        const validation = this.validateConfigValue(fullKey, value);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
        suggestions.push(...validation.suggestions);
      });
    }

    // Validate RPC endpoints
    if (config.rpcEndpoints) {
      Object.entries(config.rpcEndpoints).forEach(([network, url]) => {
        const networkValidation = this.validateNetworkName(network);
        const urlValidation = this.validateConfigValue(`rpcEndpoints.${network}`, url);
        
        errors.push(...networkValidation.errors);
        errors.push(...urlValidation.errors);
        warnings.push(...urlValidation.warnings);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
}
