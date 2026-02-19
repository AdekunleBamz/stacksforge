'use client';

import { useState } from 'react';
import { Flame, Menu, X, Github, BookOpen } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { ThemeToggle } from './ThemeToggle';
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
                    <a href="#forge" className="nav-link">Forge</a>
                    <a href="#tokens" className="nav-link">Tokens</a>
                    <a href="https://docs.stacks.co" target="_blank" rel="noopener noreferrer" className="nav-link">Docs</a>
                </div>

                {/* Mobile Actions */}
                <div className="mobile-actions">
                    <div className="mobile-theme-toggle">
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
                <div className="desktop-only nav-actions">
                    <ThemeToggle />
                    <WalletButton />
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
                    <div className="mobile-menu-inner">
                        <a href="#forge" className="mobile-link" onClick={() => setIsOpen(false)}>
                            Forge Token
                        </a>
                        <a href="#tokens" className="mobile-link" onClick={() => setIsOpen(false)}>
                            View Tokens
                        </a>
                        <a href="https://docs.stacks.co" target="_blank" rel="noopener noreferrer" className="mobile-link" onClick={() => setIsOpen(false)}>
                            <BookOpen size={16} /> Documentation
                        </a>
                        <a href="https://github.com/AdekunleBamz/stacksforge" target="_blank" rel="noopener noreferrer" className="mobile-link" onClick={() => setIsOpen(false)}>
                            <Github size={16} /> GitHub
                        </a>

                        <div className="mobile-wallet">
                            <WalletButton />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
