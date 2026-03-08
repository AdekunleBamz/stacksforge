import {
    makeContractDeploy,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { readFileSync } from 'fs';

async function deploy() {
    console.log('Deploying Forge Token implementation...');
    const privateKey = process.env.STX_PRIVATE_KEY;
    if (!privateKey) throw new Error('STX_PRIVATE_KEY is required');

    const network = new StacksMainnet();
    const code = readFileSync('./contracts/forge-token-v-i2.clar').toString();

    const txOptions = {
        contractName: 'forge-token-v-i2',
        codeBody: code,
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
    };

    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    console.log('Result:', broadcastResponse);
}

deploy().catch(console.error);
