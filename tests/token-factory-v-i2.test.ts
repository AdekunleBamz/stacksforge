import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.1/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

// ============================================================
// StacksForge: token-factory-v-i2.clar tests
// ============================================================

Clarinet.test({
    name: "token-factory-v-i2: create-token registers a token correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // wallet1 creates a token, pays 1 STX fee
        const block = chain.mineBlock([
            Tx.contractCall(
                'token-factory-v-i2',
                'create-token',
                [
                    types.ascii("Galaxy Coin"),
                    types.ascii("GLXY"),
                    types.uint(6),
                    types.uint(1_000_000_000_000),
                ],
                wallet1.address
            )
        ]);

        block.receipts[0].result.expectOk().expectUint(0); // first token id = 0

        // Check token count  
        const count = chain.callReadOnlyFn('token-factory-v-i2', 'get-token-count', [], deployer.address);
        count.result.expectOk().expectUint(1);

        // Fetch token by id
        const token = chain.callReadOnlyFn('token-factory-v-i2', 'get-token-by-id', [types.uint(0)], deployer.address);
        const tokenData = token.result.expectOk().expectTuple();
        assertEquals(tokenData['name'], types.ascii("Galaxy Coin"));
        assertEquals(tokenData['symbol'], types.ascii("GLXY"));

        // Check by creator
        const byCreator = chain.callReadOnlyFn('token-factory-v-i2', 'get-tokens-by-creator', [types.principal(wallet1.address)], deployer.address);
        const list = byCreator.result.expectOk().expectList();
        assertEquals(list.length, 1);
    }
});

Clarinet.test({
    name: "token-factory-v-i2: insufficient fee is rejected",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;
        const deployer = accounts.get('deployer')!;

        // First raise the fee so wallet1 can't pay it with default balance trick
        chain.mineBlock([
            Tx.contractCall('token-factory-v-i2', 'set-creation-fee', [types.uint(999_999_999_999)], deployer.address)
        ]);

        // wallet1 tries to create a token — will fail because wallet doesn't have 999999 STX
        const block = chain.mineBlock([
            Tx.contractCall('token-factory-v-i2', 'create-token', [
                types.ascii("Broke Token"),
                types.ascii("BRK"),
                types.uint(6),
                types.uint(1_000),
            ], wallet1.address)
        ]);

        // Should fail with transfer error (insufficient STX)
        block.receipts[0].result.expectErr();
    }
});

Clarinet.test({
    name: "token-factory-v-i2: multiple tokens track correctly per creator",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Create 3 tokens
        chain.mineBlock([
            Tx.contractCall('token-factory-v-i2', 'create-token', [
                types.ascii("Alpha"), types.ascii("ALPH"), types.uint(6), types.uint(1_000)
            ], wallet1.address),
            Tx.contractCall('token-factory-v-i2', 'create-token', [
                types.ascii("Beta"), types.ascii("BETA"), types.uint(6), types.uint(2_000)
            ], wallet1.address),
            Tx.contractCall('token-factory-v-i2', 'create-token', [
                types.ascii("Gamma"), types.ascii("GAMM"), types.uint(6), types.uint(3_000)
            ], wallet1.address),
        ]);

        const count = chain.callReadOnlyFn('token-factory-v-i2', 'get-token-count', [], deployer.address);
        count.result.expectOk().expectUint(3);

        const byCreator = chain.callReadOnlyFn('token-factory-v-i2', 'get-tokens-by-creator', [types.principal(wallet1.address)], deployer.address);
        const list = byCreator.result.expectOk().expectList();
        assertEquals(list.length, 3);

        const creatorCount = chain.callReadOnlyFn('token-factory-v-i2', 'get-token-count-by-creator', [types.principal(wallet1.address)], deployer.address);
        creatorCount.result.expectOk().expectUint(3);
    }
});

Clarinet.test({
    name: "token-factory-v-i2: set-creation-fee only callable by owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;

        const block = chain.mineBlock([
            Tx.contractCall('token-factory-v-i2', 'set-creation-fee', [
                types.uint(9_000_000)
            ], wallet1.address)
        ]);

        block.receipts[0].result.expectErr().expectUint(201); // ERR-NOT-OWNER
    }
});

Clarinet.test({
    name: "token-factory-v-i2: set-fee-recipient only callable by owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Owner updates fee recipient
        const block1 = chain.mineBlock([
            Tx.contractCall('token-factory-v-i2', 'set-fee-recipient', [
                types.principal(wallet1.address)
            ], deployer.address)
        ]);
        block1.receipts[0].result.expectOk().expectBool(true);

        // Non-owner attempts
        const block2 = chain.mineBlock([
            Tx.contractCall('token-factory-v-i2', 'set-fee-recipient', [
                types.principal(deployer.address)
            ], wallet1.address)
        ]);
        block2.receipts[0].result.expectErr().expectUint(201);
    }
});

Clarinet.test({
    name: "token-factory-v-i2: transfer-ownership works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        const block = chain.mineBlock([
            Tx.contractCall('token-factory-v-i2', 'transfer-ownership', [
                types.principal(wallet1.address)
            ], deployer.address)
        ]);

        block.receipts[0].result.expectOk().expectBool(true);

        const owner = chain.callReadOnlyFn('token-factory-v-i2', 'get-owner', [], deployer.address);
        owner.result.expectOk().expectPrincipal(wallet1.address);
    }
});

Clarinet.test({
    name: "token-factory-v-i2: invalid name is rejected",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet1 = accounts.get('wallet_1')!;

        const block = chain.mineBlock([
            Tx.contractCall('token-factory-v-i2', 'create-token', [
                types.ascii(""),  // empty name
                types.ascii("SYM"),
                types.uint(6),
                types.uint(1_000),
            ], wallet1.address)
        ]);

        // Clarinet won't allow passing empty string-ascii, this tests the guard
        // The tx will be aborted at the Clarity level — expect runtime abort
        // or ERR-INVALID-NAME
        block.receipts[0].result.expectErr();
    }
});

Clarinet.test({
    name: "token-factory-v-i2: get-contract-info returns correct state",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        const info = chain.callReadOnlyFn('token-factory-v-i2', 'get-contract-info', [], deployer.address);
        const data = info.result.expectOk().expectTuple();
        assertEquals(data['token-count'], types.uint(0));
        assertEquals(data['creation-fee'], types.uint(1_000_000));
        assertEquals(data['version'], types.ascii("1.0.0"));
    }
});
