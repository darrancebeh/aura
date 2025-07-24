import { ethers } from 'ethers';
import { RawTrace, TraceCall, ParsedTrace, ParsedCall, ParsedEvent, TransactionInfo } from '../types/index.js';
import { ABIService } from '../services/abi.js';

/**
 * Parser for converting raw trace data into structured, human-readable format
 * Handles nested calls, gas calculation, and error detection
 */
export class TraceParser {
  private abiService: ABIService;

  constructor() {
    this.abiService = new ABIService();
  }

  /**
   * Parse raw trace data into structured format
   */
  async parseTrace(rawTrace: RawTrace, transactionInfo: TransactionInfo): Promise<ParsedTrace> {
    if (!rawTrace.calls || rawTrace.calls.length === 0) {
      throw new Error('No trace data to parse');
    }

    console.log('⏳ Parsing trace data...');

    // Parse the root call (the transaction itself)
    const rootCall = await this.parseCall(rawTrace.calls[0], 0, []);

    // Extract all events from the trace
    const allEvents = this.extractAllEvents(rootCall);

    return {
      transaction: transactionInfo,
      rootCall,
      totalGasUsed: rawTrace.gasUsed,
      events: allEvents
    };
  }

  /**
   * Parse individual call in the trace
   */
  private async parseCall(
    call: TraceCall, 
    depth: number, 
    eventsSoFar: ParsedEvent[]
  ): Promise<ParsedCall> {
    
    // Determine call type
    const callType = this.getCallType(call);
    
    // Decode function if possible
    let decodedFunction;
    if (call.input && call.input !== '0x' && call.to) {
      decodedFunction = await this.abiService.decodeFunctionCall(call.to, call.input);
    }

    // Parse any error/revert reason
    const { success, error, revertReason } = this.parseCallResult(call);

    // Parse subcalls recursively
    const subcalls: ParsedCall[] = [];
    if (call.calls) {
      for (const subcall of call.calls) {
        const parsedSubcall = await this.parseCall(subcall, depth + 1, eventsSoFar);
        subcalls.push(parsedSubcall);
      }
    }

    return {
      type: callType,
      from: call.from,
      to: call.to,
      value: call.value || '0x0',
      gasLimit: call.gas || '0',
      gasUsed: call.gasUsed || '0',
      success,
      error,
      revertReason,
      depth,
      decodedFunction: decodedFunction || undefined,
      events: [], // Will be populated separately
      subcalls
    };
  }

  /**
   * Determine the type of call (call, staticcall, delegatecall, etc.)
   */
  private getCallType(call: TraceCall): 'call' | 'staticcall' | 'delegatecall' | 'create' | 'create2' {
    const type = call.type?.toLowerCase();
    
    switch (type) {
      case 'call':
      case 'staticcall':
      case 'delegatecall':
      case 'create':
      case 'create2':
        return type as any;
      default:
        return 'call'; // Default fallback
    }
  }

  /**
   * Parse call result to determine success/failure and extract revert reasons
   */
  private parseCallResult(call: TraceCall): {
    success: boolean;
    error?: string;
    revertReason?: string;
  } {
    const success = !call.error;
    
    if (!success && call.error) {
      // Try to decode revert reason from output
      let revertReason: string | undefined;
      
      if (call.output && call.output.length > 10) {
        try {
          // Standard revert format: 0x08c379a0 + ABI encoded string
          if (call.output.startsWith('0x08c379a0')) {
            const reason = ethers.AbiCoder.defaultAbiCoder().decode(
              ['string'], 
              '0x' + call.output.slice(10)
            )[0];
            revertReason = reason;
          }
        } catch {
          // If decoding fails, use raw output
          revertReason = call.output;
        }
      }

      return {
        success: false,
        error: call.error,
        revertReason
      };
    }

    return { success: true };
  }

  /**
   * Extract all events from parsed calls recursively
   */
  private extractAllEvents(call: ParsedCall): ParsedEvent[] {
    const events: ParsedEvent[] = [...call.events];
    
    for (const subcall of call.subcalls) {
      events.push(...this.extractAllEvents(subcall));
    }
    
    return events;
  }

  /**
   * Parse transaction receipt logs and associate with calls
   */
  async parseLogs(logs: any[], parsedTrace: ParsedTrace): Promise<void> {
    console.log('⏳ Parsing event logs...');
    
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      
      const parsedEvent: ParsedEvent = {
        address: log.address,
        logIndex: i,
        rawTopics: log.topics || [],
        rawData: log.data || '0x'
      };

      // Try to decode the event
      if (log.topics && log.topics.length > 0) {
        const decodedEvent = await this.abiService.decodeEventLog(
          log.address,
          log.topics,
          log.data || '0x'
        );
        
        if (decodedEvent) {
          parsedEvent.decodedEvent = decodedEvent;
        }
      }

      // For simplicity, add events to the root call
      // In a more advanced version, we'd associate events with their originating calls
      parsedTrace.rootCall.events.push(parsedEvent);
    }
  }
}
