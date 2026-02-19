import { cn } from '@/lib/utils';
import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
    className,
    variant = 'text',
    width,
    height,
    animation = 'pulse',
    style,
    ...props
}: SkeletonProps) {
    const computedStyle: React.CSSProperties = {
        width,
        height,
        ...style,
    };

    return (
        <div
            className={cn(
                styles.skeleton,
                styles[variant],
                animation !== 'none' && styles[animation],
                className
            )}
            style={computedStyle}
            aria-hidden="true"
            {...props}
        />
    );
}

// Helper utility (if strictly needed inline, but better in lib/utils.ts generally)
// Assuming user might not have `cn` (clsx/tailwind-merge). If not, basic join:
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
