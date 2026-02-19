/**
 * interact-all.mjs
 * Runs 3 interactions per wallet, sequentially, against StacksForge contracts:
 *   1. create-token  → token-factory   (0.002 STX fee + 0.001 STX gas)
 *   2. transfer      → forge-token     (0.001 STX gas — sends tokens to next wallet)
 *   3. burn          → forge-token     (0.001 STX gas — burns a portion)
 *
 * Total: 25 wallets × 3 txs = 75 interaction txs
 * Total cost: ~0.125 STX (plus 0.024 distribution) = ~0.149 STX of 2 STX budget
 * A 5-second delay is applied between EVERY transaction to avoid rate limiting.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import txPkg from "@stacks/transactions";
import networkPkg from "@stacks/network";

const {
    makeContractCall,
    broadcastTransaction,
    stringAsciiCV,
    uintCV,
    principalCV,
    PostConditionMode,
    FungibleConditionCode,
    makeStandardSTXPostCondition,
    transferSTX,
} = txPkg;
const { StacksMainnet } = networkPkg;

// ── Config ──────────────────────────────────────────────────────────────────
const WALLETS_PATH = "./internal/test-wallets.json";
const RESULTS_PATH = "./internal/interact-results.json";
const NETWORK = new StacksMainnet();
const GAS_FEE = 1_000n;        // 0.001 STX
const CREATION_FEE_USTX = 2_000n;        // 0.002 STX (must match contract)
const DELAY_MS = 5_000;         // 5 seconds between every transaction

// Deployed contracts
const FACTORY_ADDRESS = "SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT";
const FACTORY_CONTRACT = "token-factory";
const TOKEN_CONTRACT = "forge-token";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchNonce(address) {
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
    const json = await res.json();
    return BigInt(json.nonce ?? 0);
}

async function fetchBalance(address) {
    try {
        const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/stx`);
        const json = await res.json();
        return (parseInt(json.balance ?? 0) / 1_000_000).toFixed(4);
    } catch { return "?"; }
}

// Token params unique to each wallet
function tokenParams(wallet) {
    return {
        name: `SForge Token ${wallet.id}`,
        symbol: `SFT${wallet.id}`,
        decimals: 6n,
        supply: BigInt(1_000_000 * wallet.id),
    };
}

async function broadcastAndLog(tx, label) {
    const result = await broadcastTransaction(tx, NETWORK);
    if (result.error) {
        console.log(`    ❌ ${label}: ${result.error} — ${result.reason ?? ""}`);
        return { ok: false, error: result.error };
    }
    const txid = typeof result === "string" ? result : result.txid;
    console.log(`    ✅ ${label}: ${txid.slice(0, 20)}...`);
    console.log(`       🔗 https://explorer.hiro.so/txid/${txid}?chain=mainnet`);
    return { ok: true, txid };
}

async function main() {
    const wallets = JSON.parse(readFileSync(WALLETS_PATH, "utf-8"));

    console.log("🔥 StacksForge — Full Contract Interactions");
    console.log("════════════════════════════════════════════");
    console.log(`👛 Wallets:       ${wallets.length}`);
    console.log(`📄 Factory:       ${FACTORY_ADDRESS}.${FACTORY_CONTRACT}`);
    console.log(`🪙 Token:         ${FACTORY_ADDRESS}.${TOKEN_CONTRACT}`);
    console.log(`📊 Txs planned:   ${wallets.length * 3} (3 per wallet)`);
    console.log(`💸 Cost estimate: ~${(Number(CREATION_FEE_USTX + GAS_FEE * 3n) * wallets.length / 1_000_000).toFixed(4)} STX`);
    console.log(`⏱  Delay:         ${DELAY_MS / 1000}s between every tx\n`);

    const allResults = [];

    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        // Transfer target = next wallet (wraps around to first)
        const nextWallet = wallets[(i + 1) % wallets.length];
        const params = tokenParams(wallet);
        const balance = await fetchBalance(wallet.address);

        console.log(`═══ ${wallet.name} (${wallet.address}) | balance: ${balance} STX ═══`);

        const walletResult = { wallet: wallet.name, address: wallet.address, txs: [] };
        let nonce = await fetchNonce(wallet.address);

        // ── Tx 1: create-token ───────────────────────────────────────────────
        console.log(`  [1/3] create-token "${params.name}" (${params.symbol})`);
        try {
            const tx = await makeContractCall({
                contractAddress: FACTORY_ADDRESS,
                contractName: FACTORY_CONTRACT,
                functionName: "create-token",
                functionArgs: [
                    stringAsciiCV(params.name),
                    stringAsciiCV(params.symbol),
                    uintCV(params.decimals),
                    uintCV(params.supply),
                ],
                senderKey: wallet.privateKey,
                network: NETWORK,
                fee: GAS_FEE,
                nonce,
                postConditionMode: PostConditionMode.Allow,
                postConditions: [
                    makeStandardSTXPostCondition(
                        wallet.address,
                        FungibleConditionCode.LessEqual,
                        CREATION_FEE_USTX
                    ),
                ],
            });
            const r = await broadcastAndLog(tx, "create-token");
            walletResult.txs.push({ action: "create-token", ...r });
            if (r.ok) nonce++;
        } catch (e) {
            console.log(`    ❌ create-token exception: ${e.message}`);
            walletResult.txs.push({ action: "create-token", ok: false, error: e.message });
        }

        console.log(`  ⏳ Waiting ${DELAY_MS / 1000}s...`);
        await sleep(DELAY_MS);

        // ── Tx 2: transfer tokens → next wallet ──────────────────────────────
        const transferAmount = params.supply / 10n;  // Send 10% of created supply
        console.log(`  [2/3] transfer ${transferAmount} micro-${params.symbol} → ${nextWallet.name}`);
        try {
            const tx = await makeContractCall({
                contractAddress: FACTORY_ADDRESS,
                contractName: TOKEN_CONTRACT,
                functionName: "transfer",
                functionArgs: [
                    uintCV(transferAmount),
                    principalCV(wallet.address),
                    principalCV(nextWallet.address),
                    // memo = none (optional buff)
                    { type: 0x09 },   // none
                ],
                senderKey: wallet.privateKey,
                network: NETWORK,
                fee: GAS_FEE,
                nonce,
                postConditionMode: PostConditionMode.Allow,
            });
            const r = await broadcastAndLog(tx, "transfer");
            walletResult.txs.push({ action: "transfer", ...r });
            if (r.ok) nonce++;
        } catch (e) {
            console.log(`    ❌ transfer exception: ${e.message}`);
            walletResult.txs.push({ action: "transfer", ok: false, error: e.message });
        }

        console.log(`  ⏳ Waiting ${DELAY_MS / 1000}s...`);
        await sleep(DELAY_MS);

        // ── Tx 3: burn tokens ────────────────────────────────────────────────
        const burnAmount = params.supply / 5n;   // Burn 20% of created supply
        console.log(`  [3/3] burn ${burnAmount} micro-${params.symbol}`);
        try {
            const tx = await makeContractCall({
                contractAddress: FACTORY_ADDRESS,
                contractName: TOKEN_CONTRACT,
                functionName: "burn",
                functionArgs: [
                    uintCV(burnAmount),
                    principalCV(wallet.address),
                ],
                senderKey: wallet.privateKey,
                network: NETWORK,
                fee: GAS_FEE,
                nonce,
                postConditionMode: PostConditionMode.Allow,
            });
            const r = await broadcastAndLog(tx, "burn");
            walletResult.txs.push({ action: "burn", ...r });
            if (r.ok) nonce++;
        } catch (e) {
            console.log(`    ❌ burn exception: ${e.message}`);
            walletResult.txs.push({ action: "burn", ok: false, error: e.message });
        }

        allResults.push(walletResult);
        console.log();

        // 5s delay before next wallet (skip after last)
        if (i < wallets.length - 1) {
            console.log(`  ⏳ Moving to ${wallets[i + 1].name} in ${DELAY_MS / 1000}s...\n`);
            await sleep(DELAY_MS);
        }
    }

    // Save results
    writeFileSync(RESULTS_PATH, JSON.stringify(allResults, null, 2));

    // Summary
    console.log("════════════════════════════════════════════");
    console.log("  FINAL SUMMARY");
    console.log("════════════════════════════════════════════");
    let totalOk = 0, totalFail = 0;
    for (const w of allResults) {
        const ok = w.txs.filter((t) => t.ok).length;
        const fail = w.txs.length - ok;
        totalOk += ok;
        totalFail += fail;
        const icons = w.txs.map((t) => t.ok ? "✅" : "❌").join(" ");
        console.log(`  ${w.wallet}: ${icons}`);
    }
    console.log(`\n  ✅ Successful txs: ${totalOk} / ${totalOk + totalFail}`);
    console.log(`  ❌ Failed txs:     ${totalFail}`);
    console.log(`\n📄 Results saved to ${RESULTS_PATH}`);
    console.log("════════════════════════════════════════════");
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
