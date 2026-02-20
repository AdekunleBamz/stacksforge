import { describe, it, expect } from 'vitest';
import { formatSupply } from './validation';
import { cn } from './utils';

describe('formatSupply', () => {
    it('should format numbers with commas', () => {
        expect(formatSupply('1000')).toBe('1,000');
        expect(formatSupply('1000000')).toBe('1,000,000');
    });

    it('should strip non-digits', () => {
        expect(formatSupply('1,000')).toBe('1,000'); // strips comma then reformats
        expect(formatSupply('1a2b3c')).toBe('123');
    });

    it('should return empty string for empty input', () => {
        expect(formatSupply('')).toBe('');
    });
});

describe('cn', () => {
    it('should merge class names', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should filter falsy values', () => {
        expect(cn('class1', false && 'class2', undefined, 'class3')).toBe('class1 class3');
    });
});
