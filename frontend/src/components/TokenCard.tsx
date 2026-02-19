'use client';

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { TokenInfo } from '@/hooks/useTokenFactory';

interface TokenCardProps {
    token: TokenInfo;
    variants?: any;
}

export function TokenCard({ token, variants }: TokenCardProps) {
    return (
        <motion.div
            className="token-card"
            variants={variants}
            whileHover={{ y: -5, borderColor: 'var(--primary)' }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <div className="token-avatar">{token.symbol.slice(0, 2)}</div>
            <div className="token-info">
                <h3>{token.name}</h3>
                <span className="token-symbol">{token.symbol}</span>
            </div>
            <div className="token-meta">
                <span>Supply: {Number(token.supply).toLocaleString()}</span>
                <span>Decimals: {token.decimals}</span>
                <span className="creator">
                    {token.creator.slice(0, 8)}…{token.creator.slice(-4)}
                </span>
            </div>
            <a
                href={`https://explorer.hiro.so/address/${token.creator}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="token-explorer-link"
            >
                <ExternalLink size={14} /> Explorer
            </a>
        </motion.div>
    );
}
