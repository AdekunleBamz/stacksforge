'use client';

import { useState } from 'react';
import { Flame, Menu, X } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { ThemeToggle } from './ThemeToggle';
import { NavLinks } from './NavLinks';
import Link from 'next/link';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="nav-inner">
                {/* Brand */}
                <Link href="/" className="nav-brand" onClick={() => setIsOpen(false)}>
                    <Flame size={28} className="brand-flame" />
                    <span className="brand-name">StacksForge</span>
                </Link>

                {/* Desktop Links */}
                <div className="nav-links desktop-only">
                    <NavLinks />
                </div>

                {/* Mobile Actions */}
                <div className="mobile-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="mobile-theme-toggle" style={{ display: 'flex' }}>
                        <ThemeToggle />
                    </div>
                    <button
                        className="mobile-toggle"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Desktop Wallet & Theme */}
                <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <ThemeToggle />
                    <WalletButton />
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
                    <div className="mobile-menu-inner">
                        <NavLinks mobile onLinkClick={() => setIsOpen(false)} />

                        <div className="mobile-wallet">
                            <WalletButton />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
