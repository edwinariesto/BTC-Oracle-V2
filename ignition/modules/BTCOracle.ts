import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BTCOracleModule", (m) => {
  // Deploy BTCPriceFeed — harga awal $95.000 × 10^8
  const priceFeed = m.contract("BTCPriceFeed", [9500000000]);

  // Deploy BTCOraclePredictor, passing alamat BTCPriceFeed
  const predictor = m.contract("BTCOraclePredictor", [priceFeed]);

  return { priceFeed, predictor };
});
