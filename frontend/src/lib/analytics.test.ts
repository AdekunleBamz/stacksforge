import { describe, it, expect, vi, afterEach } from 'vitest';
import { trackEvent } from './analytics';

describe('trackEvent', () => {
    const consoleSpy = vi.spyOn(console, 'log');

    afterEach(() => {
        consoleSpy.mockClear();
    });

    it('should log event in development', () => {
        trackEvent('connect_wallet');
        expect(consoleSpy).toHaveBeenCalledWith('[Analytics] connect_wallet', undefined);
    });

    it('should log event with properties', () => {
        trackEvent('forge_token_success', { txid: '0x123' });
        expect(consoleSpy).toHaveBeenCalledWith('[Analytics] forge_token_success', { txid: '0x123' });
    });
});
