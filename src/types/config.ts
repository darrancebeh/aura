/**
 * Configuration types for Aura CLI
 * Defines the structure of user configuration stored in ~/.aura/config.json
 */

export interface UserNetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorer: string;
  isCustom?: boolean;
}

export interface AuraSettings {
  outputFormat: 'human' | 'json';
  colorOutput: boolean;
  verboseMode: boolean;
  cacheEnabled: boolean;
  defaultDepth?: number;
}

export interface AuraConfig {
  version: string;
  defaultNetwork: string;
  networks: Record<string, UserNetworkConfig>;
  settings: AuraSettings;
  rpcEndpoints: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigPaths {
  configDir: string;
  configFile: string;
  cacheDir: string;
  backupDir: string;
}

/**
 * Valid configuration keys that can be set via CLI
 */
export type ConfigKey = 
  | 'defaultNetwork'
  | 'settings.outputFormat'
  | 'settings.colorOutput'
  | 'settings.verboseMode'
  | 'settings.cacheEnabled'
  | 'settings.defaultDepth'
  | `networks.${string}.rpcUrl`
  | `networks.${string}.name`
  | `networks.${string}.explorer`
  | `rpcEndpoints.${string}`;

/**
 * Configuration manager errors
 */
export class ConfigError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ConfigError';
  }
}
