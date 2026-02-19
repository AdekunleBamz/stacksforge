# Changelog

All notable changes to StacksForge are documented here.

## [1.0.0] — 2025-02-19

### Added
- `sip-010-trait.clar` — SIP-010 fungible token standard trait
- `forge-token.clar` — SIP-010 compliant token (mint, burn, transfer, initialize)
- `token-factory.clar` — Registry contract with fee collection and creator tracking
- Clarinet unit tests for both contracts (14 test cases)
- Deployment scripts using `@stacks/transactions`
  - `deploy.ts` — deploys all contracts to Stacks mainnet
  - `verify-deployment.ts` — verifies on-chain state
  - `interact.ts` — example `create-token` interaction
- Next.js 14 frontend
  - `WalletContext.tsx` — `@stacks/connect` wallet integration (Leather / Xverse)
  - `useTokenFactory.ts` — read/write hooks using `@stacks/connect` and `@stacks/transactions`
  - `WalletButton.tsx` — connect/disconnect UI
  - `TokenForgeForm.tsx` — full token creation form with validation
  - `TokenList.tsx` — on-chain token browser
  - Dark glassmorphism theme with animations
- Documentation: README, ARCHITECTURE, CONTRIBUTING, SECURITY

### Contract Addresses (Mainnet)
> Populated after deployment — see `deployments/mainnet.json`
