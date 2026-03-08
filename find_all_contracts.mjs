import { StacksMainnet } from '@stacks/network';

async function findAll() {
    const address = 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT';
    const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/results`);
    const data = await response.json();
    console.log('Contracts found:', data.results);
}

findAll().catch(console.error);
