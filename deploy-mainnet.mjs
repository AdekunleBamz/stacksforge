import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import txPkg from "@stacks/transactions";
import walletPkg from "@stacks/wallet-sdk";
import networkPkg from "@stacks/network";

const {
    makeContractDeploy,
    broadcastTransaction,
    AnchorMode,
    ClarityVersion,
    PostConditionMode,
    getAddressFromPrivateKey,
    TransactionVersion,
} = txPkg;

const { generateWallet } = walletPkg;
const { STACKS_MAINNET } = networkPkg;

// ── Config ──────────────────────────────────────────────────────────────────
const TOML_PATH = "./settings/Mainnet.toml";
const FEE = 20000;             // 0.02 STX per contract deployment
const NETWORK = STACKS_MAINNET;
const EPOCH = ClarityVersion.Clarity2;

const CONTRACTS = [
    {
        name: "sip-010-trait-ft-standard",
        path: "contracts/traits/sip-010-trait.clar",
        clarityVersion: EPOCH,
    },
    {
        name: "forge-token",
        path: "contracts/forge-token.clar",
        clarityVersion: EPOCH,
    },
    {
        name: "token-factory",
        path: "contracts/token-factory.clar",
        clarityVersion: EPOCH,
    },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function extractMnemonic(tomlPath) {
    const content = readFileSync(tomlPath, "utf-8");
    const match = content.match(/mnemonic\s*=\s*"(.+?)"/);
    if (!match) throw new Error(`Could not find mnemonic in ${tomlPath}`);
    return match[1];
}

function extractFeeRecipient(tomlPath) {
    const content = readFileSync(tomlPath, "utf-8");
    const match = content.match(/fee_recipient\s*=\s*"(.+?)"/);
    return match ? match[1] : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchBalance(address) {
    try {
        const res = await fetch(
            `https://api.mainnet.hiro.so/extended/v1/address/${address}/stx`
        );
        const data = await res.json();
        return (parseInt(data.balance) / 1_000_000).toFixed(6);
    } catch {
        return "unknown";
    }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
    console.log("🔥 StacksForge — Mainnet Deployment");
    console.log("═════════════════════════════════════");

    const mnemonic = extractMnemonic(TOML_PATH);
    const feeRecipient = extractFeeRecipient(TOML_PATH);
    console.log("📋 Mnemonic loaded from Mainnet.toml");

    const wallet = await generateWallet({ secretKey: mnemonic, password: "" });
    const account = wallet.accounts[0];
    const privateKey = account.stxPrivateKey;
    const senderAddress = getAddressFromPrivateKey(
        privateKey,
        TransactionVersion.Mainnet
    );

    console.log(`🔑 Deployer:       ${senderAddress}`);
    console.log(`💸 Fee recipient:  ${feeRecipient ?? senderAddress}`);
    console.log(`⛽ Fee per deploy: ${FEE} microSTX`);
    console.log(`📦 Contracts:      ${CONTRACTS.length}\n`);

    const balance = await fetchBalance(senderAddress);
    console.log(`💰 Wallet balance: ${balance} STX\n`);

    const results = [];

    for (const contract of CONTRACTS) {
        console.log(`─── Deploying ${contract.name} ───`);
        const codeBody = readFileSync(contract.path, "utf-8");

        try {
            const tx = await makeContractDeploy({
                contractName: contract.name,
                codeBody,
                senderKey: privateKey,
                network: NETWORK,
                fee: FEE,
                anchorMode: AnchorMode.OnChainOnly,
                postConditionMode: PostConditionMode.Allow,
                clarityVersion: contract.clarityVersion,
            });

            console.log(`  ✅ Transaction built`);

            const broadcastResult = await broadcastTransaction(tx, NETWORK);

            if (broadcastResult.error) {
                console.log(`  ❌ Broadcast error: ${broadcastResult.error}`);
                if (broadcastResult.reason) {
                    console.log(`     Reason: ${broadcastResult.reason}`);
                }
                if (broadcastResult.reason_data) {
                    console.log(`     Details: ${JSON.stringify(broadcastResult.reason_data)}`);
                }
                results.push({
                    name: contract.name,
                    status: "FAILED",
                    error: broadcastResult.error,
                });
            } else {
                const txid =
                    typeof broadcastResult === "string"
                        ? broadcastResult
                        : broadcastResult.txid;
                const principal = `${senderAddress}.${contract.name}`;
                console.log(`  🚀 Broadcast OK! txid: ${txid}`);
                console.log(`  📄 Principal:    ${principal}`);
                console.log(`  🔗 https://explorer.hiro.so/txid/${txid}?chain=mainnet`);
                results.push({ name: contract.name, status: "OK", txid, principal });
            }
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
            results.push({ name: contract.name, status: "ERROR", error: err.message });
        }

        // Small pause between deploys to avoid nonce races
        await sleep(2000);
        console.log();
    }

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log("═════════════════════════════════════");
    console.log("  DEPLOYMENT SUMMARY");
    console.log("═════════════════════════════════════");
    for (const r of results) {
        const icon = r.status === "OK" ? "✅" : "❌";
        const extra = r.txid ? ` — ${r.txid}` : r.error ? ` — ${r.error}` : "";
        console.log(`  ${icon} ${r.name}: ${r.status}${extra}`);
    }
    console.log("═════════════════════════════════════\n");

    // ── Write deployment record ────────────────────────────────────────────────
    const outDir = "./deployments";
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const record = {
        network: "mainnet",
        deployer: senderAddress,
        feeRecipient: feeRecipient ?? senderAddress,
        timestamp: new Date().toISOString(),
        contracts: Object.fromEntries(
            results
                .filter((r) => r.status === "OK")
                .map((r) => [r.name, { txid: r.txid, principal: r.principal }])
        ),
    };

    const outPath = join(outDir, "mainnet.json");
    writeFileSync(outPath, JSON.stringify(record, null, 2));
    console.log(`📄 Deployment record written to ${outPath}`);

    const factory = results.find((r) => r.name === "token-factory");
    if (factory?.status === "OK") {
        console.log(`\n🎉 Factory live: ${factory.principal}`);
        console.log(`   Set NEXT_PUBLIC_FACTORY_ADDRESS=${factory.principal} in frontend/.env.local`);
    }
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
