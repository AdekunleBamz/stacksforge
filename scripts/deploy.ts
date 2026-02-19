import {
    makeContractDeploy,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode,
    getAddressFromPrivateKey,
    TransactionVersion,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================
// StacksForge Mainnet Deployment Script
// Uses @stacks/transactions to deploy Clarity contracts
// ============================================================

const network = new StacksMainnet();

async function deployContract(
    contractName: string,
    contractPath: string,
    privateKey: string
): Promise<string> {
    const contractCode = fs.readFileSync(contractPath, 'utf-8');
    const senderAddress = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);

    console.log(`\n📦 Deploying ${contractName}...`);
    console.log(`   Sender: ${senderAddress}`);

    const txOptions = {
        contractName,
        codeBody: contractCode,
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: BigInt(5000), // 0.05 STX
    };

    const tx = await makeContractDeploy(txOptions);
    const result = await broadcastTransaction(tx, network);

    if ('error' in result) {
        console.error(`❌ Deployment failed for ${contractName}: ${result.error}`);
        if (result.reason) console.error(`   Reason: ${result.reason}`);
        throw new Error(`Deployment failed: ${result.error}`);
    }

    const txid = result.txid;
    const explorerUrl = `https://explorer.hiro.so/txid/${txid}?chain=mainnet`;

    console.log(`✅ ${contractName} deployed!`);
    console.log(`   TXID: ${txid}`);
    console.log(`   Explorer: ${explorerUrl}`);

    return txid;
}

async function main() {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('DEPLOYER_PRIVATE_KEY is not set in .env');
    }

    const senderAddress = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);
    console.log('\n🔥 StacksForge — Mainnet Deployment');
    console.log('=====================================');
    console.log(`Deployer: ${senderAddress}`);
    console.log(`Network:  Stacks Mainnet`);

    const contractsDir = path.join(__dirname, '../contracts');
    const deployments: Record<string, string> = {};

    // 1. Deploy SIP-010 trait
    const traitTxid = await deployContract(
        'sip-010-trait-ft-standard',
        path.join(contractsDir, 'traits/sip-010-trait.clar'),
        privateKey
    );
    deployments['sip-010-trait'] = traitTxid;

    // Wait for confirmation
    await new Promise(r => setTimeout(r, 30_000));

    // 2. Deploy forge-token
    const tokenTxid = await deployContract(
        'forge-token',
        path.join(contractsDir, 'forge-token.clar'),
        privateKey
    );
    deployments['forge-token'] = tokenTxid;

    await new Promise(r => setTimeout(r, 30_000));

    // 3. Deploy token-factory
    const factoryTxid = await deployContract(
        'token-factory',
        path.join(contractsDir, 'token-factory.clar'),
        privateKey
    );
    deployments['token-factory'] = factoryTxid;

    // Write deployment record
    const deploymentRecord = {
        network: 'mainnet',
        deployer: senderAddress,
        timestamp: new Date().toISOString(),
        contracts: {
            'sip-010-trait': {
                txid: traitTxid,
                principal: `${senderAddress}.sip-010-trait-ft-standard`
            },
            'forge-token': {
                txid: tokenTxid,
                principal: `${senderAddress}.forge-token`
            },
            'token-factory': {
                txid: factoryTxid,
                principal: `${senderAddress}.token-factory`
            }
        }
    };

    const outDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, 'mainnet.json');
    fs.writeFileSync(outPath, JSON.stringify(deploymentRecord, null, 2));

    console.log('\n🎉 All contracts deployed!');
    console.log(`📄 Deployment record: ${outPath}`);
    console.log('\nNext steps:');
    console.log('  1. Verify contracts on Stacks Explorer');
    console.log('  2. Update frontend/.env.local with NEXT_PUBLIC_FACTORY_ADDRESS');
    console.log(`  3. Factory: ${senderAddress}.token-factory`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
