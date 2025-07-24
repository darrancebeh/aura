import { ethers } from 'ethers';
import { ABIFunction, ABIEvent, DecodedFunction, DecodedEvent, AuraError } from '../types/index.js';

/**
 * Service for managing contract ABIs and decoding function calls/events
 * Handles fetching ABIs from public sources and caching them
 */
export class ABIService {
  private abiCache = new Map<string, any[]>();
  private signatureCache = new Map<string, ABIFunction>();
  private eventCache = new Map<string, ABIEvent>();

  constructor() {
    this.loadCommonABIs();
  }

  /**
   * Load common contract ABIs (ERC20, ERC721, etc.) for immediate availability
   */
  private loadCommonABIs() {
    // ERC20 Transfer event
    this.eventCache.set(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      {
        name: 'Transfer',
        type: 'event',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      }
    );

    // ERC20 Approval event
    this.eventCache.set(
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      {
        name: 'Approval',
        type: 'event',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'spender', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      }
    );

    // Common function signatures
    this.signatureCache.set('0xa9059cbb', {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ]
    });

    this.signatureCache.set('0x095ea7b3', {
      name: 'approve',
      type: 'function',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ]
    });
  }

  /**
   * Decode function call from transaction input data
   */
  async decodeFunctionCall(to: string, input: string): Promise<DecodedFunction | null> {
    if (input.length < 10) return null; // Need at least 4 bytes for selector

    const selector = input.slice(0, 10);
    let abiFunction = this.signatureCache.get(selector);

    // Try to fetch ABI if not in cache
    if (!abiFunction) {
      const fetchedFunction = await this.fetchFunctionSignature(selector);
      if (fetchedFunction) {
        abiFunction = fetchedFunction;
      }
    }

    if (!abiFunction) return null;

    try {
      const iface = new ethers.Interface([abiFunction]);
      const decoded = iface.parseTransaction({ data: input });
      
      if (!decoded) return null;

      return {
        name: decoded.name,
        signature: decoded.signature,
        inputs: decoded.args.map((arg, index) => ({
          name: abiFunction!.inputs[index]?.name || `param${index}`,
          type: abiFunction!.inputs[index]?.type || 'unknown',
          value: this.formatValue(arg, abiFunction!.inputs[index]?.type)
        }))
      };
    } catch (error) {
      // Silently fail for ethers.js ABI parsing warnings
      // These are usually non-critical format issues
      return null;
    }
  }

  /**
   * Decode event log data
   */
  async decodeEventLog(address: string, topics: string[], data: string): Promise<DecodedEvent | null> {
    if (topics.length === 0) return null;

    const eventSignature = topics[0];
    let abiEvent = this.eventCache.get(eventSignature);

    if (!abiEvent) {
      const fetchedEvent = await this.fetchEventSignature(eventSignature);
      if (fetchedEvent) {
        abiEvent = fetchedEvent;
      }
    }

    if (!abiEvent) return null;

    try {
      const iface = new ethers.Interface([abiEvent]);
      const decoded = iface.parseLog({ topics, data });
      
      if (!decoded) return null;

      return {
        name: decoded.name,
        signature: decoded.signature,
        inputs: decoded.args.map((arg, index) => {
          const param = abiEvent!.inputs[index];
          return {
            name: param?.name || `param${index}`,
            type: param?.type || 'unknown',
            value: this.formatValue(arg, param?.type),
            indexed: param?.indexed || false
          };
        })
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch function signature from 4byte.directory
   */
  private async fetchFunctionSignature(selector: string): Promise<ABIFunction | null> {
    try {
      const response = await fetch(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          const signature = result.text_signature;
          
          // Skip obviously malformed signatures
          if (signature.includes('watch_tg_') || signature.includes('_faebe36')) {
            continue; // Skip suspicious/malformed signatures
          }
          
          const abiFunc = this.parseSignatureToABI(signature, 'function');
          if (abiFunc && this.isValidABI(abiFunc)) {
            this.signatureCache.set(selector, abiFunc as ABIFunction);
            return abiFunc as ABIFunction;
          }
        }
      }
    } catch (error) {
      // Silently fail and return null
    }
    return null;
  }

  /**
   * Validate ABI fragment before using it
   */
  private isValidABI(abi: ABIFunction | ABIEvent): boolean {
    try {
      // Check for basic validity
      if (!abi.name || !abi.type) return false;
      
      // Skip malformed names
      if (abi.name.includes('watch_tg_') || abi.name.includes('_faebe36')) {
        return false;
      }
      
      // Validate inputs
      if (abi.inputs) {
        for (const input of abi.inputs) {
          if (!input.type) return false;
          // Function parameters should not have indexed property
          if (abi.type === 'function' && 'indexed' in input) {
            return false;
          }
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetch event signature (simplified - in production, would use topic0 databases)
   */
  private async fetchEventSignature(topicHash: string): Promise<ABIEvent | null> {
    // For now, return null for unknown events
    // In production, would integrate with event signature databases
    return null;
  }

  /**
   * Parse human-readable signature to ABI format
   */
  private parseSignatureToABI(signature: string, type: 'function' | 'event'): ABIFunction | ABIEvent | null {
    try {
      const match = signature.match(/(\w+)\((.*)\)/);
      if (!match) return null;

      const [, name, params] = match;
      const inputs = params ? params.split(',').map((param, index) => {
        const trimmed = param.trim();
        const spaceIndex = trimmed.lastIndexOf(' ');
        
        if (spaceIndex > 0) {
          const paramType = trimmed.substring(0, spaceIndex);
          const paramName = trimmed.substring(spaceIndex + 1);
          
          // Only include 'indexed' property for events
          if (type === 'event') {
            return {
              name: paramName,
              type: paramType,
              indexed: false // Events can have indexed parameters
            };
          } else {
            return {
              name: paramName,
              type: paramType
              // Functions don't have indexed parameters
            };
          }
        }
        
        // Fallback for unnamed parameters
        if (type === 'event') {
          return {
            name: `param${index}`,
            type: trimmed,
            indexed: false
          };
        } else {
          return {
            name: `param${index}`,
            type: trimmed
          };
        }
      }) : [];

      return {
        name,
        type,
        inputs
      } as ABIFunction | ABIEvent;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format values for display
   */
  private formatValue(value: any, type?: string): any {
    if (!type) return value;

    if (type === 'address') {
      return value.toString();
    }
    
    if (type.startsWith('uint') || type.startsWith('int')) {
      return value.toString();
    }

    if (type === 'bool') {
      return Boolean(value);
    }

    if (type === 'bytes' || type.startsWith('bytes')) {
      return value.toString();
    }

    return value;
  }
}
