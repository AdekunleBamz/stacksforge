# Contributing to StacksForge

Thank you for your interest in contributing! StacksForge is an open-source SIP-010 token factory on Stacks.

## Development Setup

```bash
git clone https://github.com/AdekunleBamz/stacksforge.git
cd stacksforge

# Install Clarinet for contract development
brew install clarinet

# Run tests
clarinet test

# Start frontend
cd frontend && npm install && npm run dev
```

## How to Contribute

1. **Fork** the repo
3. **Create** a feature branch:
   - `feat/feature-name` for new features
   - `fix/bug-fix` for bug fixes
   - `docs/documentation` for documentation changes
   - `chore/maintenance` for maintenance tasks
3. **Write tests** for any new Clarity code
4. **Run** `clarinet test` to ensure all tests pass
5. **Submit** a pull request

## Code Style

- Clarity contracts: follow the naming conventions used in existing contracts (kebab-case)
- TypeScript: use the ESLint config provided
- Commits: use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Reporting Issues

Open a GitHub Issue with as much detail as possible.
