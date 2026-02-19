'use client';

import { useEffect, useState } from 'react';
import { useTokenFactory, TokenInfo } from '@/hooks/useTokenFactory';
import { ExternalLink, Loader2, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export function TokenList() {
    const { getTokenCount, getTokenById } = useTokenFactory();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);

    useEffect(() => {
        async function load() {
            try {
                const total = await getTokenCount();
                setCount(total);
                const tokenData: TokenInfo[] = [];
                // Load last 20 tokens
                const start = Math.max(0, total - 20);
                for (let i = total - 1; i >= start; i--) {
                    const t = await getTokenById(i);
                    if (t) tokenData.push(t);
                }
                setTokens(tokenData);
            } catch (e) {
                console.error('Failed to load tokens', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [getTokenCount, getTokenById]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="token-list-loading">
                <Loader2 size={32} className="spin" />
                <p>Loading tokens from Stacks mainnet…</p>
            </div>
        );
    }

    if (tokens.length === 0) {
        return (
            <div className="empty-state">
                <Coins size={48} />
                <h3>No tokens yet</h3>
                <p>Be the first to forge a SIP-010 token on Stacks!</p>
            </div>
        );
    }

    return (
        <div className="token-list">
            <div className="token-list-header">
                <h2>All Tokens</h2>
                <span className="badge">{count} total</span>
            </div>
            <motion.div
                className="token-grid"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {tokens.map(t => (
                    <motion.div
                        key={t.tokenId}
                        className="token-card"
                        variants={item}
                        whileHover={{ y: -5, borderColor: 'var(--primary)' }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <div className="token-avatar">{t.symbol.slice(0, 2)}</div>
                        <div className="token-info">
                            <h3>{t.name}</h3>
                            <span className="token-symbol">{t.symbol}</span>
                        </div>
                        <div className="token-meta">
                            <span>Supply: {Number(t.supply).toLocaleString()}</span>
                            <span>Decimals: {t.decimals}</span>
                            <span className="creator">
                                {t.creator.slice(0, 8)}…{t.creator.slice(-4)}
                            </span>
                        </div>
                        <a
                            href={`https://explorer.hiro.so/address/${t.creator}?chain=mainnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="token-explorer-link"
                        >
                            <ExternalLink size={14} /> Explorer
                        </a>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
