/**
 * set-fee.mjs
 * Calls set-creation-fee on the live token-factory contract to update
 * the creation fee to 0.002 STX (2000 microSTX).
 * Only the contract owner (deployer) can call this.
 */
import { readFileSync } from "fs";
import txPkg from "@stacks/transactions";
import walletPkg from "@stacks/wallet-sdk";
import networkPkg from "@stacks/network";

const {
    makeContractCall,
    broadcastTransaction,
    uintCV,
    PostConditionMode,
    getAddressFromPrivateKey,
    TransactionVersion,
} = txPkg;
const { generateWallet } = walletPkg;
const { StacksMainnet } = networkPkg;

const TOML_PATH = "./settings/Mainnet.toml";
const NETWORK = new StacksMainnet();
const GAS_FEE = 1_000;        // 0.001 STX
const NEW_FEE_USTX = 2_000;        // 0.002 STX = 2000 microSTX
const FACTORY_ADDRESS = "SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT";
const FACTORY_NAME = "token-factory";

function extractMnemonic(p) {
    const m = readFileSync(p, "utf-8").match(/mnemonic\s*=\s*"(.+?)"/);
    if (!m) throw new Error("No mnemonic in " + p);
    return m[1];
}

async function fetchNonce(address) {
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?proof=0`);
    const data = await res.json();
    return data.nonce;
}

async function main() {
    console.log("⚙️  StacksForge — Update Creation Fee");
    console.log("══════════════════════════════════════");
    console.log(`📄 Contract:  ${FACTORY_ADDRESS}.${FACTORY_NAME}`);
    console.log(`💸 New fee:   ${NEW_FEE_USTX} microSTX (${NEW_FEE_USTX / 1_000_000} STX)\n`);

    const mnemonic = extractMnemonic(TOML_PATH);
    const wallet = await generateWallet({ secretKey: mnemonic, password: "" });
    const account = wallet.accounts[0];
    const privateKey = account.stxPrivateKey;
    const owner = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);

    console.log(`🔑 Owner:  ${owner}`);

    const nonce = await fetchNonce(owner);
    console.log(`🔢 Nonce:  ${nonce}\n`);

    const tx = await makeContractCall({
        contractAddress: FACTORY_ADDRESS,
        contractName: FACTORY_NAME,
        functionName: "set-creation-fee",
        functionArgs: [uintCV(NEW_FEE_USTX)],
        senderKey: privateKey,
        network: NETWORK,
        fee: BigInt(GAS_FEE),
        nonce: BigInt(nonce),
        postConditionMode: PostConditionMode.Allow,
    });

    console.log("✅ Transaction built");

    const result = await broadcastTransaction(tx, NETWORK);

    if (result.error) {
        console.log(`❌ Broadcast error: ${result.error}`);
        console.log(`   Reason: ${result.reason}`);
        if (result.reason_data) console.log(`   Details: ${JSON.stringify(result.reason_data)}`);
        process.exit(1);
    }

    const txid = typeof result === "string" ? result : result.txid;
    console.log(`🚀 Broadcast OK! txid: ${txid}`);
    console.log(`🔗 https://explorer.hiro.so/txid/${txid}?chain=mainnet`);
    console.log(`\n✅ Creation fee will be 0.002 STX once the tx confirms (~1-2 min)`);
    console.log(`   Then fund W1 with ~1 STX and run the interaction scripts.`);
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
