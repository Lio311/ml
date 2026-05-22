import { checkRateLimit } from '../app/lib/rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests within limit', () => {
    const ip = '192.168.1.1';
    
    // First request should pass
    expect(checkRateLimit(ip, 2, 60000)).toBe(true);
    // Second request should pass
    expect(checkRateLimit(ip, 2, 60000)).toBe(true);
  });

  it('blocks requests over limit', () => {
    const ip = '192.168.1.2';
    
    expect(checkRateLimit(ip, 2, 60000)).toBe(true);
    expect(checkRateLimit(ip, 2, 60000)).toBe(true);
    // Third request should be blocked
    expect(checkRateLimit(ip, 2, 60000)).toBe(false);
  });

  it('resets after window expires', () => {
    const ip = '192.168.1.3';
    
    expect(checkRateLimit(ip, 1, 60000)).toBe(true);
    expect(checkRateLimit(ip, 1, 60000)).toBe(false);

    // Fast forward time
    jest.advanceTimersByTime(61000);

    // Should be allowed again
    expect(checkRateLimit(ip, 1, 60000)).toBe(true);
  });
});
