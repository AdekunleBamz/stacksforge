# 🔥 StacksForge

> Deploy SIP-010 fungible tokens on Stacks mainnet in seconds. No coding required.

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](./LICENSE)
[![Stacks](https://img.shields.io/badge/Network-Stacks%20Mainnet-5546FF)](https://stacks.co)
[![SIP-010](https://img.shields.io/badge/Standard-SIP--010-orange)](https://github.com/stacksgov/sips)
[![@stacks/connect](https://img.shields.io/badge/%40stacks%2Fconnect-v7-brightgreen)](https://github.com/hirosystems/connect)
[![@stacks/transactions](https://img.shields.io/badge/%40stacks%2Ftransactions-v6-blue)](https://github.com/hirosystems/stacks.js)

---

## ✨ Features

- ⚡ **Instant Deployment** — Create a SIP-010 token in seconds
- 💰 **Low Cost** — Only 1 STX creation fee
- 🎨 **Beautiful UI** — Dark, forge-themed interface with glassmorphism
- 🔗 **100% On-chain** — All token data stored in Clarity contracts
- 🔒 **Non-custodial** — Your wallet, your keys, your tokens
- 🌐 **Stacks Native** — Uses `@stacks/connect` and `@stacks/transactions`

---


## 🏗️ Architecture

```mermaid
graph TD
    User[User Wallet] -->|SIP-010 Transaction| Frontend[Next.js App]
    Frontend -->|@stacks/connect| Wallet[Leather / Xverse]
    Wallet -->|Sign & Broadcast| Stacks[Stacks Blockchain]
    Stacks -->|Execute| Contracts[Clarity Contracts]
    Contracts -->|Store State| ChainState[On-chain State]
    Frontend -->|Read State| API[Stacks API]
    API -->|Query| ChainState
```

## 🏗️ Project Structure


```
stacksforge/
├── contracts/
│   ├── traits/
│   │   └── sip-010-trait.clar      # SIP-010 standard trait
│   ├── forge-token.clar            # SIP-010 fungible token contract
│   └── token-factory.clar         # Factory / registry contract
├── tests/
│   ├── forge-token.test.ts        # Clarinet unit tests
│   └── token-factory.test.ts
├── scripts/
│   ├── deploy.ts                  # Mainnet deployment (@stacks/transactions)
│   ├── verify-deployment.ts       # On-chain verification
│   ├── interact.ts                # Example interaction
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js 14 App Router
│   │   ├── components/
│   │   │   ├── WalletButton.tsx   # @stacks/connect wallet UI
│   │   │   ├── TokenForgeForm.tsx # Token creation form
│   │   │   └── TokenList.tsx      # On-chain token browser
│   │   ├── contexts/
│   │   │   └── WalletContext.tsx  # @stacks/connect UserSession
│   │   └── hooks/
│   │       └── useTokenFactory.ts # @stacks/transactions read calls
│   └── package.json
├── Clarinet.toml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Clarinet](https://github.com/hirosystems/clarinet) (for contract development)
- A Stacks wallet: [Leather](https://leather.io) or [Xverse](https://www.xverse.app)
- STX for deployment fees

### 1. Clone the repo

```bash
git clone https://github.com/AdekunleBamz/stacksforge.git
cd stacksforge
```

### 2. Run Clarinet tests

```bash
clarinet test
```

### 3. Deploy contracts to Stacks mainnet

```bash
cd scripts
npm install
cp .env.example .env
# Edit .env with your DEPLOYER_PRIVATE_KEY
npm run deploy
```

### 4. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your NEXT_PUBLIC_FACTORY_ADDRESS
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).


---

## 🔧 Troubleshooting

### Common Issues

**1. Wallet connection fails**
- Ensure you have the [Leather](https://leather.io) or [Xverse](https://www.xverse.app) browser extension installed.
- Check if you are on the correct network (Mainnet vs Testnet).

**2. Transaction pending for too long**
- The network might be congested. You can increase the fee in your wallet when signing.
- Check the [Stacks Explorer](https://explorer.hiro.so) for network status.

**3. "Contract not found" error**
- Verify the `NEXT_PUBLIC_FACTORY_ADDRESS` in your `.env.local` matches the deployed contract address.

---


## 📡 Stacks Libraries

StacksForge uses the official Stacks JavaScript libraries:

| Library | Usage |
|---------|-------|
| [`@stacks/connect`](https://github.com/hirosystems/connect) | Wallet authentication (`showConnect`, `openContractCall`) |
| [`@stacks/transactions`](https://github.com/hirosystems/stacks.js/tree/main/packages/transactions) | Read-only calls (`callReadOnlyFunction`, `makeContractCall`) |
| [`@stacks/network`](https://github.com/hirosystems/stacks.js/tree/main/packages/network) | Network configuration (`StacksMainnet`) |

### Example: Connecting a Wallet

```typescript
import { showConnect, AppConfig, UserSession } from '@stacks/connect';

const appConfig  = new AppConfig(['store_write']);
const userSession = new UserSession({ appConfig });

showConnect({
  appDetails: { name: 'StacksForge', icon: '/icon.png' },
  redirectTo: '/',
  onFinish: () => {
    const userData = userSession.loadUserData();
    console.log(userData.profile.stxAddress.mainnet);
  },
  userSession,
});
```

### Example: Creating a Token

```typescript
import { openContractCall } from '@stacks/connect';
import { stringAsciiCV, uintCV } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

await openContractCall({
  contractAddress: 'SP2...',
  contractName:    'token-factory',
  functionName:    'create-token',
  functionArgs: [
    stringAsciiCV('My Token'),
    stringAsciiCV('MYT'),
    uintCV(6),
    uintCV(1_000_000_000_000n),
  ],
  network: new StacksMainnet(),
  appDetails: { name: 'StacksForge', icon: '/icon.png' },
  onFinish: ({ txId }) => console.log('TXID:', txId),
});
```

### Example: Reading Token Count

```typescript
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

const result = await callReadOnlyFunction({
  contractAddress: 'SP2...',
  contractName:    'token-factory',
  functionName:    'get-token-count',
  functionArgs:    [],
  network:         new StacksMainnet(),
  senderAddress:   'SP2...',
});

console.log(cvToJSON(result).value); // e.g. "42"
```

---

## 🔑 Environment Variables

### Scripts (`scripts/.env`)

```env
DEPLOYER_PRIVATE_KEY=your_private_key_here
```


### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_FACTORY_ADDRESS` | The contract address of the deployed Token Factory | `SP2...` |
| `NEXT_PUBLIC_STACKS_NETWORK` | The network to connect to (mainnet/testnet) | `mainnet` |
| `NEXT_PUBLIC_APP_URL` | The canonical URL of your application | `https://stacksforge.xyz` |

```env
NEXT_PUBLIC_FACTORY_ADDRESS=SP2xxx.token-factory
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_APP_URL=https://stacksforge.xyz
```


---

## 🧪 Smart Contracts

### `token-factory.clar`

The main registry contract. Call `create-token` to register a new SIP-010 token.

| Function | Type | Description |
|----------|------|-------------|
| `create-token` | public | Register a new token (costs creation-fee STX) |
| `get-token-by-id` | read-only | Fetch token metadata by ID |
| `get-tokens-by-creator` | read-only | List all tokens for a principal |
| `get-token-count` | read-only | Total tokens registered |
| `set-creation-fee` | public (owner) | Update the fee |
| `set-fee-recipient` | public (owner) | Update fee recipient |
| `transfer-ownership` | public (owner) | Transfer contract ownership |

### `forge-token.clar`

SIP-010 compliant fungible token with mint, burn, and transfer capabilities.

---

## 🔐 Security

- Clarity contracts use explicit `asserts!` guards for all state mutations
- No admin backdoors on user-created tokens
- Creation fee is immutably enforced on-chain
- Frontend uses `@stacks/connect` — private keys never leave the user's wallet

See [SECURITY.md](./SECURITY.md) for responsible disclosure policy.

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 📄 License

MIT License — see [LICENSE](./LICENSE).

Built with 🔥 on Stacks.
