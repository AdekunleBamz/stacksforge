/**
 * interact-all.mjs
 * Runs 3 interactions per wallet against StacksForge contracts:
 *   1. create-token  → token-factory   (0.002 STX fee + 0.001 STX gas)
 *   2. transfer      → forge-token     (0.001 STX gas)
 *   3. burn          → forge-token     (0.001 STX gas)
 *
 * ✅ / ❌ are only shown AFTER the transaction confirms on-chain.
 * Polls Hiro API every 15s — marks ✅ on "success", ❌ on abort/failed.
 * A 5-second extra delay is added after confirmation before the next tx.
 */
import { readFileSync, writeFileSync } from "fs";
import txPkg from "@stacks/transactions";
import networkPkg from "@stacks/network";

const {
    makeContractCall,
    broadcastTransaction,
    stringAsciiCV,
    uintCV,
    noneCV,
    standardPrincipalCV,
    PostConditionMode,
    FungibleConditionCode,
    makeStandardSTXPostCondition,
} = txPkg;
const { StacksMainnet } = networkPkg;

// ── Config ──────────────────────────────────────────────────────────────────
const WALLETS_PATH      = "./internal/test-wallets.json";
const RESULTS_PATH      = "./internal/interact-results.json";
const NETWORK           = new StacksMainnet();
const GAS_FEE           = 1_000n;        // 0.001 STX
const CREATION_FEE_USTX = 2_000n;        // 0.002 STX
const POLL_INTERVAL_MS  = 15_000;        // poll every 15 seconds
const POLL_TIMEOUT_MS   = 300_000;       // give up after 5 minutes
const POST_CONFIRM_DELAY= 5_000;         // 5s after confirmation before next tx

// Deployed contracts
const FACTORY_ADDRESS  = "SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT";
const FACTORY_CONTRACT = "token-factory";
const TOKEN_CONTRACT   = "forge-token";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchNonce(address) {
    const res  = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
    const json = await res.json();
    return BigInt(json.nonce ?? 0);
}

async function fetchBalance(address) {
    try {
        const res  = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/stx`);
        const json = await res.json();
        return (parseInt(json.balance ?? 0) / 1_000_000).toFixed(4);
    } catch { return "?"; }
}

/**
 * Poll until tx_status is no longer "pending".
 * Returns { confirmed: true, success: true } on success
 * Returns { confirmed: true, success: false, reason } on failure
 * Returns { confirmed: false } on timeout
 */
async function waitForConfirmation(txid) {
    const url     = `https://api.mainnet.hiro.so/extended/v1/tx/${txid}`;
    const started = Date.now();

    process.stdout.write(`    ⏳ Confirming`);

    while (Date.now() - started < POLL_TIMEOUT_MS) {
        await sleep(POLL_INTERVAL_MS);
        process.stdout.write(".");

        try {
            const res  = await fetch(url);
            const json = await res.json();
            const status = json.tx_status;

            if (status === "success") {
                process.stdout.write(" ✅\n");
                return { confirmed: true, success: true };
            }
            if (status && status !== "pending") {
                // abort_by_response, abort_by_post_condition, dropped, etc.
                process.stdout.write(` ❌\n`);
                const reason = json.tx_result?.repr ?? status;
                return { confirmed: true, success: false, reason };
            }
            // still pending — keep polling
        } catch {
            // network blip — retry
        }
    }

    process.stdout.write(" ⚠️ timeout\n");
    return { confirmed: false };
}

async function broadcastAndConfirm(tx, label) {
    const result = await broadcastTransaction(tx, NETWORK);

    if (result.error) {
        console.log(`    ❌ ${label}: rejected — ${result.error} (${result.reason ?? ""})`);
        return { ok: false, error: result.error };
    }

    const txid = typeof result === "string" ? result : result.txid;
    console.log(`    📡 ${label}: broadcast txid: ${txid.slice(0, 20)}...`);
    console.log(`       🔗 https://explorer.hiro.so/txid/${txid}?chain=mainnet`);

    const status = await waitForConfirmation(txid);

    if (!status.confirmed) {
        console.log(`    ⚠️  ${label}: timeout — tx may still confirm later`);
        return { ok: false, txid, error: "confirmation timeout" };
    }
    if (!status.success) {
        console.log(`    ❌ ${label}: on-chain FAILED — ${status.reason}`);
        return { ok: false, txid, error: status.reason };
    }

    console.log(`    ✅ ${label}: CONFIRMED on-chain`);
    return { ok: true, txid };
}

// Token params unique per wallet
function tokenParams(w) {
    return {
        name:     `SForge Token ${w.id}`,
        symbol:   `SFT${w.id}`,
        decimals: 6n,
        supply:   BigInt(1_000_000 * w.id),
    };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const wallets = JSON.parse(readFileSync(WALLETS_PATH, "utf-8"));

    console.log("🔥 StacksForge — Full Contract Interactions");
    console.log("════════════════════════════════════════════");
    console.log(`👛 Wallets:       ${wallets.length}`);
    console.log(`📄 Factory:       ${FACTORY_ADDRESS}.${FACTORY_CONTRACT}`);
    console.log(`🪙 Token:         ${FACTORY_ADDRESS}.${TOKEN_CONTRACT}`);
    console.log(`📊 Txs planned:   ${wallets.length * 3} (create-token, transfer, burn per wallet)`);
    console.log(`⏱  Poll interval: ${POLL_INTERVAL_MS / 1000}s | Post-confirm delay: ${POST_CONFIRM_DELAY / 1000}s`);
    console.log(`ℹ️  ✅/❌ are shown only AFTER on-chain confirmation\n`);

    const allResults = [];

    for (let i = 0; i < wallets.length; i++) {
        const wallet     = wallets[i];
        const nextWallet = wallets[(i + 1) % wallets.length];
        const params     = tokenParams(wallet);
        const balance    = await fetchBalance(wallet.address);

        console.log(`═══ ${wallet.name} | ${wallet.address} | balance: ${balance} STX ═══`);

        const walletResult = { wallet: wallet.name, address: wallet.address, txs: [] };
        let nonce = await fetchNonce(wallet.address);

        // ── Tx 1: create-token ────────────────────────────────────────────────
        console.log(`  [1/3] create-token "${params.name}" (${params.symbol})`);
        try {
            const tx = await makeContractCall({
                contractAddress: FACTORY_ADDRESS,
                contractName:    FACTORY_CONTRACT,
                functionName:    "create-token",
                functionArgs: [
                    stringAsciiCV(params.name),
                    stringAsciiCV(params.symbol),
                    uintCV(params.decimals),
                    uintCV(params.supply),
                ],
                senderKey:         wallet.privateKey,
                network:           NETWORK,
                fee:               GAS_FEE,
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
            const r = await broadcastAndConfirm(tx, "create-token");
            walletResult.txs.push({ action: "create-token", ...r });
            if (r.ok) nonce++;
        } catch (e) {
            console.log(`    ❌ create-token error: ${e.message}`);
            walletResult.txs.push({ action: "create-token", ok: false, error: e.message });
        }

        await sleep(POST_CONFIRM_DELAY);

        // ── Tx 2: transfer tokens → next wallet ───────────────────────────────
        const transferAmt = params.supply / 10n;
        console.log(`  [2/3] transfer ${transferAmt} → ${nextWallet.name} (${nextWallet.address})`);
        try {
            const tx = await makeContractCall({
                contractAddress: FACTORY_ADDRESS,
                contractName:    TOKEN_CONTRACT,
                functionName:    "transfer",
                functionArgs: [
                    uintCV(transferAmt),
                    standardPrincipalCV(wallet.address),
                    standardPrincipalCV(nextWallet.address),
                    noneCV(),
                ],
                senderKey:         wallet.privateKey,
                network:           NETWORK,
                fee:               GAS_FEE,
                nonce,
                postConditionMode: PostConditionMode.Allow,
            });
            const r = await broadcastAndConfirm(tx, "transfer");
            walletResult.txs.push({ action: "transfer", ...r });
            if (r.ok) nonce++;
        } catch (e) {
            console.log(`    ❌ transfer error: ${e.message}`);
            walletResult.txs.push({ action: "transfer", ok: false, error: e.message });
        }

        await sleep(POST_CONFIRM_DELAY);

        // ── Tx 3: burn tokens ─────────────────────────────────────────────────
        const burnAmt = params.supply / 5n;
        console.log(`  [3/3] burn ${burnAmt} tokens`);
        try {
            const tx = await makeContractCall({
                contractAddress: FACTORY_ADDRESS,
                contractName:    TOKEN_CONTRACT,
                functionName:    "burn",
                functionArgs: [
                    uintCV(burnAmt),
                    standardPrincipalCV(wallet.address),
                ],
                senderKey:         wallet.privateKey,
                network:           NETWORK,
                fee:               GAS_FEE,
                nonce,
                postConditionMode: PostConditionMode.Allow,
            });
            const r = await broadcastAndConfirm(tx, "burn");
            walletResult.txs.push({ action: "burn", ...r });
            if (r.ok) nonce++;
        } catch (e) {
            console.log(`    ❌ burn error: ${e.message}`);
            walletResult.txs.push({ action: "burn", ok: false, error: e.message });
        }

        allResults.push(walletResult);
        console.log();

        if (i < wallets.length - 1) {
            console.log(`  ⏳ Moving to ${wallets[i + 1].name} in ${POST_CONFIRM_DELAY / 1000}s...\n`);
            await sleep(POST_CONFIRM_DELAY);
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
        const ok   = w.txs.filter((t) => t.ok).length;
        totalOk   += ok;
        totalFail += w.txs.length - ok;
        const icons = w.txs.map((t) => t.ok ? "✅" : (t.error?.includes("timeout") ? "⚠️" : "❌")).join(" ");
        console.log(`  ${w.wallet}: ${icons}`);
    }
    console.log(`\n  ✅ Confirmed success: ${totalOk}`);
    console.log(`  ❌ Failed/aborted:    ${totalFail}`);
    console.log(`\n📄 Results saved to ${RESULTS_PATH}`);
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
