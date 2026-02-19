/**
 * generate-test-wallets.mjs
 * Generates 25 test wallets for interacting with StacksForge contracts.
 * Saves results to internal/test-wallets.json (gitignored).
 * W1 is the funding wallet — fund it first before running distribute-stx.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import walletPkg from "@stacks/wallet-sdk";
import txPkg from "@stacks/transactions";

const { generateSecretKey, generateWallet } = walletPkg;
const { getAddressFromPrivateKey, TransactionVersion } = txPkg;

const WALLET_COUNT = 25;
const OUT_PATH = "./internal/test-wallets.json";

async function main() {
    console.log(`🔑 Generating ${WALLET_COUNT} test wallets...`);

    if (!existsSync("./internal")) mkdirSync("./internal");

    const wallets = [];

    for (let i = 0; i < WALLET_COUNT; i++) {
        const mnemonic = generateSecretKey(256);   // 24-word BIP39 mnemonic
        const wallet = await generateWallet({ secretKey: mnemonic, password: "" });
        const account = wallet.accounts[0];
        const privateKey = account.stxPrivateKey;
        const address = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);

        wallets.push({
            id: i + 1,
            name: `W${i + 1}`,
            mnemonic,
            address,
            privateKey,
        });

        process.stdout.write(`  ✅ W${i + 1}: ${address}\n`);
    }

    writeFileSync(OUT_PATH, JSON.stringify(wallets, null, 2));

    console.log(`\n📄 Saved to ${OUT_PATH}`);
    console.log(`\n💰 Fund this address with ~26 STX:`);
    console.log(`   W1: ${wallets[0].address}`);
    console.log(`\nThen run:`);
    console.log(`   node scripts/distribute-stx.mjs   — fund W2–W25`);
    console.log(`   node scripts/interact-all.mjs     — run all interactions`);
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
