/**
 * distribute-stx.mjs
 * Reads W1 from internal/test-wallets.json and sends 1.002 STX to each of W2–W25.
 * W1 must already be funded with ~26 STX before running this.
 * Gas fee: 0.001 STX (1000 microSTX) per transfer.
 * Delay: 5 seconds between each transfer to avoid rate limiting.
 */
import { readFileSync } from "fs";
import txPkg from "@stacks/transactions";
import networkPkg from "@stacks/network";

const {
    makeSTXTokenTransfer,
    broadcastTransaction,
    getAddressFromPrivateKey,
    TransactionVersion,
} = txPkg;
const { StacksMainnet } = networkPkg;

const WALLETS_PATH = "./internal/test-wallets.json";
const NETWORK = new StacksMainnet();
const GAS_FEE = 1000;           // 0.001 STX in microSTX
const AMOUNT_EACH = 1_001_000;      // 1.001 STX in microSTX (covers 1 STX creation fee + 0.001 STX gas)
const DELAY_MS = 5_000;          // 5 seconds between transactions

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchNonce(address) {
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
    const data = await res.json();
    return data.nonce;
}

async function fetchBalance(address) {
    const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/stx`);
    const data = await res.json();
    return (parseInt(data.balance) / 1_000_000).toFixed(6);
}

async function main() {
    const wallets = JSON.parse(readFileSync(WALLETS_PATH, "utf-8"));
    const w1 = wallets[0];
    const targets = wallets.slice(1);   // W2–W25

    console.log("💸 StacksForge — STX Distribution");
    console.log("════════════════════════════════════");
    console.log(`🔑 Funder (W1):  ${w1.address}`);
    console.log(`📤 Sending to:   W2–W${wallets.length} (${targets.length} wallets)`);
    console.log(`💰 Amount each:  ${AMOUNT_EACH / 1_000_000} STX`);
    console.log(`⛽ Gas each:     ${GAS_FEE / 1_000_000} STX`);
    console.log(`⏱  Delay:        ${DELAY_MS / 1000}s between txs`);
    console.log(
        `📊 Total outflow: ~${((AMOUNT_EACH + GAS_FEE) * targets.length / 1_000_000).toFixed(3)} STX`
    );
    console.log();

    const balance = await fetchBalance(w1.address);
    console.log(`💰 W1 balance: ${balance} STX\n`);

    const results = [];
    let nonce = await fetchNonce(w1.address);
    console.log(`🔢 Starting nonce: ${nonce}\n`);

    for (const wallet of targets) {
        console.log(`─── Sending to ${wallet.name} (${wallet.address}) ───`);

        try {
            const tx = await makeSTXTokenTransfer({
                recipient: wallet.address,
                amount: BigInt(AMOUNT_EACH),
                senderKey: w1.privateKey,
                network: NETWORK,
                fee: BigInt(GAS_FEE),
                nonce: BigInt(nonce),
                memo: `StacksForge test fund ${wallet.name}`,
            });

            const result = await broadcastTransaction(tx, NETWORK);

            if (result.error) {
                console.log(`  ❌ Error: ${result.error} — ${result.reason}`);
                results.push({ wallet: wallet.name, status: "FAILED", error: result.error });
            } else {
                const txid = typeof result === "string" ? result : result.txid;
                console.log(`  ✅ txid: ${txid}`);
                console.log(`  🔗 https://explorer.hiro.so/txid/${txid}?chain=mainnet`);
                results.push({ wallet: wallet.name, address: wallet.address, status: "OK", txid });
                nonce++;
            }
        } catch (err) {
            console.log(`  ❌ Exception: ${err.message}`);
            results.push({ wallet: wallet.name, status: "ERROR", error: err.message });
        }

        console.log();
        if (wallet !== targets[targets.length - 1]) {
            console.log(`  ⏳ Waiting ${DELAY_MS / 1000}s...`);
            await sleep(DELAY_MS);
        }
    }

    // Summary
    console.log("════════════════════════════════════");
    console.log("  DISTRIBUTION SUMMARY");
    console.log("════════════════════════════════════");
    const ok = results.filter((r) => r.status === "OK").length;
    const fail = results.filter((r) => r.status !== "OK").length;
    console.log(`  ✅ Successful: ${ok}`);
    console.log(`  ❌ Failed:     ${fail}`);
    results.forEach((r) => {
        const icon = r.status === "OK" ? "✅" : "❌";
        console.log(`  ${icon} ${r.wallet}: ${r.status}`);
    });
    console.log("════════════════════════════════════");

    if (ok === targets.length) {
        console.log(`\n🎉 All wallets funded! Now run:`);
        console.log(`   node scripts/interact-all.mjs`);
    }
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
