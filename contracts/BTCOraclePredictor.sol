// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Interface untuk BTCPriceFeed
interface IBTCPriceFeed {
    function getBTCPrice() external view returns (int256);
}

// ============================================================
// BTCOraclePredictor.sol — Game Tebak BTC dengan Rental System
// ============================================================
// Mekanisme:
// 1. User deposit 0.01 MON sebagai sewa sistem (30 hari)
// 2. User pilih NAIK atau TURUN
// 3. Sistem catat harga BTC saat itu + deadline
// 4. Setelah deadline, cek perubahan harga
// 5. WIN  = arah benar + perubahan >= 0.5% → next day
// 6. LOSE = arah salah atau < 0.5% → reset Day 1
// 7. DAY 30 selesai = bonus 10 MON
// ============================================================

contract BTCOraclePredictor {
    address public owner;
    address public btcPriceFeed;

    // Rental fee = 1 MON (1e18 wei)
    uint256 public constant RENTAL_FEE = 1e18;
    uint256 public constant RENTAL_DAYS = 30 days;

    // Hadiah per hari (IDR × 1e18 / 5000)
    uint256[] public rewardIDR = [
        2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000,
        22000, 24000, 26000, 28000, 30000, 32000, 34000, 36000, 38000, 40000,
        42000, 44000, 46000, 48000, 50000, 52000, 54000, 56000, 58000, 60000
    ];

    uint256[] public durationSec = [
        60, 3600, 3600, 3600, 3600, 3600, 3600, 3600,
        7200, 7200, 7200, 7200, 7200, 7200, 7200, 7200,
        10800, 10800, 10800, 10800, 10800, 10800, 10800,
        14400, 14400, 14400, 14400, 14400, 14400, 14400,
        18000, 18000
    ];

    // Kurs konversi
    uint256 public idrPerMon = 5000;
    // Bonus 30 hari = Rp 50.000
    uint256 public constant BONUS_30_DAY = 10e18; // 10 MON

    struct Player {
        // Rental
        bool hasRented;
        uint256 rentEndTime;
        // Game
        uint256 currentDay;
        bool hasActiveBet;
        bool betDirection;    // true = NAIK, false = TURUN
        uint256 betStartPrice;
        uint256 betEndTime;
        uint256 pendingReward;
        uint256 waitingUntil;
    }

    mapping(address => Player) public players;

    event RentPurchased(address indexed player, uint256 endTime);
    event BetPlaced(address indexed player, uint256 day, bool direction, uint256 startPrice, uint256 endTime);
    event BetWon(address indexed player, uint256 day, uint256 reward);
    event BetLost(address indexed player, uint256 lostDay);
    event Day30Completed(address indexed player, uint256 bonus);
    event RewardClaimed(address indexed player, uint256 amount);
    event RentWithdrawn(address indexed player, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya owner");
        _;
    }

    constructor(address _btcPriceFeed) {
        owner = msg.sender;
        btcPriceFeed = _btcPriceFeed;
    }

    function _getBTCPrice() internal view returns (uint256) {
        IBTCPriceFeed feed = IBTCPriceFeed(btcPriceFeed);
        return uint256(feed.getBTCPrice());
    }

    // ============================================================
    // FUNGSI: SEWA SISTEM (DEPOSIT 1 MON)
    // ============================================================
    function rentSystem() external payable {
        Player storage p = players[msg.sender];
        require(!p.hasRented, "Sudah sewa sistem");
        require(msg.value == RENTAL_FEE, "Harus deposit 1 MON");
        require(p.currentDay == 0, "Hapus data dulu");

        p.hasRented = true;
        p.rentEndTime = block.timestamp + RENTAL_DAYS;

        emit RentPurchased(msg.sender, p.rentEndTime);
    }

    // ============================================================
    // FUNGSI: PASANG TEBakan (NAIK / TURUN)
    // direction: true = NAIK, false = TURUN
    // ============================================================
    function placeBet(bool direction) external {
        Player storage p = players[msg.sender];

        // Cek rental aktif
        require(p.hasRented, "Sewa dulu 1 MON");
        require(block.timestamp < p.rentEndTime, "Rental expired");

        // Cek waiting period
        require(block.timestamp >= p.waitingUntil, "Masih masa tunggu");

        // Cek tidak ada bet aktif
        require(!p.hasActiveBet, "Selesaikan bet dulu");

        // Handle bet expired (absen)
        _checkAndExpire(msg.sender);

        uint256 price = _getBTCPrice();

        uint256 day = p.currentDay;
        if (day == 0) day = 1;
        if (day > 30) day = 30;

        uint256 duration = durationSec[day - 1];
        uint256 endTime = block.timestamp + duration;

        p.hasActiveBet = true;
        p.betDirection = direction;
        p.betStartPrice = price;
        p.betEndTime = endTime;

        emit BetPlaced(msg.sender, day, direction, price, endTime);
    }

    // ============================================================
    // FUNGSI: CEK HASIL TEBakan
    // ============================================================
    function resolveBet() external {
        Player storage p = players[msg.sender];
        require(p.hasActiveBet, "Tidak ada bet aktif");

        uint256 currentPrice = _getBTCPrice();
        uint256 diff;
        if (currentPrice >= p.betStartPrice) {
            diff = currentPrice - p.betStartPrice;
        } else {
            diff = p.betStartPrice - currentPrice;
        }

        uint256 percent = (diff * 10000) / p.betStartPrice;
        bool priceMoved = percent >= 50; // >= 0.5%

        bool won = (p.betDirection && currentPrice > p.betStartPrice) ||
                   (!p.betDirection && currentPrice < p.betStartPrice);

        bool isWin = won && priceMoved;

        p.hasActiveBet = false;

        if (isWin) {
            uint256 day = p.currentDay;
            uint256 rewardWei = (rewardIDR[day - 1] * 1e18) / idrPerMon;

            if (address(this).balance >= rewardWei) {
                (bool sent, ) = msg.sender.call{value: rewardWei}("");
                require(sent, "Transfer gagal");
                emit BetWon(msg.sender, day, rewardWei);
            } else {
                p.pendingReward += rewardWei;
                emit BetWon(msg.sender, day, rewardWei);
            }

            // ========================================
            // CEK: DAY 30 SELESAI?
            // ========================================
            if (day == 30) {
                // Bonus 10 MON
                uint256 bonusWei = BONUS_30_DAY;
                if (address(this).balance >= bonusWei) {
                    (bool sent, ) = msg.sender.call{value: bonusWei}("");
                    if (sent) {
                        emit Day30Completed(msg.sender, bonusWei);
                        // Reset — user harus sewa lagi
                        p.currentDay = 0;
                        p.hasRented = false;
                        p.rentEndTime = 0;
                        return;
                    }
                }
                // Saldo kurang — still give day 30 reward + pending bonus
                p.pendingReward += bonusWei;
                emit Day30Completed(msg.sender, bonusWei);
                p.currentDay = 0;
                p.hasRented = false;
                p.rentEndTime = 0;
                return;
            }

            // Lanjut hari berikutnya
            if (p.currentDay < 30) {
                p.currentDay++;
            }

        } else {
            // LOSE — reset ke day 1 + waiting
            uint256 lostDay = p.currentDay;
            uint256 waitDuration = durationSec[lostDay - 1];
            p.currentDay = 1;
            p.waitingUntil = block.timestamp + waitDuration;

            emit BetLost(msg.sender, lostDay);
        }
    }

    // ============================================================
    // FUNGSI: KLAIM HADIAH PENDING
    // ============================================================
    function claimPendingReward() external {
        Player storage p = players[msg.sender];
        uint256 reward = p.pendingReward;
        require(reward > 0, "Tidak ada hadiah pending");
        require(address(this).balance >= reward, "Saldo kontrak kurang");

        p.pendingReward = 0;
        (bool sent, ) = msg.sender.call{value: reward}("");
        require(sent, "Transfer gagal");

        emit RewardClaimed(msg.sender, reward);
    }

    // ============================================================
    // FUNGSI: AMBIL BALIK DEPOSIT (after rental expires)
    // ============================================================
    function withdrawRent() external {
        Player storage p = players[msg.sender];
        require(p.hasRented, "Tidak ada deposit");
        require(p.currentDay == 0 || block.timestamp >= p.rentEndTime, "Rental masih aktif");

        uint256 amount = RENTAL_FEE;
        p.hasRented = false;
        p.rentEndTime = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Transfer gagal");

        emit RentWithdrawn(msg.sender, amount);
    }

    // ============================================================
    // FUNGSI INTERNAL: Handle absen (bet expired)
    // ============================================================
    function _checkAndExpire(address player) internal {
        Player storage p = players[player];
        if (!p.hasActiveBet) return;
        if (block.timestamp < p.betEndTime) return;

        // Absen = LOSE
        p.hasActiveBet = false;
        uint256 lostDay = p.currentDay;
        uint256 waitDuration = durationSec[lostDay - 1];

        p.currentDay = 1;
        p.waitingUntil = block.timestamp + waitDuration;

        emit BetLost(player, lostDay);
    }

    // ============================================================
    // FUNGSI VIEW: Baca data lengkap player
    // ============================================================
    function getPlayerData(address player) external view returns (
        bool hasRented,
        uint256 rentEndTime,
        uint256 currentDay,
        bool hasActiveBet,
        bool betDirection,
        uint256 betStartPrice,
        uint256 betEndTime,
        uint256 pendingReward,
        uint256 waitingUntil,
        uint256 nextDuration,
        uint256 nextRewardIDR
    ) {
        Player storage p = players[player];
        hasRented = p.hasRented;
        rentEndTime = p.rentEndTime;
        currentDay = p.currentDay;
        hasActiveBet = p.hasActiveBet;
        betDirection = p.betDirection;
        betStartPrice = p.betStartPrice;
        betEndTime = p.betEndTime;
        pendingReward = p.pendingReward;
        waitingUntil = p.waitingUntil;

        uint256 day = (currentDay == 0) ? 1 : currentDay;
        if (day > 30) day = 30;
        nextDuration = durationSec[day - 1];
        nextRewardIDR = rewardIDR[day - 1];
    }

    function getBTCPrice() external view returns (int256) {
        return int256(_getBTCPrice());
    }

    function getRentFee() external pure returns (uint256) {
        return RENTAL_FEE;
    }

    function getBonus30Day() external pure returns (uint256) {
        return BONUS_30_DAY;
    }

    // ============================================================
    // FUNGSI OWNER
    // ============================================================
    function setIdrPerMon(uint256 _rate) external onlyOwner {
        require(_rate > 0, "Rate harus positif");
        idrPerMon = _rate;
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
