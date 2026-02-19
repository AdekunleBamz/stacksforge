'use client';

import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="global-error-container">
                    <div className="error-content">
                        <h2>Critical Error</h2>
                        <p>A critical error occurred in the application.</p>
                        <button onClick={() => reset()} className="btn btn-primary">
                            Reload Application
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
