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
    supply: '1000000',
};

export function TokenForgeForm() {
    const { connected } = useWallet();
    const { createToken, loading, txid, error } = useTokenFactory();
    const { success, error: toastError, info } = useToast();
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [validationError, setValidationError] = useState<string | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setValidationError(null);
    }

    function validate(): boolean {
        if (!form.name.trim() || form.name.length > 64) {
            setValidationError('Token name must be 1–64 characters.');
            return false;
        }
        if (!form.symbol.trim() || form.symbol.length > 11) {
            setValidationError('Symbol must be 1–11 characters.');
            return false;
        }
        const dec = parseInt(form.decimals, 10);
        if (isNaN(dec) || dec < 0 || dec > 18) {
            setValidationError('Decimals must be 0–18.');
            return false;
        }
        const sup = BigInt(form.supply.replace(/,/g, ''));
        if (sup <= 0n) {
            setValidationError('Supply must be greater than 0.');
            return false;
        }
        return true;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

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
        <form className="forge-card" onSubmit={handleSubmit}>
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
                    maxLength={64}
                    required
                    className="form-input"
                    disabled={loading || !connected}
                />
                <span className="char-count">{form.name.length}/64</span>
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
                    maxLength={11}
                    required
                    className="form-input"
                    disabled={loading || !connected}
                />
                <span className="char-count">{form.symbol.length}/11</span>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="decimals">Decimals</label>
                    <select
                        id="decimals"
                        name="decimals"
                        value={form.decimals}
                        onChange={handleChange}
                        className="form-input"
                        disabled={loading || !connected}
                    >
                        <option value="0">0</option>
                        <option value="6">6 (standard)</option>
                        <option value="8">8</option>
                        <option value="18">18</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="supply">Total Supply</label>
                    <input
                        id="supply"
                        name="supply"
                        type="number"
                        placeholder="1000000"
                        value={form.supply}
                        onChange={handleChange}
                        min="1"
                        required
                        className="form-input"
                        disabled={loading || !connected}
                    />
                </div>
            </div>

            {(validationError || error) && (
                <div className="error-alert">
                    <AlertTriangle size={16} />
                    {validationError || error}
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
