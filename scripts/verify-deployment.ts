import {
    callReadOnlyFunction,
    cvToJSON,
    StandardPrincipalCV,
    uintCV,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================
// StacksForge — Verify Mainnet Deployment
// Uses @stacks/transactions to read on-chain state
// ============================================================

const network = new StacksMainnet();

async function verifyDeployment() {
    const deploymentPath = path.join(__dirname, '../deployments/mainnet.json');

    if (!fs.existsSync(deploymentPath)) {
        throw new Error('No mainnet.json found. Run deploy.ts first.');
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    const factoryPrincipal = deployment.contracts['token-factory'].principal;
    const [contractAddress, contractName] = factoryPrincipal.split('.');

    console.log('\n🔍 StacksForge — Deployment Verification');
    console.log('==========================================');
    console.log(`Factory: ${factoryPrincipal}`);
    console.log(`Network: Stacks Mainnet`);

    // Check get-version
    const versionResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-version',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
    });

    const version = cvToJSON(versionResult);
    console.log(`\n✅ Contract version: ${version.value}`);

    // Check token count
    const tokenCountResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-token-count',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
    });

    const tokenCount = cvToJSON(tokenCountResult);
    console.log(`✅ Token count: ${tokenCount.value}`);

    // Check creation fee
    const feeResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-creation-fee',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
    });

    const fee = cvToJSON(feeResult);
    const feeSTX = Number(fee.value) / 1_000_000;
    console.log(`✅ Creation fee: ${feeSTX} STX`);

    // Check owner
    const ownerResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-owner',
        functionArgs: [],
        network,
        senderAddress: contractAddress,
    });

    const owner = cvToJSON(ownerResult);
    console.log(`✅ Contract owner: ${owner.value}`);

    console.log('\n🎉 Verification complete — contracts are live on Stacks mainnet!');
    console.log(`\n🔗 Explorer: https://explorer.hiro.so/address/${contractAddress}.${contractName}?chain=mainnet`);
}

verifyDeployment().catch(err => {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
});
