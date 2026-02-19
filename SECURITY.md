# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in StacksForge, please **do not** open a public issue.

Instead, email: **security@stacksforge.xyz**

Include:
- A description of the vulnerability
- Steps to reproduce
- Impact assessment

We will respond within 48 hours and work with you on a responsible disclosure timeline.

## Security Notes

- Clarity contracts are fully open source and auditable
- No private keys are ever stored or transmitted by the frontend (`@stacks/connect` handles all signing in the user's wallet extension)
- The creation fee is enforced on-chain and cannot be bypassed
