import { getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';

const privateKey = process.env.STX_PRIVATE_KEY;
if (privateKey) {
    const address = getAddressFromPrivateKey(privateKey, TransactionVersion.Mainnet);
    console.log('Mainnet Address:', address);
} else {
    console.log('Please set STX_PRIVATE_KEY');
}
