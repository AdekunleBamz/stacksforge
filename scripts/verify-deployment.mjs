import { StacksMainnet } from '@stacks/network';

async function verify(txid) {
    const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/tx/${txid}`);
    const data = await response.json();
    console.log(`Transaction Status: ${data.tx_status}`);
}

const txid = process.argv[2];
if (txid) {
    verify(txid).catch(console.error);
} else {
    console.log('Usage: node scripts/verify-deployment.mjs <txid>');
}
