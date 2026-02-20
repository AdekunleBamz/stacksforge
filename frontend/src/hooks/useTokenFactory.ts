'use client';

/**
 * useToken hook
 * Calls token-factory-v-i2 contract using @stacks/transactions + @stacks/connect
 */

import { useCallback, useState } from 'react';
import {
    openContractCall,
    ContractCallOptions,
} from '@stacks/connect';
import {
    callReadOnlyFunction,
    uintCV,
    stringAsciiCV,
    cvToJSON,
    makeStandardSTXPostCondition,
    FungibleConditionCode,
    bigIntToBytes,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { useWallet } from '@/contexts/WalletContext';
import { trackEvent } from '@/lib/analytics';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '';
const [CONTRACT_ADDRESS, CONTRACT_NAME] = FACTORY_ADDRESS.split('.');

function mapError(err: any): string {
    const msg = err?.message || String(err);
    if (msg.includes('User denied')) return 'Transaction cancelled by user';
    if (msg.includes('Not enough funds')) return 'Insufficient STX balance';
    if (msg.includes('404')) return 'Contract not found';
    return msg;
}

export interface TokenInfo {
    tokenId: number;
    name: string;
    symbol: string;
    decimals: number;
    supply: string;
    creator: string;
    createdAt: number;
}

export interface CreateTokenParams {
    name: string;
    symbol: string;
    decimals: number;
    supply: bigint;
}

export function useTokenFactory() {
    const { address, network } = useWallet();
    const [loading, setLoading] = useState(false);
    const [txid, setTxid] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const net = network ?? new StacksMainnet();

    // ---- Read-only calls using @stacks/transactions ----

    const getTokenCount = useCallback(async (): Promise<number> => {
        const result = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-token-count',
            functionArgs: [],
            network: net,
            senderAddress: CONTRACT_ADDRESS,
        });
        return Number(cvToJSON(result).value);
    }, [net]);

    const getTokenById = useCallback(async (id: number): Promise<TokenInfo | null> => {
        const result = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-token-by-id',
            functionArgs: [uintCV(id)],
            network: net,
            senderAddress: CONTRACT_ADDRESS,
        });
        const json = cvToJSON(result);
        if (json.type === 'err') return null;
        const v = json.value;
        return {
            tokenId: Number(v['token-id'].value),
            name: v['name'].value,
            symbol: v['symbol'].value,
            decimals: Number(v['decimals'].value),
            supply: v['supply'].value,
            creator: v['creator'].value,
            createdAt: Number(v['created-at'].value),
        };
    }, [net]);

    const getTokensByCreator = useCallback(async (creator: string): Promise<number[]> => {
        const result = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-tokens-by-creator',
            functionArgs: [{ type: 3, address: { version: 22, hash160: creator } } as any],
            network: net,
            senderAddress: CONTRACT_ADDRESS,
        });
        const json = cvToJSON(result);
        if (json.value && Array.isArray(json.value)) {
            return json.value.map((v: any) => Number(v.value));
        }
        return [];
    }, [net]);

    const getCreationFee = useCallback(async (): Promise<bigint> => {
        const result = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-creation-fee',
            functionArgs: [],
            network: net,
            senderAddress: CONTRACT_ADDRESS,
        });
        return BigInt(cvToJSON(result).value);
    }, [net]);

    // ---- Contract call using @stacks/connect ----

    const createToken = useCallback(async (params: CreateTokenParams): Promise<void> => {
        if (!address) throw new Error('Wallet not connected');
        if (!params.name || !params.symbol) throw new Error('Invalid token details');
        if (params.supply <= 0n) throw new Error('Supply must be positive');

        setLoading(true);
        setError(null);
        setTxid(null);

        try {
            const fee = await getCreationFee();

            const options: ContractCallOptions = {
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'create-token',
                functionArgs: [
                    stringAsciiCV(params.name),
                    stringAsciiCV(params.symbol),
                    uintCV(params.decimals),
                    uintCV(params.supply),
                ],
                postConditions: [],
                network: net,
                appDetails: {
                    name: 'StacksForge',
                    icon: `${window.location.origin}/icon.png`,
                },
                onFinish: (data) => {
                    setTxid(data.txId);
                    setLoading(false);
                },
                onCancel: () => {
                    setError('Transaction cancelled');
                    setLoading(false);
                },
            };

            await openContractCall(options);
        } catch (err: any) {
            const msg = mapError(err);
            setError(msg);
            trackEvent('forge_token_error', { error: msg, originalError: err.message });
            setLoading(false);
        }
    }, [address, net, getCreationFee]);

    return {
        createToken,
        getTokenCount,
        getTokenById,
        getTokensByCreator,
        getCreationFee,
        loading,
        txid,
        error,
    };
}
