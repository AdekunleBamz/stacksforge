import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.1/index.ts';
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

// ============================================================
// StacksForge: forge-token-v-i2.clar tests
// ============================================================

Clarinet.test({
    name: "forge-token-v-i2: initializes with correct metadata",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        const block = chain.mineBlock([
            Tx.contractCall(
                'forge-token-v-i2',
                'initialize',
                [
                    types.ascii("My Stacks Token"),
                    types.ascii("MST"),
                    types.uint(6),
                    types.uint(1_000_000_000),
                    types.principal(wallet1.address),
                ],
                deployer.address
            )
        ]);

        block.receipts[0].result.expectOk().expectBool(true);

        // Check name
        const name = chain.callReadOnlyFn('forge-token-v-i2', 'get-name', [], deployer.address);
        name.result.expectOk().expectAscii("My Stacks Token");

        // Check symbol
        const symbol = chain.callReadOnlyFn('forge-token-v-i2', 'get-symbol', [], deployer.address);
        symbol.result.expectOk().expectAscii("MST");

        // Check decimals
        const decimals = chain.callReadOnlyFn('forge-token-v-i2', 'get-decimals', [], deployer.address);
        decimals.result.expectOk().expectUint(6);

        // Check total supply minted to wallet1
        const supply = chain.callReadOnlyFn('forge-token-v-i2', 'get-total-supply', [], deployer.address);
        supply.result.expectOk().expectUint(1_000_000_000);

        const balance = chain.callReadOnlyFn('forge-token-v-i2', 'get-balance', [types.principal(wallet1.address)], deployer.address);
        balance.result.expectOk().expectUint(1_000_000_000);
    }
});

Clarinet.test({
    name: "forge-token-v-i2: only owner can initialize",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;

        const block = chain.mineBlock([
            Tx.contractCall(
                'forge-token-v-i2',
                'initialize',
                [
                    types.ascii("Evil Token"),
                    types.ascii("EVIL"),
                    types.uint(6),
                    types.uint(1_000_000),
                    types.principal(wallet1.address),
                ],
                wallet1.address // not deployer
            )
        ]);

        block.receipts[0].result.expectErr().expectUint(101); // ERR-NOT-OWNER
    }
});

Clarinet.test({
    name: "forge-token-v-i2: transfer works between accounts",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Initialize first
        chain.mineBlock([
            Tx.contractCall('forge-token-v-i2', 'initialize', [
                types.ascii("Test Token"),
                types.ascii("TEST"),
                types.uint(6),
                types.uint(1_000_000),
                types.principal(wallet1.address),
            ], deployer.address)
        ]);

        // Transfer 100 tokens
        const block = chain.mineBlock([
            Tx.contractCall('forge-token-v-i2', 'transfer', [
                types.uint(100),
                types.principal(wallet1.address),
                types.principal(deployer.address),
                types.none(),
            ], wallet1.address)
        ]);

        block.receipts[0].result.expectOk().expectBool(true);

        const bal1 = chain.callReadOnlyFn('forge-token-v-i2', 'get-balance', [types.principal(deployer.address)], deployer.address);
        bal1.result.expectOk().expectUint(100);

        const bal2 = chain.callReadOnlyFn('forge-token-v-i2', 'get-balance', [types.principal(wallet1.address)], deployer.address);
        bal2.result.expectOk().expectUint(999_900);
    }
});

Clarinet.test({
    name: "forge-token-v-i2: burn reduces supply",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        chain.mineBlock([
            Tx.contractCall('forge-token-v-i2', 'initialize', [
                types.ascii("Burn Token"),
                types.ascii("BURN"),
                types.uint(6),
                types.uint(1_000_000),
                types.principal(wallet1.address),
            ], deployer.address)
        ]);

        const block = chain.mineBlock([
            Tx.contractCall('forge-token-v-i2', 'burn', [
                types.uint(500_000),
                types.principal(wallet1.address),
            ], wallet1.address)
        ]);

        block.receipts[0].result.expectOk().expectBool(true);

        const supply = chain.callReadOnlyFn('forge-token-v-i2', 'get-total-supply', [], deployer.address);
        supply.result.expectOk().expectUint(500_000);
    }
});

Clarinet.test({
    name: "forge-token-v-i2: transfer with zero amount fails",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        chain.mineBlock([
            Tx.contractCall('forge-token-v-i2', 'initialize', [
                types.ascii("Zero Test"),
                types.ascii("ZT"),
                types.uint(6),
                types.uint(1_000_000),
                types.principal(wallet1.address),
            ], deployer.address)
        ]);

        const block = chain.mineBlock([
            Tx.contractCall('forge-token-v-i2', 'transfer', [
                types.uint(0),
                types.principal(wallet1.address),
                types.principal(deployer.address),
                types.none(),
            ], wallet1.address)
        ]);

        block.receipts[0].result.expectErr().expectUint(103); // ERR-INVALID-AMOUNT
    }
});

Clarinet.test({
    name: "forge-token: only owner can mint additional tokens",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        chain.mineBlock([
            Tx.contractCall('forge-token', 'initialize', [
                types.ascii("Mint Test"),
                types.ascii("MT"),
                types.uint(6),
                types.uint(1_000),
                types.principal(wallet1.address),
            ], deployer.address)
        ]);

        // wallet1 tries to mint — should fail
        const block = chain.mineBlock([
            Tx.contractCall('forge-token', 'mint', [
                types.uint(9999),
                types.principal(wallet1.address),
            ], wallet1.address)
        ]);

        block.receipts[0].result.expectErr().expectUint(101);
    }
});
