'use client';

import Link from 'next/link';
import { Flame, Github, Twitter, Heart } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame size={24} className="text-primary" />
                        <span className="font-bold text-xl">StacksForge</span>
                    </div>
                    <p className="footer-desc">
                        The easiest way to forge SIP-010 fungible tokens on the Stacks blockchain. No code required.
                    </p>
                </div>

                <div className="footer-links">
                    <div className="link-column">
                        <h4>Product</h4>
                        <Link href="#forge">Forge Token</Link>
                        <Link href="#tokens">Explorer</Link>
                        <Link href="/sitemap.xml">Sitemap</Link>
                    </div>
                    <div className="link-column">
                        <h4>Resources</h4>
                        <a href="https://docs.stacks.co" target="_blank" rel="noopener noreferrer">Stacks Docs</a>
                        <a href="https://explorer.hiro.so" target="_blank" rel="noopener noreferrer">Hiro Explorer</a>
                        <a href="https://leather.io" target="_blank" rel="noopener noreferrer">Leather Wallet</a>
                    </div>
                    <div className="link-column">
                        <h4>Community</h4>
                        <a href="https://github.com/AdekunleBamz/stacksforge" target="_blank" rel="noopener noreferrer">GitHub</a>
                        <a href="https://twitter.com/Stacks" target="_blank" rel="noopener noreferrer">Twitter</a>
                        <a href="https://discord.gg/stacks" target="_blank" rel="noopener noreferrer">Discord</a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {currentYear} StacksForge. All rights reserved.</p>
                <div className="made-with">
                    <span>Made with</span>
                    <Heart size={14} className="heart-icon" fill="currentColor" />
                    <span>on Stacks</span>
                </div>
                <div className="social-icons">
                    <a href="https://github.com/AdekunleBamz/stacksforge" aria-label="GitHub"><Github size={20} /></a>
                    <a href="https://twitter.com/Stacks" aria-label="Twitter"><Twitter size={20} /></a>
                </div>
            </div>
        </footer>
    );
}
