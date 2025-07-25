import { DefiDetector } from '../src/services/defi/defi-detector.js';
import { ParsedTrace } from '../src/types/index.js';

describe('DeFi Detector', () => {
  test('should initialize correctly', () => {
    const detector = new DefiDetector();
    expect(detector).toBeDefined();
  });

  test('should return no DeFi interactions for empty trace', async () => {
    const detector = new DefiDetector();
    const mockTrace: ParsedTrace = {
      transaction: {
        hash: '0x123',
        from: '0xabc',
        to: '0xdef',
        value: '0',
        gasUsed: '21000',
        gasPrice: '20',
        status: 1,
        blockNumber: 12345
      },
      rootCall: {
        from: '0xabc',
        to: '0xdef',
        value: '0',
        gasLimit: '21000',
        gasUsed: '21000',
        type: 'call',
        success: true,
        depth: 0,
        events: [],
        subcalls: []
      },
      totalGasUsed: '21000',
      events: []
    };

    const result = await detector.analyzeTrace(mockTrace);
    
    expect(result.detected).toBe(false);
    expect(result.interactions).toHaveLength(0);
    expect(result.summary).toBe('No DeFi protocol interactions detected');
  });
});
