/**
 * deploy-forge-token.mjs
 * Deploys ONLY the forge-token contract with a fresh nonce fetched from chain.
 * Run this if forge-token was skipped in the main deploy due to nonce conflict.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import txPkg from "@stacks/transactions";
import walletPkg from "@stacks/wallet-sdk";
import networkPkg from "@stacks/network";

const {
    makeContractDeploy,
    broadcastTransaction,
    ClarityVersion,
    PostConditionMode,
    getAddressFromPrivateKey,
    TransactionVersion,
} = txPkg;

const { generateWallet } = walletPkg;
const { StacksMainnet } = networkPkg;

const TOML_PATH = "./settings/Mainnet.toml";
const FEE = 20000;
const NETWORK = new StacksMainnet();

function extractMnemonic(tomlPath) {
    const content = readFileSync(tomlPath, "utf-8");
    const match = content.match(/mnemonic\s*=\s*"(.+?)"/);
    if (!match) throw new Error("Could not find mnemonic in " + tomlPath);
    return match[1];
}

async function fetchNonce(address) {
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
    const data = await res.json();
    // Use the next recommended nonce (confirmed + pending)
    const nonce = data.nonce ?? data.balance_proof?.nonce;
    console.log(`  📊 Chain nonce for ${address}: ${nonce}`);
    return nonce;
}

async function main() {
    console.log("🔥 StacksForge — forge-token retry deploy");
    console.log("══════════════════════════════════════════");

    const mnemonic = extractMnemonic(TOML_PATH);
    const wallet = await generateWallet({ secretKey: mnemonic, password: "" });
    const account = wallet.accounts[0];
    const privateKey = account.stxPrivateKey;
    const senderAddress = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);

    console.log(`🔑 Deployer: ${senderAddress}`);

    // Fetch fresh nonce so there's no conflict
    const nonce = await fetchNonce(senderAddress);

    const codeBody = readFileSync("contracts/forge-token.clar", "utf-8");

    console.log(`\n─── Deploying forge-token (nonce: ${nonce}) ───`);

    try {
        const tx = await makeContractDeploy({
            contractName: "forge-token",
            codeBody,
            senderKey: privateKey,
            network: NETWORK,
            fee: FEE,
            nonce,
            postConditionMode: PostConditionMode.Allow,
            clarityVersion: ClarityVersion.Clarity2,
        });

        console.log("  ✅ Transaction built");

        const result = await broadcastTransaction(tx, NETWORK);

        if (result.error) {
            console.log(`  ❌ Broadcast error: ${result.error}`);
            console.log(`     Reason: ${result.reason}`);
            if (result.reason_data) console.log(`     Details: ${JSON.stringify(result.reason_data)}`);
            process.exit(1);
        }

        const txid = typeof result === "string" ? result : result.txid;
        const principal = `${senderAddress}.forge-token`;
        console.log(`  🚀 Broadcast OK! txid: ${txid}`);
        console.log(`  📄 Principal:    ${principal}`);
        console.log(`  🔗 https://explorer.hiro.so/txid/${txid}?chain=mainnet`);

        // Update deployments/mainnet.json
        const recPath = "./deployments/mainnet.json";
        const record = existsSync(recPath) ? JSON.parse(readFileSync(recPath, "utf-8")) : {};
        record.contracts = record.contracts ?? {};
        record.contracts["forge-token"] = { txid, principal };
        writeFileSync(recPath, JSON.stringify(record, null, 2));
        console.log(`\n📄 deployments/mainnet.json updated`);
        console.log(`\n🎉 All 3 contracts now deployed!`);
        console.log(`   forge-token:               ${principal}`);
        console.log(`   token-factory:             SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT.token-factory`);
        console.log(`   sip-010-trait-ft-standard: SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT.sip-010-trait-ft-standard`);

    } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
