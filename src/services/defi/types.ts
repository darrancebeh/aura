/**
 * Internal types for DeFi detection services
 * These are implementation details not exposed in the public API
 */

/**
 * Rules for detecting specific protocol interactions
 */
export interface ProtocolDetectionRule {
  contractAddresses: string[];
  functionSelectors: string[];
  eventSignatures: string[];
  confidence: number;
}

/**
 * Result of protocol detection analysis
 */
export interface DetectionResult {
  confidence: number;
  protocol: string;
  version?: string;
  evidence: string[];
  contractAddress: string;
  functionName?: string;
}

/**
 * Contract signature patterns for detection
 */
export interface ContractSignature {
  address: string;
  name: string;
  protocol: string;
  version?: string;
  type: 'router' | 'factory' | 'pair' | 'pool' | 'lending' | 'vault';
}

/**
 * Function signature patterns
 */
export interface FunctionSignature {
  selector: string;
  name: string;
  protocol: string;
  confidence: number;
}

/**
 * Event signature patterns
 */
export interface EventSignature {
  topic0: string;
  name: string;
  protocol: string;
  confidence: number;
}
