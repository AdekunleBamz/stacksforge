'use client';

/**
 * StacksWalletContext
 * Provides Stacks wallet connection using @stacks/connect
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { showConnect, disconnect, AppConfig, UserSession } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

export interface WalletState {
    connected: boolean;
    address: string | null;
    network: StacksMainnet | null;
}

interface WalletContextValue extends WalletState {
    connect: () => void;
    disconnect: () => void;
}

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
    const network = new StacksMainnet();

    const [state, setState] = useState<WalletState>(() => {
        if (typeof window !== 'undefined' && userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            return {
                connected: true,
                address: userData.profile.stxAddress.mainnet,
                network,
            };
        }
        return { connected: false, address: null, network: null };
    });

    const connect = useCallback(() => {
        showConnect({
            appDetails: {
                name: 'StacksForge',
                icon: `${window.location.origin}/icon.png`,
            },
            redirectTo: '/',
            onFinish: () => {
                const userData = userSession.loadUserData();
                setState({
                    connected: true,
                    address: userData.profile.stxAddress.mainnet,
                    network,
                });
            },
            userSession,
        });
    }, [network]);

    const disconnectWallet = useCallback(() => {
        disconnect();
        userSession.signUserOut('/');
        setState({ connected: false, address: null, network: null });
    }, []);

    return (
        <WalletContext.Provider value={{ ...state, connect, disconnect: disconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
    return ctx;
}
