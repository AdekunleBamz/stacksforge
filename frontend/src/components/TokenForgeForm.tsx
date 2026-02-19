'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/contexts/ToastContext';
import { useTokenFactory } from '@/hooks/useTokenFactory';
import { Flame, Loader2, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react';

interface FormState {
    name: string;
    symbol: string;
    decimals: string;
    supply: string;
}

const INITIAL_FORM: FormState = {
    name: '',
    symbol: '',
    decimals: '6',
    supply: '1,000,000', // Formatted initial supply
};

export function TokenForgeForm() {
    const { connected } = useWallet();
    const { createToken, loading, txid, error } = useTokenFactory();
    const { success, error: toastError, info } = useToast();
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
        name: false, symbol: false, decimals: false, supply: false
    });
    const [errors, setErrors] = useState<Record<keyof FormState, string | undefined>>({});

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'supply') {
            // Auto-format supply with commas
            const raw = value.replace(/,/g, '');
            if (/^\d*$/.test(raw)) {
                finalValue = Number(raw).toLocaleString('en-US');
                if (finalValue === '0') finalValue = '';
            } else {
                // If non-numeric characters are entered, prevent update
                return;
            }
        }
        if (name === 'symbol') {
            finalValue = value.toUpperCase();
        }

        setForm(prev => ({ ...prev, [name]: finalValue }));

        // Clear error on change if touched (improving UX)
        if (touched[name as keyof FormState]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name as keyof FormState]: true }));
        validateField(name as keyof FormState, value);
    }

    // Helper to validate a single field
    function validateField(name: keyof FormState, value: string): boolean {
        let result = { valid: true, error: undefined as string | undefined };

        if (name === 'name') {
            if (!value.trim()) result = { valid: false, error: 'Token name is required' };
            else if (value.length > 64) result = { valid: false, error: 'Max 64 characters' };
        }
        if (name === 'symbol') {
            if (!value.trim()) result = { valid: false, error: 'Symbol is required' };
            else if (value.length > 11) result = { valid: false, error: 'Max 11 characters' };
        }
        if (name === 'decimals') {
            const dec = parseInt(value, 10);
            if (isNaN(dec) || dec < 0 || dec > 18) {
                result = { valid: false, error: 'Decimals must be 0–18' };
            }
        }
        if (name === 'supply') {
            const raw = value.replace(/,/g, '');
            if (!raw) result = { valid: false, error: 'Supply is required' };
            else if (BigInt(raw) <= 0n) result = { valid: false, error: 'Supply must be greater than 0' };
        }

        setErrors(prev => ({ ...prev, [name]: result.error }));
        return result.valid;
    }

    function validateAll(): boolean {
        // trigger validation for all fields
        const validName = validateField('name', form.name);
        const validSymbol = validateField('symbol', form.symbol);
        const validDecimals = validateField('decimals', form.decimals);
        const validSupply = validateField('supply', form.supply);

        setTouched({ name: true, symbol: true, decimals: true, supply: true });

        return validName && validSymbol && validDecimals && validSupply;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validateAll()) return;

        info('Broadcasting transaction…', 'Please confirm in your Stacks wallet.');

        const result = await createToken({
            name: form.name.trim(),
            symbol: form.symbol.trim().toUpperCase(),
            decimals: parseInt(form.decimals, 10),
            supply: BigInt(form.supply.replace(/,/g, '')) * (10n ** BigInt(form.decimals)),
        });

        if (result?.txid) {
            success(
                'Token created! 🎉',
                `${form.name} (${form.symbol}) is now live on Stacks mainnet.`
            );
        } else if (result?.error || error) {
            toastError('Transaction failed', result?.error ?? error ?? 'Unknown error');
        }
    }

    if (txid) {
        return (
            <div className="forge-card success-card">
                <CheckCircle2 size={48} className="success-icon" />
                <h2>Token Created! 🎉</h2>
                <p className="success-message">
                    Your SIP-010 token <strong>{form.name}</strong> ({form.symbol}) is now live on Stacks mainnet.
                </p>
                <a
                    className="btn btn-primary"
                    href={`https://explorer.hiro.so/txid/${txid}?chain=mainnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <ExternalLink size={16} />
                    View on Stacks Explorer
                </a>
                <button className="btn btn-outline" onClick={() => window.location.reload()}>
                    Forge Another Token
                </button>
            </div>
        );
    }

    return (
        <form className="forge-card" onSubmit={handleSubmit} noValidate>
            <div className="form-header">
                <Flame size={32} className="flame-icon" />
                <h2>Create Your Token</h2>
                <p>Deploy a SIP-010 fungible token on Stacks mainnet in seconds.</p>
            </div>

            <div className="form-group">
                <label htmlFor="name">Token Name</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g. Galaxy Coin"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={64}
                    required
                    className={`form-input ${errors.name && touched.name ? 'input-error' : ''}`}
                    disabled={loading || !connected}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                />
                <span className="char-count">{form.name.length}/64</span>
                {errors.name && touched.name && (
                    <span id="name-error" className="error-message">
                        <AlertTriangle size={12} /> {errors.name}
                    </span>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="symbol">Symbol</label>
                <input
                    id="symbol"
                    name="symbol"
                    type="text"
                    placeholder="e.g. GLXY"
                    value={form.symbol}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={11}
                    required
                    className={`form-input ${errors.symbol && touched.symbol ? 'input-error' : ''}`}
                    disabled={loading || !connected}
                    aria-invalid={!!errors.symbol}
                    aria-describedby={errors.symbol ? "symbol-error" : undefined}
                />
                <span className="char-count">{form.symbol.length}/11</span>
                {errors.symbol && touched.symbol && (
                    <span id="symbol-error" className="error-message">
                        <AlertTriangle size={12} /> {errors.symbol}
                    </span>
                )}
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="decimals">Decimals</label>
                    <select
                        id="decimals"
                        name="decimals"
                        value={form.decimals}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`form-input ${errors.decimals && touched.decimals ? 'input-error' : ''}`}
                        disabled={loading || !connected}
                    >
                        <option value="0">0</option>
                        <option value="6">6 (standard)</option>
                        <option value="8">8</option>
                        <option value="18">18</option>
                    </select>
                    {errors.decimals && touched.decimals && (
                        <span className="error-message">
                            <AlertTriangle size={12} /> {errors.decimals}
                        </span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="supply">Total Supply</label>
                    <input
                        id="supply"
                        name="supply"
                        type="text"
                        placeholder="1,000,000"
                        value={form.supply}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={`form-input ${errors.supply && touched.supply ? 'input-error' : ''}`}
                        disabled={loading || !connected}
                        aria-invalid={!!errors.supply}
                        aria-describedby={errors.supply ? "supply-error" : undefined}
                    />
                    {errors.supply && touched.supply && (
                        <span id="supply-error" className="error-message">
                            <AlertTriangle size={12} /> {errors.supply}
                        </span>
                    )}
                </div>
            </div>

            {error && (
                <div className="error-alert">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            <div className="fee-info">
                <span>Creation fee:</span>
                <strong>0.002 STX</strong>
            </div>

            {!connected ? (
                <p className="connect-hint">Connect your Stacks wallet (Leather / Xverse) to forge a token.</p>
            ) : (
                <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={loading}
                    id="forge-btn"
                >
                    {loading ? (
                        <><Loader2 size={20} className="spin" /> Confirm in wallet…</>
                    ) : (
                        <><Flame size={20} /> Forge Token</>
                    )}
                </button>
            )}
        </form>
    );
}
