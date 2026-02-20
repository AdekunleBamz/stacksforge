# StacksForge Frontend

A Next.js 14 application for the StacksForge token factory.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Modules
- **State**: React Context (`WalletContext`, `ThemeContext`)
- **Blockchain**: `@stacks/connect`, `@stacks/transactions`
- **Testing**: Vitest, React Testing Library

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/app`: App router pages and layouts
- `src/components`: Reusable UI components
- `src/contexts`: Global state providers
- `src/hooks`: Custom hooks (e.g., `useTokenFactory`)
- `src/lib`: Utility functions and validation logic

## Commands

- `npm run dev`: Start dev server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm test`: Run tests
