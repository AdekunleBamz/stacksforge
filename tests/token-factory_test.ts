import { Clarinet } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
    name: "token-factory: create-token",
    async fn(chain, accounts) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;

        // Test basic token creation
        let block = chain.mineBlock([
            Clarinet.callPublic("token-factory-v-i2", "create-token", [
                "Test Token",
                "TEST",
                6,
                1000000000
            ], wallet_1.address)
        ]);

        block.receipts[0].result.expectOk();
    },
});
