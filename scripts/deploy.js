import "dotenv/config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";
import { readFileSync } from "fs";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey || privateKey === "0x0000000000000000000000000000000000000000000000000000000000000000") {
  console.error("ERROR: Set PRIVATE_KEY yang benar di file .env");
  process.exit(1);
}

const account = privateKeyToAccount(privateKey);

async function main() {
  const client = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  // Check balance first
  const bal = await publicClient.getBalance({ address: account.address });
  console.log("Deploying dengan account:", account.address);
  console.log("Balance:", Number(bal) / 1e18, "MON");

  if (Number(bal) < 1e18) {
    console.error("ERROR: Saldo kurang dari 1 MON. Butuh untuk deploy + gas.");
    process.exit(1);
  }

  // Baca artifact V2 (sudah di-compile sebelumnya)
  const oracleArtifact = JSON.parse(
    readFileSync("./artifacts/contracts/BTCOraclePredictorV2.sol/BTCOraclePredictorV2.json", "utf8")
  );

  console.log("ABI functions:", oracleArtifact.abi.filter(a => a.type === "function").map(a => a.name).join(", "));
  console.log("Bytecode size:", oracleArtifact.bytecode.length, "chars");

  console.log("\nDeploying BTCOraclePredictorV2...");
  const orHash = await client.deployContract({
    abi: oracleArtifact.abi,
    bytecode: oracleArtifact.bytecode,
  });
  console.log("TX hash:", orHash);

  const orReceipt = await publicClient.waitForTransactionReceipt({ hash: orHash });
  const oracleAddr = orReceipt.contractAddress;
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("BTCOraclePredictorV2:", oracleAddr);
  console.log("\nUpdate src/config/wagmi.ts:");
  console.log(`  BTCOraclePredictorV2: '${oracleAddr}'`);
  console.log("\nUpdate src/config/wagmi.ts sekarang? (y/n)");
}

main().catch((error) => {
  console.error("Deployment gagal:", error.shortMessage || error.message);
  process.exit(1);
});
