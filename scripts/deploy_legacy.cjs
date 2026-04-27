require("dotenv/config");
const { createWalletClient, createPublicClient, http, serializeTransaction } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { monadTestnet } = require("viem/chains");
const { readFileSync } = require("fs");

const privateKey = process.env.PRIVATE_KEY;
const account = privateKeyToAccount(privateKey);
console.log("Account:", account.address);

const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });
const client = createWalletClient({ account, chain: monadTestnet, transport: http() });

const oracleArtifact = JSON.parse(
  readFileSync("./artifacts/contracts/BTCOraclePredictorV2.sol/BTCOraclePredictorV2.json", "utf8")
);
console.log("Bytecode len:", oracleArtifact.bytecode.length, "bytes");

async function main() {
  try {
    const nonce = await publicClient.getTransactionCount({ address: account.address });
    console.log("Nonce:", nonce);

    // Sign as legacy (type 0) with high gas price
    const unsignedTx = {
      to: undefined,
      data: oracleArtifact.bytecode,
      nonce,
      chainId: 10143,
      gas: 5000000n,
      gasPrice: 120000000000n, // 120 gwei (above base fee)
      value: 0n,
      type: "0x0",
    };

    console.log("Signing legacy transaction...");
    const signedTx = await client.signTransaction(unsignedTx);
    console.log("Signed tx len:", signedTx.length);

    // Send raw
    const resp = await fetch("https://testnet-rpc.monad.xyz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_sendRawTransaction",
        params: [signedTx],
        id: 1
      })
    });
    const result = await resp.json();
    if (result.error) {
      console.error("RPC Error:", result.error.code, result.error.message);
    } else {
      console.log("Tx hash:", result.result);
      // Wait for receipt
      console.log("Waiting for confirmation...");
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const rcptResp = await fetch("https://testnet-rpc.monad.xyz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getTransactionReceipt",
            params: [result.result],
            id: 1
          })
        });
        const rcpt = await rcptResp.json();
        if (rcpt.result && rcpt.result.blockNumber) {
          console.log("Block number:", rcpt.result.blockNumber);
          console.log("Status:", rcpt.result.status);
          if (rcpt.result.contractAddress) {
            console.log("Deployed at:", rcpt.result.contractAddress);
          }
          break;
        }
        console.log("Still waiting... attempt", i + 1);
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
    console.error("Cause:", e.cause?.message);
  }
}

main();
