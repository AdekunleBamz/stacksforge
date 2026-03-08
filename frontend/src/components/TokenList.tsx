import { useEffect, useState } from 'react';
import { useTokenFactory, TokenInfo } from '@/hooks/useTokenFactory';
import { ExternalLink, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { TokenCard } from './TokenCard';
import { Skeleton } from './Skeleton';

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
            <div className="token-list">
                <div className="token-list-header">
                    <h2>All Tokens</h2>
                    <Skeleton width={80} height={24} className="badge-skeleton" style={{ borderRadius: 999 }} />
                </div>
                <div className="token-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="token-card">
                            <Skeleton variant="rectangular" width={44} height={44} style={{ borderRadius: 12 }} />
                            <div className="token-info" style={{ width: '100%' }}>
                                <Skeleton width="60%" height={20} style={{ marginBottom: 4 }} />
                                <Skeleton width="30%" height={16} />
                            </div>
                            <div className="token-meta" style={{ width: '100%', marginTop: 'auto' }}>
                                <Skeleton width="80%" height={14} />
                                <Skeleton width="50%" height={14} />
                                <Skeleton width="40%" height={14} style={{ marginTop: 4 }} />
                            </div>
                        </div>
                    ))}
                </div>
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
                    <TokenCard key={t.tokenId} token={t} variants={item} />
                ))}
            </motion.div>
        </div>
    );
}