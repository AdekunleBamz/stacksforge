'use client';

import { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    description?: string;
    charCount?: {
        current: number;
        max: number;
    };
    error?: string;
}

export function FormInput({
    label,
    description,
    charCount,
    error,
    className,
    id,
    ...props
}: FormInputProps) {
    return (
        <div className={`form-group ${className || ''}`}>
            <label htmlFor={id} className="form-label">
                {label}
            </label>
            {description && <p className="form-description">{description}</p>}

            <input
                id={id}
                className={`form-input ${error ? 'input-error' : ''}`}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                {...props}
            />

            {charCount && (
                <span className="char-count">
                    {charCount.current}/{charCount.max}
                </span>
            )}

            {error && (
                <p id={`${id}-error`} className="error-message">
                    {error}
                </p>
            )}
        </div>
    );
}
