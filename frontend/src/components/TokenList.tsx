// Replace Loader2 with Skeleton import
import { useEffect, useState } from 'react';
import { useTokenFactory, TokenInfo } from '@/hooks/useTokenFactory';
import { ExternalLink, Coins } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';

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

                // Keep showing skeletons for a tiny bit longer to prevent layout thrashing if fast
                // or just set loading false immediately
                setLoading(false);
            }
        }
        load();
    }, [getTokenCount, getTokenById]);

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
            <div className="token-grid">
                {tokens.map(t => (
                    <div key={t.tokenId} className="token-card">
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
                    </div>
                ))}
            </div>
        </div>
    );
}
