export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Form validation rules for the Token Forge.
 * Each validator returns a ValidationResult object.
 */
export const validators = {
    name: (value: string): ValidationResult => {
        if (!value.trim()) return { valid: false, error: 'Token name is required' };
        if (value.length > 64) return { valid: false, error: 'Maximum 64 characters' };
        if (/[^a-zA-Z0-9\s\-_]/.test(value)) return { valid: false, error: 'Only letters, numbers, spaces, -, _ allowed' };
        return { valid: true };
    },

    symbol: (value: string): ValidationResult => {
        if (!value.trim()) return { valid: false, error: 'Symbol is required' };
        if (value.length > 11) return { valid: false, error: 'Maximum 11 characters' }; // SIP-010 constraint usually <10-20, let's say 11 safely
        if (/\s/.test(value)) return { valid: false, error: 'No spaces allowed in symbol' };
        if (/[^A-Z0-9\-_]/.test(value.toUpperCase())) return { valid: false, error: 'Only letters, numbers, -, _ allowed' };
        return { valid: true };
    },

    decimals: (value: number | string): ValidationResult => {
        const num = Number(value);
        if (isNaN(num)) return { valid: false, error: 'Must be a number' };
        if (num < 0) return { valid: false, error: 'Cannot be negative' };
        if (num > 18) return { valid: false, error: 'Maximum 18 decimals' };
        if (!Number.isInteger(num)) return { valid: false, error: 'Must be an integer' };
        return { valid: true };
    },

    supply: (value: string): ValidationResult => {
        // Remove commas
        const raw = value.replace(/,/g, '');
        if (!raw.trim()) return { valid: false, error: 'Total supply is required' };
        if (!/^\d+$/.test(raw)) return { valid: false, error: 'Must be a positive integer' };
        const num = BigInt(raw);
        if (num <= 0n) return { valid: false, error: 'Supply must be greater than 0' };
        if (num > 1_000_000_000_000_000n) return { valid: false, error: 'Supply dangerously high (max 1 quadrillion recommended)' };
        return { valid: true };
    }
};

export function formatSupply(value: string): string {
    // Basic comma formatting for display input
    const raw = value.replace(/\D/g, ''); // strip non-digits
    if (!raw) return '';
    return Number(raw).toLocaleString('en-US');
}
