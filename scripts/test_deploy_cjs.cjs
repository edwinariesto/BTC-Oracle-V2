require("dotenv/config");
const { createWalletClient, createPublicClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { monadTestnet } = require("viem/chains");
const { readFileSync } = require("fs");

const privateKey = process.env.PRIVATE_KEY;
console.log("PRIVATE_KEY:", privateKey?.slice(0, 6));
const account = privateKeyToAccount(privateKey);
console.log("Account:", account.address);

const client = createWalletClient({ account, chain: monadTestnet, transport: http() });
const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });

const oracleArtifact = JSON.parse(
  readFileSync("./artifacts/contracts/BTCOraclePredictorV2.sol/BTCOraclePredictorV2.json", "utf8")
);
console.log("Bytecode len:", oracleArtifact.bytecode.length, "bytes");

async function main() {
  try {
    const hash = await client.deployContract({
      abi: oracleArtifact.abi,
      bytecode: oracleArtifact.bytecode,
    });
    console.log("Tx hash:", hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Deployed at:", receipt.contractAddress);
  } catch (e) {
    console.error("Error:", e.shortMessage || e.message);
    console.error("Error name:", e.name);
    console.error("Error code:", e.code);
    console.error("Error cause:", e.cause?.message);

    // Check nonce
    try {
      const nonce = await publicClient.getTransactionCount({ address: account.address });
      console.log("Current nonce:", nonce);
    } catch (e2) {
      console.error("Nonce error:", e2.message);
    }
  }
}

main();
