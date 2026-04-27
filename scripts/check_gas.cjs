const { createPublicClient, http } = require("viem");
const { monadTestnet } = require("viem/chains");
const publicClient = createPublicClient({ chain: monadTestnet, transport: http() });

async function main() {
  const methods = [
    "eth_gasPrice",
    "eth_maxPriorityFeePerGas",
    "eth_getBlockByNumber"
  ];
  for (const m of methods) {
    try {
      const params = m === "eth_getBlockByNumber" ? ["latest", false] : [];
      const resp = await fetch("https://testnet-rpc.monad.xyz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: m, params, id: 1 })
      });
      const r = await resp.json();
      if (r.error) console.log(m + ": ERROR", r.error.code, r.error.message);
      else console.log(m + ":", JSON.stringify(r.result).slice(0, 80));
    } catch (e) {
      console.log(m + ":", e.message);
    }
  }
}

main();
