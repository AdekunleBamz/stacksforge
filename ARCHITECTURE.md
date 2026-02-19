# StacksForge Architecture

## Overview

StacksForge is a SIP-010 token factory built natively on the Stacks blockchain using Clarity smart contracts. The frontend is a Next.js 14 app using `@stacks/connect` for wallet authentication and `@stacks/transactions` for on-chain reads and writes.

---

## Smart Contract Architecture

### Design Pattern: Registry Model

Clarity contracts cannot deploy other contracts at runtime (unlike Solidity). StacksForge uses a **registry pattern**:

```
User → token-factory.clar (create-token)
         ↓
  Stores token metadata in on-chain maps
  (name, symbol, decimals, supply, creator, block)
         ↓
  Returns a numeric token-id
```

This means every token is a logical record in the factory's state, not an independent contract. This is idiomatic Clarity and maximizes gas efficiency.

### Contract Hierarchy

```
sip-010-trait.clar        [Trait definition]
    ↑ implements
forge-token.clar           [SIP-010 token contract]
    ↑ references
token-factory.clar         [Registry / fee handler]
```

---

## Frontend Architecture

```
Next.js 14 (App Router)
├── WalletProvider (@stacks/connect → UserSession)
│   ├── showConnect()  — opens Leather/Xverse modal
│   └── userSession    — manages auth state
├── useTokenFactory hook
│   ├── openContractCall() [@stacks/connect]  — write txns
│   └── callReadOnlyFunction() [@stacks/transactions]  — reads
└── Components
    ├── WalletButton.tsx
    ├── TokenForgeForm.tsx
    └── TokenList.tsx
```

### Data Flow

```
User fills form
    → TokenForgeForm validates
    → useTokenFactory.createToken()
    → openContractCall() via @stacks/connect
    → Leather/Xverse signs
    → Transaction broadcast to Stacks mainnet
    → onFinish callback receives txId
    → Success state shown with Explorer link
```

---

## Key Dependencies

| Package | Role |
|---------|------|
| `@stacks/connect` | Wallet auth, `openContractCall` |
| `@stacks/transactions` | `callReadOnlyFunction`, `makeContractCall`, CV types |
| `@stacks/network` | `StacksMainnet` config |
| `next` 14 | Frontend framework |
| `clarinet` | Contract test runner (Deno) |

---

## Security Model

1. **No admin keys on user tokens** — Once a token is registered, no one can change its supply or metadata
2. **Fee enforcement** — `create-token` uses `stx-transfer?` which reverts atomically if funds are insufficient
3. **Ownership guards** — All admin functions use `(asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)`
4. **Non-custodial frontend** — `@stacks/connect` keeps private keys inside the user's wallet extension
