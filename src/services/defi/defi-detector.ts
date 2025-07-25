import { ParsedTrace, ParsedCall, DefiAnalysis, DefiInteraction, SupportedProtocols } from '../../types/index.js';
import { DetectionResult, ContractSignature, FunctionSignature, EventSignature } from './types.js';
import { TokenService } from '../token.js';

/**
 * Main service for detecting and analyzing DeFi protocol interactions
 * Pass 2: Enhanced with real Uniswap V2 detection capabilities
 */
export class DefiDetector {
  private contractSignatures: Map<string, ContractSignature> = new Map();
  private functionSignatures: Map<string, FunctionSignature> = new Map();
  private eventSignatures: Map<string, EventSignature> = new Map();
  private tokenService?: TokenService;

  constructor(tokenService?: TokenService) {
    this.tokenService = tokenService;
    this.initializeSignatures();
  }

  /**
   * Analyze a complete transaction trace for DeFi interactions
   */
  async analyzeTrace(trace: ParsedTrace): Promise<DefiAnalysis> {
    try {
      // For Pass 1: Always return no detection
      // This will be implemented in Pass 2 with actual protocol detection
      const interactions = await this.detectInteractions(trace);
      
      if (interactions.length === 0) {
        return {
          detected: false,
          interactions: [],
          summary: 'No DeFi protocol interactions detected',
          confidence: 0
        };
      }

      // Future implementation for when we have actual detections
      return {
        detected: true,
        protocol: interactions[0].protocol,
        interactions,
        summary: this.generateSummary(interactions),
        confidence: this.calculateOverallConfidence(interactions)
      };
    } catch (error) {
      // Graceful fallback - never break the main analysis
      console.error('DeFi analysis error:', error);
      return {
        detected: false,
        interactions: [],
        summary: 'DeFi analysis unavailable due to error',
        confidence: 0
      };
    }
  }

  /**
   * Detect DeFi interactions in the trace
   * Pass 2: Implements actual Uniswap V2 detection
   */
  private async detectInteractions(trace: ParsedTrace): Promise<DefiInteraction[]> {
    const interactions: DefiInteraction[] = [];
    
    // Analyze the root call and all subcalls
    await this.analyzeCall(trace.rootCall, interactions);
    
    return interactions;
  }

  /**
   * Analyze individual call for DeFi patterns
   * Pass 2: Implements Uniswap V2 detection and analysis
   */
  private async analyzeCall(call: ParsedCall, interactions: DefiInteraction[]): Promise<void> {
    // Check if this call matches any known DeFi patterns
    const detection = this.detectProtocolFromCall(call);
    
    if (detection) {
      // Convert detection to interaction for Uniswap V2
      const interaction = await this.convertDetectionToInteraction(call, detection);
      if (interaction) {
        interactions.push(interaction);
      }
    }

    // Recursively analyze subcalls
    for (const subcall of call.subcalls) {
      await this.analyzeCall(subcall, interactions);
    }
  }

  /**
   * Detect protocol from a single call
   * Pass 2: Implements real contract address and function signature matching
   */
  private detectProtocolFromCall(call: ParsedCall): DetectionResult | null {
    // Check contract address first (most reliable)
    if (this.contractSignatures.has(call.to.toLowerCase())) {
      const contract = this.contractSignatures.get(call.to.toLowerCase())!;
      return {
        confidence: 0.9,
        protocol: contract.protocol,
        version: contract.version,
        evidence: [`Contract address: ${call.to}`],
        contractAddress: call.to,
        functionName: call.decodedFunction?.name
      };
    }

    // Check function signature (secondary verification)
    if (call.decodedFunction) {
      const functionKey = call.decodedFunction.name;
      if (this.functionSignatures.has(functionKey)) {
        const func = this.functionSignatures.get(functionKey)!;
        return {
          confidence: func.confidence,
          protocol: func.protocol,
          evidence: [`Function: ${func.name}`],
          contractAddress: call.to,
          functionName: func.name
        };
      }
    }

    return null;
  }

  /**
   * Convert a detection result to a DeFi interaction
   * Pass 2: Implements swap analysis for Uniswap V2
   */
  private async convertDetectionToInteraction(call: ParsedCall, detection: DetectionResult): Promise<DefiInteraction | null> {
    try {
      if (detection.protocol === SupportedProtocols.UNISWAP_V2) {
        return await this.analyzeUniswapV2Call(call, detection);
      }
      
      // Future: Add other protocols here
      return null;
    } catch (error) {
      console.error('Error converting detection to interaction:', error);
      return null;
    }
  }

  /**
   * Initialize known signatures for detection
   * Pass 2: Populated with Uniswap V2 signatures
   */
  private initializeSignatures(): void {
    // Uniswap V2 Router 02 (main contract)
    this.contractSignatures.set(
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
      {
        address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        name: 'Uniswap V2 Router 02',
        protocol: SupportedProtocols.UNISWAP_V2,
        version: '2.0',
        type: 'router'
      }
    );

    // Uniswap V2 Factory
    this.contractSignatures.set(
      '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
      {
        address: '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f',
        name: 'Uniswap V2 Factory',
        protocol: SupportedProtocols.UNISWAP_V2,
        version: '2.0',
        type: 'factory'
      }
    );

    // Uniswap V2 Function Signatures
    this.functionSignatures.set('swapExactTokensForTokens', {
      selector: '0x38ed1739',
      name: 'swapExactTokensForTokens',
      protocol: SupportedProtocols.UNISWAP_V2,
      confidence: 0.95
    });

    this.functionSignatures.set('swapTokensForExactTokens', {
      selector: '0x8803dbee',
      name: 'swapTokensForExactTokens',
      protocol: SupportedProtocols.UNISWAP_V2,
      confidence: 0.95
    });

    this.functionSignatures.set('swapExactETHForTokens', {
      selector: '0x7ff36ab5',
      name: 'swapExactETHForTokens',
      protocol: SupportedProtocols.UNISWAP_V2,
      confidence: 0.95
    });

    this.functionSignatures.set('swapTokensForExactETH', {
      selector: '0x4a25d94a',
      name: 'swapTokensForExactETH',
      protocol: SupportedProtocols.UNISWAP_V2,
      confidence: 0.95
    });

    this.functionSignatures.set('swapExactTokensForETH', {
      selector: '0x18cbafe5',
      name: 'swapExactTokensForETH',
      protocol: SupportedProtocols.UNISWAP_V2,
      confidence: 0.95
    });

    this.functionSignatures.set('swapETHForExactTokens', {
      selector: '0xfb3bdb41',
      name: 'swapETHForExactTokens',
      protocol: SupportedProtocols.UNISWAP_V2,
      confidence: 0.95
    });

    this.functionSignatures.set('addLiquidity', {
      selector: '0xe8e33700',
      name: 'addLiquidity',
      protocol: SupportedProtocols.UNISWAP_V2,
      confidence: 0.90
    });

    this.functionSignatures.set('removeLiquidity', {
      selector: '0xbaa2abde',
      name: 'removeLiquidity',
      protocol: SupportedProtocols.UNISWAP_V2,
      confidence: 0.90
    });

    // Uniswap V2 Event Signatures
    this.eventSignatures.set(
      '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
      {
        topic0: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
        name: 'Swap',
        protocol: SupportedProtocols.UNISWAP_V2,
        confidence: 0.90
      }
    );
  }

  /**
   * Generate human-readable summary of interactions
   */
  private generateSummary(interactions: DefiInteraction[]): string {
    if (interactions.length === 0) {
      return 'No DeFi interactions detected';
    }

    const protocols = [...new Set(interactions.map(i => i.protocol))];
    const types = [...new Set(interactions.map(i => i.type))];

    if (protocols.length === 1) {
      return `${protocols[0]} ${types.join(', ')} detected`;
    }

    return `Multi-protocol DeFi interaction: ${protocols.join(', ')}`;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(interactions: DefiInteraction[]): number {
    if (interactions.length === 0) return 0;
    
    const totalConfidence = interactions.reduce((sum, interaction) => sum + interaction.confidence, 0);
    return totalConfidence / interactions.length;
  }

  /**
   * Analyze Uniswap V2 specific call and extract swap details
   * Pass 2: Core Uniswap V2 swap analysis implementation
   */
  private async analyzeUniswapV2Call(call: ParsedCall, detection: DetectionResult): Promise<DefiInteraction | null> {
    if (!call.decodedFunction || !call.success) {
      return null;
    }

    const functionName = call.decodedFunction.name;
    
    // Determine interaction type based on function
    let interactionType: string;
    if (functionName.includes('swap')) {
      interactionType = 'swap';
    } else if (functionName.includes('addLiquidity')) {
      interactionType = 'liquidity_add';
    } else if (functionName.includes('removeLiquidity')) {
      interactionType = 'liquidity_remove';
    } else {
      interactionType = 'unknown';
    }

    // Extract swap details for swap functions
    let swapDetails = null;
    if (interactionType === 'swap') {
      swapDetails = await this.extractSwapDetails(call);
    }

    // Build the interaction object
    const interaction: DefiInteraction = {
      type: interactionType as any,
      protocol: SupportedProtocols.UNISWAP_V2,
      version: '2.0',
      description: this.generateInteractionDescription(functionName, swapDetails),
      success: call.success,
      details: {
        ...(swapDetails && { swapDetails }),
        functionName,
        gasUsed: call.gasUsed
      },
      contractAddress: call.to,
      functionName,
      confidence: detection.confidence
    };

    return interaction;
  }

  /**
   * Extract swap details from Uniswap V2 function call
   */
  private async extractSwapDetails(call: ParsedCall): Promise<any | null> {
    if (!call.decodedFunction) return null;

    try {
      const inputs = call.decodedFunction.inputs;
      const functionName = call.decodedFunction.name;
      
      // Extract common parameters
      let amountIn = '';
      let amountOut = '';
      let path: string[] = [];
      
      // Parse parameters based on function type
      if (functionName === 'swapExactTokensForTokens' || functionName === 'swapExactTokensForETH') {
        amountIn = inputs.find(i => i.name === 'amountIn')?.value || '';
        path = inputs.find(i => i.name === 'path')?.value || [];
      } else if (functionName === 'swapTokensForExactTokens' || functionName === 'swapTokensForExactETH') {
        amountOut = inputs.find(i => i.name === 'amountOut')?.value || '';
        path = inputs.find(i => i.name === 'path')?.value || [];
      } else if (functionName === 'swapExactETHForTokens') {
        amountIn = call.value || '0'; // ETH amount from call value
        path = inputs.find(i => i.name === 'path')?.value || [];
      } else if (functionName === 'swapETHForExactTokens') {
        amountOut = inputs.find(i => i.name === 'amountOut')?.value || '';
        path = inputs.find(i => i.name === 'path')?.value || [];
      }

      if (path.length < 2) return null;

      // Get token information
      const tokenInAddress = path[0];
      const tokenOutAddress = path[path.length - 1];
      
      let tokenIn, tokenOut;
      
      // Handle WETH as ETH for display
      const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      
      if (tokenInAddress.toLowerCase() === WETH.toLowerCase() && functionName.includes('ETH')) {
        tokenIn = { symbol: 'ETH', decimals: 18, address: tokenInAddress, name: 'Ethereum' };
      } else if (this.tokenService) {
        const tokenInfo = await this.tokenService.getTokenInfo(tokenInAddress);
        tokenIn = tokenInfo ? {
          symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
          address: tokenInAddress,
          name: tokenInfo.name
        } : { symbol: 'UNK', decimals: 18, address: tokenInAddress, name: 'Unknown Token' };
      } else {
        tokenIn = { symbol: 'UNK', decimals: 18, address: tokenInAddress, name: 'Unknown Token' };
      }

      if (tokenOutAddress.toLowerCase() === WETH.toLowerCase() && functionName.includes('ETH')) {
        tokenOut = { symbol: 'ETH', decimals: 18, address: tokenOutAddress, name: 'Ethereum' };
      } else if (this.tokenService) {
        const tokenInfo = await this.tokenService.getTokenInfo(tokenOutAddress);
        tokenOut = tokenInfo ? {
          symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
          address: tokenOutAddress,
          name: tokenInfo.name
        } : { symbol: 'UNK', decimals: 18, address: tokenOutAddress, name: 'Unknown Token' };
      } else {
        tokenOut = { symbol: 'UNK', decimals: 18, address: tokenOutAddress, name: 'Unknown Token' };
      }

      // Build route info for multi-hop swaps
      let route = [tokenIn, tokenOut];
      if (path.length > 2 && this.tokenService) {
        route = [];
        for (const address of path) {
          if (address.toLowerCase() === WETH.toLowerCase()) {
            route.push({ symbol: 'ETH', decimals: 18, address, name: 'Ethereum' });
          } else {
            const tokenInfo = await this.tokenService.getTokenInfo(address);
            route.push(tokenInfo ? {
              symbol: tokenInfo.symbol,
              decimals: tokenInfo.decimals,
              address,
              name: tokenInfo.name
            } : { symbol: 'UNK', decimals: 18, address, name: 'Unknown Token' });
          }
        }
      }

      return {
        tokenIn,
        tokenOut,
        amountIn: amountIn || '0',
        amountOut: amountOut || '0',
        route: route.length > 2 ? route : undefined,
        isMultiHop: path.length > 2
      };

    } catch (error) {
      console.error('Error extracting swap details:', error);
      return null;
    }
  }

  /**
   * Generate human-readable description for interaction
   */
  private generateInteractionDescription(functionName: string, swapDetails?: any): string {
    if (functionName.includes('swap') && swapDetails) {
      const tokenIn = swapDetails.tokenIn?.symbol || 'Token';
      const tokenOut = swapDetails.tokenOut?.symbol || 'Token';
      
      if (swapDetails.isMultiHop) {
        return `Multi-hop token swap: ${tokenIn} → ${tokenOut} via Uniswap V2`;
      }
      return `Token swap: ${tokenIn} → ${tokenOut} via Uniswap V2`;
    }
    
    if (functionName.includes('addLiquidity')) {
      return 'Add liquidity to Uniswap V2 pool';
    }
    
    if (functionName.includes('removeLiquidity')) {
      return 'Remove liquidity from Uniswap V2 pool';
    }
    
    return `Uniswap V2 ${functionName}`;
  }
}
