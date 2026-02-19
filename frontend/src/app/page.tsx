import { Navbar } from '@/components/Navbar';
import { TokenForgeForm } from '@/components/TokenForgeForm';
import { TokenList } from '@/components/TokenList';

export default function HomePage() {
    return (
        <div className="app">
            <Navbar />

            {/* Hero */}
            <section className="hero">
                <div className="hero-glow" />
                <div className="hero-inner">
                    <div className="hero-badge">🔥 Powered by Stacks</div>
                    <h1 className="hero-title">
                        Forge <span className="gradient-text">SIP-010 Tokens</span>
                        <br />on Stacks Mainnet
                    </h1>
                    <p className="hero-subtitle">
                        Create and deploy your own fungible tokens in seconds.<br />
                        No coding required — just connect your wallet and forge.
                    </p>
                    <div className="hero-stats">
                        <div className="stat">
                            <strong>SIP-010</strong>
                            <span>Stacks Standard</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat">
                            <strong>Leather / Xverse</strong>
                            <span>Wallet Support</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat">
                            <strong>1 STX</strong>
                            <span>Creation Fee</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Forge Form */}
            <section id="forge" className="forge-section">
                <div className="section-inner">
                    <div className="section-label">Token Forge</div>
                    <h2 className="section-title">Deploy Your Token</h2>
                    <TokenForgeForm />
                </div>
            </section>

            {/* How it works */}
            <section className="how-section">
                <div className="section-inner">
                    <div className="section-label">How it works</div>
                    <h2 className="section-title">Three Steps to Launch</h2>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-num">01</div>
                            <h3>Connect Wallet</h3>
                            <p>Connect Leather or Xverse wallet using <code>@stacks/connect</code></p>
                        </div>
                        <div className="step-card">
                            <div className="step-num">02</div>
                            <h3>Fill Details</h3>
                            <p>Enter your token name, symbol, decimals, and total supply</p>
                        </div>
                        <div className="step-card">
                            <div className="step-num">03</div>
                            <h3>Forge</h3>
                            <p>Confirm in your wallet — your SIP-010 token is live on Stacks mainnet</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Token list */}
            <section id="tokens" className="tokens-section">
                <div className="section-inner">
                    <div className="section-label">On-chain</div>
                    <TokenList />
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <Flame size={20} className="brand-flame" />
                        <span>StacksForge</span>
                    </div>
                    <p className="footer-sub">Built on <strong>Stacks</strong> using <code>@stacks/connect</code> &amp; <code>@stacks/transactions</code></p>
                    <div className="footer-links">
                        <a href="https://github.com/AdekunleBamz/stacksforge" target="_blank" rel="noopener noreferrer">
                            <Github size={20} />
                        </a>
                        <a href="https://explorer.hiro.so" target="_blank" rel="noopener noreferrer">
                            🔍 Explorer
                        </a>
                    </div>
                    <p className="footer-copyright">MIT License © 2025 AdekunleBamz</p>
                </div>
            </footer>
        </div>
    );
}
