'use client';

import { useWallet } from '@/contexts/WalletContext';
import { Wallet, LogOut } from 'lucide-react';
import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

export function WalletButton() {
    const { connected, address, connect, disconnect } = useWallet();
    const [hovering, setHovering] = useState(false);

    const handleConnect = () => {
        trackEvent('connect_wallet');
        connect();
    };

    const handleDisconnect = () => {
        trackEvent('disconnect_wallet');
        disconnect();
    };

    if (connected && address) {
        const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
        return (
            <div className="wallet-connected" role="status" aria-label="Wallet connected">
                <span className="address-badge" title={address}>
                    {short}
                </span>
                <button
                    className="btn btn-outline"
                    onClick={handleDisconnect}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                    aria-label="Disconnect wallet"
                    title="Disconnect wallet"
                >
                    <LogOut size={16} aria-hidden="true" />
                    {hovering ? 'Disconnect' : 'Connected'}
                </button>
            </div>
        );
    }

    return (
        <button
            className="btn btn-primary"
            onClick={handleConnect}
            aria-label="Connect Stacks Wallet"
        >
            <Wallet size={18} aria-hidden="true" />
            Connect Wallet
        </button>
    );
}
