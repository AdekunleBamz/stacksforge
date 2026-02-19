'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an analytics service
        console.error(error);
    }, [error]);

    return (
        <div className="error-container">
            <motion.div
                className="error-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="error-icon-wrapper">
                    <AlertCircle size={48} className="error-icon" />
                </div>
                <h2>Something went wrong!</h2>
                <p>We encountered an unexpected error. Please try again.</p>
                {process.env.NODE_ENV === 'development' && (
                    <div className="error-details">
                        <code>{error.message}</code>
                    </div>
                )}
                <button
                    onClick={() => reset()}
                    className="btn btn-primary"
                >
                    <RotateCcw size={18} />
                    Try again
                </button>
            </motion.div>
        </div>
    );
}
