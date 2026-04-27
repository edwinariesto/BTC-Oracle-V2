// Simple CJS deploy script — reads .env from parent dir
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { monadTestnet } = require('viem/chains');
const fs = require('fs');

const PRIVATE_KEY = process.env.PRIVATE_KEY;
console.log('Using PRIVATE_KEY:', PRIVATE_KEY ? PRIVATE_KEY.slice(0, 10) + '...' : 'NOT FOUND');

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);

  const client = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http('https://testnet-rpc.monad.xyz'),
  });

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http('https://testnet-rpc.monad.xyz'),
  });

  console.log('Account:', account.address);

  const bal = await publicClient.getBalance({ address: account.address });
  console.log('Balance:', (Number(bal) / 1e18).toFixed(6), 'MON');

  if (Number(bal) < 30000000000000000n) {
    console.error('ERROR: Balance less than 0.03 MON. Need at least 0.03 MON to deploy.');
    process.exit(1);
  }

  const artifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'BTCOraclePredictorV2.sol', 'BTCOraclePredictorV2.json'), 'utf8')
  );

  console.log('Bytecode size:', artifact.bytecode.length, 'chars');
  console.log('Functions:', artifact.abi.filter(a => a.type === 'function').map(a => a.name).join(', '));

  console.log('\nDeploying V2 contract...');
  const hash = await client.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    gas: 3_000_000n,
  });
  console.log('TX submitted. Hash:', hash);

  console.log('Waiting for confirmation...');
  let receipt;
  try {
    receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Receipt status:', receipt.status);
    console.log('Contract address:', receipt.contractAddress);
    console.log('Gas used:', receipt.gasUsed.toString());
  } catch (err) {
    console.error('Deploy failed:', err.message || err.shortMessage || String(err));
    // Try to get receipt even on error
    try {
      const r = await publicClient.getTransactionReceipt({ hash });
      console.log('Fallback receipt status:', r.status);
      if (r.status !== 'success') {
        console.error('TX reverted. Gas used:', r.gasUsed.toString());
        process.exit(1);
      }
      receipt = r;
    } catch {
      process.exit(1);
    }
  }

  if (receipt && receipt.contractAddress) {
    const addr = receipt.contractAddress;
    const code = await publicClient.getCode({ address: addr });
    console.log('Bytecode at address:', code ? code.length : 0, 'chars');
    if (!code || code.length === 0) {
      console.error('ERROR: Contract deployed but has NO CODE!');
      process.exit(1);
    }
    console.log('\n=== BERHASIL! ===');
    console.log('Contract address:', addr);
    console.log('\nUpdate src/config/wagmi.ts:');
    console.log(`  BTCOraclePredictorV2: '${addr}',`);
  } else {
    console.error('ERROR: No contract address in receipt');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('FAILED:', err.shortMessage || err.message || err);
  process.exit(1);
});
