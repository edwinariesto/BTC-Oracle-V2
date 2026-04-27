// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ============================================================
// BTCPriceFeed.sol — Owner-managed BTC/USD price feed
//Karena Chainlink belum tersedia di Monad Testnet, owner harus
// mengupdate harga secara manual setiap beberapa menit.
// Format harga: USD × 10^8 (contoh: $95.000 = 9500000000)
// ============================================================

contract BTCPriceFeed {
    address public owner;
    int256 public btcPrice; // USD × 10^8

    event PriceUpdated(int256 newPrice);

    constructor(int256 _initialPrice) {
        owner = msg.sender;
        btcPrice = _initialPrice;
    }

    function updatePrice(int256 _newPrice) external {
        require(msg.sender == owner, "Hanya owner");
        require(_newPrice > 0, "Harga harus positif");
        btcPrice = _newPrice;
        emit PriceUpdated(_newPrice);
    }

    function getBTCPrice() external view returns (int256) {
        return btcPrice;
    }
}
