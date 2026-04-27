import "dotenv/config";
import { createWalletClient, createPublicClient, http, serializeTransaction } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";
import { readFileSync } from "fs";

const account = privateKeyToAccount(process.env.PRIVATE_KEY);
console.log("Account:", account.address);
const client = createWalletClient({ account, chain: monadTestnet, transport: http() });
const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });

const oracleArtifact = JSON.parse(readFileSync("./artifacts/contracts/BTCOraclePredictorV2.sol/BTCOraclePredictorV2.json", "utf8"));
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
  } catch(e) {
    console.error("Error:", e.shortMessage || e.message);
    console.error("Error name:", e.name);
    console.error("Error code:", e.code);
    // Try to see what raw tx was constructed
    try {
      // Extract the raw tx from error
      const txInfo = e.cause?.transaction;
      if (txInfo) {
        // Try sign + send raw manually
        const nonce = await publicClient.getTransactionCount({ address: account.address });
        const chainId = await publicClient.getChainId();
        console.log("Nonce:", nonce, "ChainId:", chainId);

        const tx = {
          to: undefined,
          data: oracleArtifact.bytecode,
          nonce,
          chainId,
          gas: 5000000n,
          gasPrice: 100000000000n,
          type: '0x0',
        };
        const signed = await client.signTransaction(tx);
        console.log("Signed tx len:", signed.length);

        // Send via raw RPC
        const resp = await fetch("https://testnet-rpc.monad.xyz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_sendRawTransaction",
            params: [signed],
            id: 1
          })
        });
        const result = await resp.json();
        console.log("Raw RPC response:", JSON.stringify(result));
      }
    } catch(e2) {
      console.error("Nested error:", e2.message);
    }
  }
}

main();
