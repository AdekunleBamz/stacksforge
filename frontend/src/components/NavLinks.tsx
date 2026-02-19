'use client';

import { BookOpen, Github } from 'lucide-react';

interface NavLinksProps {
    mobile?: boolean;
    onLinkClick?: () => void;
}

export function NavLinks({ mobile, onLinkClick }: NavLinksProps) {
    const className = mobile ? 'mobile-link' : 'nav-link';

    return (
        <>
            <a href="#forge" className={className} onClick={onLinkClick}>
                Forge
            </a>
            <a href="#tokens" className={className} onClick={onLinkClick}>
                Tokens
            </a>
            <a
                href="https://docs.stacks.co"
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                onClick={onLinkClick}
            >
                {mobile && <BookOpen size={16} />} Docs
            </a>
            {mobile && (
                <a
                    href="https://github.com/AdekunleBamz/stacksforge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    onClick={onLinkClick}
                >
                    <Github size={16} /> GitHub
                </a>
            )}
        </>
    );
}
