import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WalletProvider } from '@/contexts/WalletContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'StacksForge — Forge SIP-010 Tokens on Stacks',
    description: 'Create and deploy SIP-010 fungible tokens on Stacks mainnet in seconds. No coding required — just connect your wallet and forge.',
    keywords: ['Stacks', 'STX', 'SIP-010', 'token', 'fungible token', 'blockchain', 'StacksForge'],
    openGraph: {
        title: 'StacksForge',
        description: 'Deploy SIP-010 tokens on Stacks mainnet with one click.',
        url: 'https://stacksforge.xyz',
        siteName: 'StacksForge',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'StacksForge',
        creator: '@StacksForge',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.variable}>
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body>
                <WalletProvider>
                    {children}
                </WalletProvider>
            </body>
        </html>
    );
}
