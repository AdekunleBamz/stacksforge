'use client';

import { useWallet } from '@/contexts/WalletContext';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function WalletButton() {
    const { connected, address, connect, disconnect } = useWallet();
    const [hovering, setHovering] = useState(false);

    if (connected && address) {
        const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
        return (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="address-badge">{short}</span>
                <button
                    className="btn btn-outline"
                    onClick={disconnect}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                    title="Disconnect wallet"
                >
                    <LogOut size={16} />
                    {hovering ? 'Disconnect' : 'Connected'}
                </button>
            </div>
        );
    }

    return (
        <button className="btn btn-primary" onClick={connect}>
            <Wallet size={18} />
            Connect Wallet
        </button>
    );
}
