'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, HelpCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="error-container">
            <motion.div
                className="error-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="error-icon-wrapper" style={{ color: 'var(--primary)' }}>
                    <HelpCircle size={48} className="error-icon" />
                </div>
                <h2>Page Not Found</h2>
                <p>The page you are looking for doesn't exist or has been moved.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <Link href="/" className="btn btn-primary">
                        <Home size={18} />
                        Go Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
