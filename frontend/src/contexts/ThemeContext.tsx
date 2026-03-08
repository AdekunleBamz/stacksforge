'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextProps {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark for branding
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('stacksforge-theme') as Theme | null;
        if (stored) {
            setThemeState(stored);
        } else {
            // Check system pref if no stored pref, but we default to dark anyway for this app
            if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                // setThemeState('light'); // Optional: force dark first
            }
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        const targetTheme = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;

        root.setAttribute('data-theme', targetTheme);
        localStorage.setItem('stacksforge-theme', theme);

    }, [theme, mounted]);

    function toggleTheme() {
        setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeState }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
}
