'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/contexts/ToastContext';
import { useTokenFactory } from '@/hooks/useTokenFactory';
import { trackEvent } from '@/lib/analytics';
import { FormInput } from './FormInput';
import { Flame, Loader2, CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateTokenForm, formatSupply, type TokenFormState } from '@/lib/validation';

const INITIAL_FORM: TokenFormState = {
    name: '',
    symbol: '',
    decimals: '6',
    supply: '1,000,000', // Formatted initial supply
};

export function TokenForgeForm() {
    const { connected } = useWallet();
    const { createToken, loading, txid, error: factoryError } = useTokenFactory();
    const { success, error: toastError, info } = useToast();
    const [form, setForm] = useState<TokenFormState>(INITIAL_FORM);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Watch for success
    useEffect(() => {
        if (txid) {
            trackEvent('forge_token_success', { txid, name: form.name, symbol: form.symbol });
        }
    }, [txid, form.name, form.symbol]);

    // Watch for errors
    useEffect(() => {
        if (factoryError) {
            trackEvent('forge_token_error', { error: factoryError });
        }
    }, [factoryError]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        let newValue = value;

        // Input masking for supply
        if (name === 'supply') {
            newValue = formatSupply(value);
        }
        if (name === 'symbol') {
            newValue = value.toUpperCase();
        }

        setForm(prev => {
            const up = { ...prev, [name]: newValue };
            // Real-time validation if touched
            if (touched[name]) {
                const { errors: newErrors } = validateTokenForm(up);
                setErrors(prevErr => ({ ...prevErr, [name]: newErrors[name as keyof TokenFormState] || '' }));
            }
            return up;
        });
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const { errors: newErrors } = validateTokenForm(form);
        setErrors(prev => ({ ...prev, [name]: newErrors[name as keyof TokenFormState] || '' }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setTouched({ name: true, symbol: true, decimals: true, supply: true });

        const { isValid, errors: validationErrors } = validateTokenForm(form);
        if (!isValid) {
            setErrors(validationErrors as Record<string, string>);
            return;
        }

        trackEvent('forge_token_start', { name: form.name, symbol: form.symbol });

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
        } else if (result?.error || factoryError) {
            toastError('Transaction failed', result?.error ?? factoryError ?? 'Unknown error');
        }
    }

    if (txid) {
        return (
            <motion.div
                className="forge-card success-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
            >
                <CheckCircle2 size={48} className="success-icon" />
                <h2>Token Created! 🎉</h2>
                <p className="success-message">
                    Your SIP-010 token <strong>{form.name}</strong> ({form.symbol}) is now live on Stacks mainnet.
                </p>
                <div className="flex gap-4 mt-6 justify-center">
                    <a
                        className="btn btn-primary"
                        href={`https://explorer.hiro.so/txid/${txid}?chain=mainnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('click_explorer', { txid })}
                    >
                        <ExternalLink size={16} />
                        View on Explorer
                    </a>
                    <button
                        className="btn btn-outline"
                        onClick={() => window.location.reload()}
                    >
                        Forge Another
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.form
            className="forge-card"
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="form-header">
                <Flame size={32} className="flame-icon" />
                <h2>Create Your Token</h2>
                <p>Deploy a SIP-010 fungible token on Stacks mainnet in seconds.</p>
            </div>

            <FormInput
                id="name"
                name="name"
                label="Token Name"
                placeholder="e.g. Galaxy Coin"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={64}
                required
                disabled={loading || !connected}
                charCount={{ current: form.name.length, max: 64 }}
                error={errors.name}
            />

            <FormInput
                id="symbol"
                name="symbol"
                label="Symbol"
                placeholder="e.g. GLXY"
                value={form.symbol}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={11}
                required
                disabled={loading || !connected}
                charCount={{ current: form.symbol.length, max: 11 }}
                error={errors.symbol}
            />

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="decimals">Decimals</label>
                    <select
                        id="decimals"
                        name="decimals"
                        value={form.decimals}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`form-input ${errors.decimals ? 'input-error' : ''}`}
                        disabled={loading || !connected}
                    >
                        <option value="0">0</option>
                        <option value="6">6 (standard)</option>
                        <option value="8">8</option>
                        <option value="18">18</option>
                    </select>
                    {errors.decimals && (
                        <span className="error-message">
                            <AlertTriangle size={12} /> {errors.decimals}
                        </span>
                    )}
                </div>

                <FormInput
                    id="supply"
                    name="supply"
                    label="Total Supply"
                    type="text"
                    placeholder="1,000,000"
                    value={form.supply}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    disabled={loading || !connected}
                    error={errors.supply}
                />
            </div>

            <AnimatePresence>
                {(factoryError) && (
                    <motion.div
                        className="error-alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <AlertTriangle size={16} />
                        {factoryError}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fee-info">
                <span>Creation fee:</span>
                <strong>0.002 STX</strong>
            </div>

            {!connected ? (
                <p className="connect-hint">Connect your Stacks wallet (Leather / Xverse) to forge a token.</p>
            ) : (
                <motion.button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={loading}
                    id="forge-btn"
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                >
                    {loading ? (
                        <><Loader2 size={20} className="spin" /> Confirm in wallet…</>
                    ) : (
                        <><Flame size={20} /> Forge Token</>
                    )}
                </motion.button>
            )}
        </motion.form>
    );
}
