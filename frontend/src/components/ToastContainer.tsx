'use client';

import { useToast, Toast, ToastType } from '@/contexts/ToastContext';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(onDismiss, 300);  // wait for exit animation
    };

    return (
        <div
            className={`toast toast--${toast.type} ${visible ? 'toast--visible' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <span className="toast__icon">{ICONS[toast.type]}</span>
            <div className="toast__body">
                <p className="toast__title">{toast.title}</p>
                {toast.message && <p className="toast__message">{toast.message}</p>}
            </div>
            <button
                className="toast__close"
                onClick={handleDismiss}
                aria-label="Dismiss notification"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export function ToastContainer() {
    const { toasts, dismiss } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" aria-label="Notifications" role="region">
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
        </div>
    );
}
