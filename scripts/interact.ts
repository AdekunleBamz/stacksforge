import {
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode,
    callReadOnlyFunction,
    cvToJSON,
    uintCV,
    stringAsciiCV,
    getAddressFromPrivateKey,
    TransactionVersion,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================
// StacksForge — Interaction Script
// Demonstrates calling create-token on-chain using @stacks/transactions
// ============================================================

const network = new StacksMainnet();

async function interactWithFactory() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error('DEPLOYER_PRIVATE_KEY not set in .env');

    const senderAddress = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);
    const deploymentPath = path.join(__dirname, '../deployments/mainnet.json');

    if (!fs.existsSync(deploymentPath)) {
        throw new Error('deployments/mainnet.json not found. Run deploy.ts first.');
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    const factoryPrincipal = deployment.contracts['token-factory'].principal;
    const [contractAddress, contractName] = factoryPrincipal.split('.');

    console.log('\n🔥 StacksForge — Create Token Example');
    console.log('=======================================');
    console.log(`Sender:  ${senderAddress}`);
    console.log(`Factory: ${factoryPrincipal}`);

    // Read current fee
    const feeResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-creation-fee',
        functionArgs: [],
        network,
        senderAddress,
    });
    const fee = BigInt(cvToJSON(feeResult).value);
    console.log(`Fee:     ${Number(fee) / 1_000_000} STX`);

    // Create a token
    const tx = await makeContractCall({
        contractAddress,
        contractName,
        functionName: 'create-token',
        functionArgs: [
            stringAsciiCV('StacksForge Demo'),    // name
            stringAsciiCV('SFD'),                 // symbol
            uintCV(6n),                           // decimals
            uintCV(21_000_000_000_000n),          // supply: 21M tokens (with 6 decimals)
        ],
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: BigInt(5000),
    });

    const result = await broadcastTransaction(tx, network);

    if ('error' in result) {
        console.error('❌ Transaction failed:', result.error);
        throw new Error(result.error);
    }

    console.log(`\n✅ create-token broadcast!`);
    console.log(`   TXID: ${result.txid}`);
    console.log(`   Explorer: https://explorer.hiro.so/txid/${result.txid}?chain=mainnet`);
    console.log('\nWaiting for confirmation (~30s)...');

    await new Promise(r => setTimeout(r, 30_000));

    // Verify token count increased
    const countResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-token-count',
        functionArgs: [],
        network,
        senderAddress,
    });
    const count = cvToJSON(countResult);
    console.log(`\n✅ Total tokens registered: ${count.value}`);
}

interactWithFactory().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
});
