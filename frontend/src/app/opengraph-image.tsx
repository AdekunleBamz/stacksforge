import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'StacksForge - Forge SIP-010 Tokens';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0a0a0f',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter',
                    color: '#fff',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '800px',
                        height: '800px',
                        background: 'radial-gradient(circle, rgba(255,98,0,0.2) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ff6200"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.246-3.646-3.791-5.321C6.205 3.676 6.088 3.5 6.088 3.5c0 0 .142.161.411.536C8.016 5.864 9.385 8.1 9.385 9.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5c0-1.282-1.12-3.197-2.316-5.112C11.976 4.225 11.912 4 11.912 4s.08.192.203.468c.382.853.79 1.9 1.144 2.872C14.075 9.774 15.249 11.5 16 12.5a4.5 4.5 0 0 1-2.91 7.234C8.618 19.89 8 18.5 8 16c0-1.5 1-2.5 2.5-3.5 1.5-1 2.5-3 2.5-2h-3c-1 0-1.5-.5-1.5-1.5v-1a4 4 0 0 1 1-2.5" />
                    </svg>
                    <h1 style={{ fontSize: '80px', fontWeight: 800, margin: 0 }}>StacksForge</h1>
                </div>
                <p style={{ fontSize: '32px', color: '#8888aa', marginTop: '20px', zIndex: 1 }}>
                    Deploy SIP-010 Tokens on Stacks Mainnet
                </p>
                <div style={{
                    marginTop: '40px',
                    padding: '12px 24px',
                    background: 'rgba(255,98,0,0.1)',
                    border: '1px solid rgba(255,98,0,0.3)',
                    borderRadius: '12px',
                    color: '#ff9a3c',
                    fontSize: '24px',
                    zIndex: 1
                }}>
                    No Code Required
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
