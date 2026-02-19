import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { WalletProvider } from '@/contexts/WalletContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastContainer } from '@/components/ToastContainer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#0a0a0f',
};

export const metadata: Metadata = {
    metadataBase: new URL('https://stacksforge.xyz'),
    title: {
        default: 'StacksForge — Forge SIP-010 Tokens on Stacks',
        template: '%s | StacksForge',
    },
    description: 'Create and deploy SIP-010 fungible tokens on Stacks mainnet in seconds. No coding required — just connect your wallet and forge.',
    keywords: ['Stacks', 'STX', 'SIP-010', 'token generator', 'fungible token', 'blockchain', 'crypto', 'no-code'],
    authors: [{ name: 'StacksForge Team' }],
    creator: 'StacksForge',
    openGraph: {
        title: 'StacksForge — No-Code Token Generator',
        description: 'Deploy SIP-010 tokens on Stacks mainnet with one click.',
        url: 'https://stacksforge.xyz',
        siteName: 'StacksForge',
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'StacksForge',
        description: 'Deploy SIP-010 tokens on Stacks mainnet in seconds.',
        creator: '@StacksForge',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body>
                <ThemeProvider>
                    <WalletProvider>
                        <ToastProvider>
                            {children}
                            <ToastContainer />
                        </ToastProvider>
                    </WalletProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
