/**
 * interact-all.mjs
 * Runs contract interactions for all 25 test wallets sequentially.
 * Each wallet calls create-token on the StacksForge token-factory contract.
 * 
 * Interaction per wallet:
 *   - Calls: token-factory::create-token
 *   - Cost:  1 STX creation fee + 0.001 STX gas = 1.001 STX
 *   - Each wallet runs ONE transaction
 *   - 5 second delay between each wallet to avoid rate limiting
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import txPkg from "@stacks/transactions";
import networkPkg from "@stacks/network";

const {
    makeContractCall,
    broadcastTransaction,
    stringAsciiCV,
    uintCV,
    PostConditionMode,
    FungibleConditionCode,
    makeStandardSTXPostCondition,
    TransactionVersion,
    getAddressFromPrivateKey,
} = txPkg;
const { StacksMainnet } = networkPkg;

// ── Config ──────────────────────────────────────────────────────────────────
const WALLETS_PATH = "./internal/test-wallets.json";
const RESULTS_PATH = "./internal/interact-results.json";
const NETWORK = new StacksMainnet();
const GAS_FEE = 1_000;          // 0.001 STX
const CREATION_FEE_USTX = 2_000n;         // 0.002 STX (matches set-creation-fee on deployed contract)
const DELAY_MS = 5_000;          // 5 seconds

// Deployed contract
const FACTORY_ADDRESS = "SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT";
const FACTORY_CONTRACT = "token-factory";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchNonce(address) {
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
    const data = await res.json();
    return data.nonce;
}

async function fetchBalance(address) {
    try {
        const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/stx`);
        const data = await res.json();
        return (parseInt(data.balance) / 1_000_000).toFixed(4);
    } catch {
        return "unknown";
    }
}

// Build a unique token name and symbol for each wallet
function tokenParamsForWallet(wallet) {
    const n = wallet.id;
    return {
        name: `StacksForge Test Token ${n}`,
        symbol: `SFT${n}`,
        decimals: 6n,
        supply: BigInt(1_000_000 * n),   // 1M × wallet id
    };
}

async function main() {
    const wallets = JSON.parse(readFileSync(WALLETS_PATH, "utf-8"));

    console.log("🔥 StacksForge — Contract Interactions");
    console.log("════════════════════════════════════════");
    console.log(`📋 Wallets:       ${wallets.length}`);
    console.log(`📄 Contract:      ${FACTORY_ADDRESS}.${FACTORY_CONTRACT}`);
    console.log(`⛽ Gas per tx:    ${GAS_FEE / 1_000_000} STX`);
    console.log(`💸 Creation fee:  ${Number(CREATION_FEE_USTX) / 1_000_000} STX`);
    console.log(`⏱  Delay:         ${DELAY_MS / 1000}s between wallets`);
    console.log();

    const results = [];

    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const params = tokenParamsForWallet(wallet);

        const balance = await fetchBalance(wallet.address);
        console.log(`─── ${wallet.name} | ${wallet.address} | balance: ${balance} STX ───`);
        console.log(`    Token: "${params.name}" (${params.symbol}), supply: ${params.supply}`);

        try {
            const nonce = await fetchNonce(wallet.address);

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
                fee: BigInt(GAS_FEE),
                nonce: BigInt(nonce),
                postConditionMode: PostConditionMode.Allow,
                postConditions: [
                    makeStandardSTXPostCondition(
                        wallet.address,
                        FungibleConditionCode.LessEqual,
                        CREATION_FEE_USTX
                    ),
                ],
            });

            const result = await broadcastTransaction(tx, NETWORK);

            if (result.error) {
                console.log(`  ❌ Broadcast error: ${result.error} — ${result.reason}`);
                results.push({ wallet: wallet.name, address: wallet.address, status: "FAILED", error: result.error });
            } else {
                const txid = typeof result === "string" ? result : result.txid;
                console.log(`  ✅ txid: ${txid}`);
                console.log(`  🔗 https://explorer.hiro.so/txid/${txid}?chain=mainnet`);
                results.push({
                    wallet: wallet.name,
                    address: wallet.address,
                    status: "OK",
                    txid,
                    token: { name: params.name, symbol: params.symbol },
                });
            }
        } catch (err) {
            console.log(`  ❌ Exception: ${err.message}`);
            results.push({ wallet: wallet.name, address: wallet.address, status: "ERROR", error: err.message });
        }

        console.log();

        // 5 second delay between wallets (skip after last)
        if (i < wallets.length - 1) {
            console.log(`  ⏳ Waiting ${DELAY_MS / 1000}s before next wallet...\n`);
            await sleep(DELAY_MS);
        }
    }

    // Save results
    writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));

    // Summary
    console.log("════════════════════════════════════════");
    console.log("  INTERACTION SUMMARY");
    console.log("════════════════════════════════════════");
    const ok = results.filter((r) => r.status === "OK").length;
    const fail = results.length - ok;
    console.log(`  ✅ Successful: ${ok} / ${results.length}`);
    console.log(`  ❌ Failed:     ${fail}`);
    console.log();
    results.forEach((r) => {
        const icon = r.status === "OK" ? "✅" : "❌";
        const extra = r.txid ? r.txid.slice(0, 12) + "..." : r.error ?? "";
        console.log(`  ${icon} ${r.wallet}: ${r.status} ${extra}`);
    });
    console.log("════════════════════════════════════════");
    console.log(`\n📄 Results saved to ${RESULTS_PATH}`);
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
