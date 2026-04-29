// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ============================================================
// BTCOraclePredictorV2.sol — Rental + Accumulated Reward Game
// 3 ARAH: TURUN(0), SAMA(1), NAIK(2)
// ============================================================
// MEKANISME:
// 1. Pemain deposit 0.01 MON → langsung ke OWNER (biaya sewa 30 hari)
// 2. Owner isi wallet kontrak sebagai house pool reward
// 3. Pemain klik NAIK ▲ / SAMA ➡️ / TURUN ▼ → harga BTC disimpan
// 4. Setelah durasi → CEK HASIL:
//    - NAIK → BTC naik ≥ 0.001% → reward + maju step
//    - TURUN → BTC turun ≥ 0.001% → reward + maju step
//    - SAMA → BTC diam < 0.001% → reward + maju step
//    - SALAH arah → reset ke step 1 (deposit SUDAH di-owner)
// 5. Reward di-akumulasi per pemain
// 6. Klaim reward bisa dilakukan saat total reward >= 1 MON
// 7. Owner TIDAK bisa main (alamat owner diblokir)
// ============================================================

contract BTCOraclePredictorV2 {
    address public owner;

    uint256 public constant RENTAL_FEE = 1e16;       // 0.01 MON
    uint256 public constant DAYS_TO_SECS = 86400;     // 1 hari
    uint256 public constant MIN_CLAIM = 1e18;          // Minimal klaim 1 MON
    int8    public constant DIR_TURUN = 0;
    int8    public constant DIR_SAMA  = 1;
    int8    public constant DIR_NAIK  = 2;

    // Total 30 hari (2592000 detik):
    // Step 1=30s, Step 2=1m, Step 3=5m, Step 4=30m, Step 5=2h, Step 6=10h,
    // Step 7=2d, Step 8=6d, Step 9=10d, Step 10=11.47d
    uint256[] public stepDurations = [
        30, 60, 300, 1800, 7200, 36000,
        172800, 518400, 864000, 985410
    ];

    // Reward per step (wei MON)
    // Geometric progression: r=2, a0=0.0001 MON
    // Total: 0.1023 MON (1023% of 0.01 MON rental fee)
    // Step1=0.0001, Step2=0.0002, Step3=0.0004, Step4=0.0008, Step5=0.0016
    // Step6=0.0032, Step7=0.0064, Step8=0.0128, Step9=0.0256, Step10=0.0512
    uint256[] public stepRewards = [
        100000000000000,    // 0.0001 MON
        200000000000000,    // 0.0002 MON
        400000000000000,    // 0.0004 MON
        800000000000000,    // 0.0008 MON
        1600000000000000,   // 0.0016 MON
        3200000000000000,   // 0.0032 MON
        6400000000000000,   // 0.0064 MON
        12800000000000000,  // 0.0128 MON
        25600000000000000,  // 0.0256 MON
        51200000000000000   // 0.0512 MON
    ];

    struct Player {
        bool hasRented;
        uint256 rentEndTime;
        uint256 currentStep;
        bool hasActiveBet;
        int8 betDirection;        // 0=TURUN, 1=SAMA, 2=NAIK
        uint256 betStartPrice;
        uint256 betEndTime;
        uint256 withdrawable;
        uint256 totalAccumulated;
        uint256 waitingUntil;
    }

    mapping(address => Player) public players;

    event RentPurchased(address indexed player, uint256 endTime, uint256 daysAdded);
    event RentExtended(address indexed player, uint256 newEndTime, uint256 daysAdded);
    event BetPlaced(address indexed player, uint256 step, int8 direction, uint256 startPrice, uint256 endTime);
    event BetWon(address indexed player, uint256 step, int8 winDirection, uint256 reward);
    event BetLost(address indexed player, uint256 lostStep, int8 wrongDirection);
    event RewardClaimed(address indexed player, uint256 amount);
    event HouseFunded(address indexed funder, uint256 amount);
    event RewardAdded(address indexed player, uint256 amount);
    event StepReset(address indexed player, uint256 resetStep, uint256 rewardCycle);
    event StepAdvanced(address indexed player, uint256 newStep, uint256 reward);

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya owner");
        _;
    }

    modifier notOwner() {
        require(msg.sender != owner, "Owner tidak bisa bermain");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ============================================================
    // FUNGSI: SEWA
    // ============================================================
    function rentSystem() external payable notOwner {
        require(msg.value >= RENTAL_FEE, "Min 0.01 MON");
        require(msg.value % RENTAL_FEE == 0, "Harus kelipatan 0.01 MON");

        uint256 daysToAdd = (msg.value / RENTAL_FEE) * 30;
        Player storage p = players[msg.sender];

        if (!p.hasRented) {
            p.hasRented = true;
            p.rentEndTime = block.timestamp + (daysToAdd * DAYS_TO_SECS);
            emit RentPurchased(msg.sender, p.rentEndTime, daysToAdd);
        } else {
            uint256 baseTime = block.timestamp >= p.rentEndTime
                ? block.timestamp
                : p.rentEndTime;
            p.rentEndTime = baseTime + (daysToAdd * DAYS_TO_SECS);
            emit RentExtended(msg.sender, p.rentEndTime, daysToAdd);
        }

        (bool sent, ) = owner.call{value: msg.value}("");
        require(sent, "Transfer ke owner gagal");
    }

    // ============================================================
    // FUNGSI: PASANG TEBakan
    // direction: 0=TURUN, 1=SAMA, 2=NAIK
    // ============================================================
    function placeBet(int8 direction, uint256 startPrice) external notOwner {
        require(direction == DIR_TURUN || direction == DIR_SAMA || direction == DIR_NAIK, "Arah tidak valid");

        Player storage p = players[msg.sender];
        require(p.hasRented, "Sewa dulu");
        require(block.timestamp < p.rentEndTime, "Rental expired");
        require(
            p.waitingUntil == 0 || block.timestamp >= p.waitingUntil,
            "Masih masa tunggu"
        );
        require(!p.hasActiveBet, "Selesaikan bet dulu");
        require(startPrice > 0, "Harga tidak valid");

        uint256 step = p.currentStep;
        if (step > 9) step = 9;

        uint256 endTime = block.timestamp + stepDurations[step];

        p.hasActiveBet = true;
        p.betDirection = direction;
        p.betStartPrice = startPrice;
        p.betEndTime = endTime;

        emit BetPlaced(msg.sender, step + 1, direction, startPrice, endTime);
    }

    // ============================================================
    // FUNGSI: CEK HASIL
    // NAIK(2) → current > start + 0.001%
    // TURUN(0) → current < start - 0.001%
    // SAMA(1)  → |diff| < 0.001%
    // SALAH arah → reset step 1
    // ============================================================
    function resolveBet(uint256 currentPrice) external notOwner {
        Player storage p = players[msg.sender];
        require(p.hasActiveBet, "Tidak ada bet aktif");

        p.hasActiveBet = false;

        uint256 diff = currentPrice >= p.betStartPrice
            ? currentPrice - p.betStartPrice
            : p.betStartPrice - currentPrice;

        uint256 percent = (diff * 10000) / p.betStartPrice;
        bool priceMoved = percent >= 1; // >= 0.001%

        int8 betDir = p.betDirection;
        bool won = false;
        bool isDraw = false;

        if (betDir == DIR_SAMA) {
            // SAMA menang jika harga PERSIS SAMA (diff = 0) — tidak dapat reward, tetap step
            won = diff == 0;
            isDraw = !won;
        } else if (betDir == DIR_NAIK) {
            // NAIK menang jika harga naik >= 0.001%
            won = currentPrice > p.betStartPrice && priceMoved;
        } else {
            // TURUN menang jika harga turun >= 0.001%
            won = currentPrice < p.betStartPrice && priceMoved;
        }

        if (won) {
            // MENANG: dapat reward + maju step
            uint256 step = p.currentStep;
            if (step > 9) step = 9;
            uint256 rewardWei = stepRewards[step];

            p.withdrawable += rewardWei;
            p.totalAccumulated += rewardWei;

            emit RewardAdded(msg.sender, rewardWei);
            emit BetWon(msg.sender, step + 1, betDir, rewardWei);

            if (step >= 9) {
                p.currentStep = 0;
                emit StepReset(msg.sender, 1, rewardWei);
            } else {
                p.currentStep = step + 1;
                emit StepAdvanced(msg.sender, step + 2, rewardWei);
            }
        } else if (isDraw) {
            // SERI (SAMA dipilih tapi harga bergerak) — tidak reward, TIDAK reset, tetap di step ini
            p.currentStep = p.currentStep; // tetap
            emit BetLost(msg.sender, p.currentStep + 1, betDir); // gunakan BetLost utk tracking saja
        } else {
            // KALAH: arah salah → reset step 1
            p.currentStep = 0;
            p.waitingUntil = block.timestamp + 5;
            emit BetLost(msg.sender, 1, betDir);
        }
    }

    // ============================================================
    // FUNGSI: KLAIM REWARD (minimal 1 MON)
    // ============================================================
    function claimReward() external notOwner {
        Player storage p = players[msg.sender];
        uint256 amount = p.withdrawable;

        require(amount >= MIN_CLAIM, "Reward belum capai min 1 MON");
        require(address(this).balance >= amount, "House pool kosong");

        p.withdrawable = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Transfer gagal");

        emit RewardClaimed(msg.sender, amount);
    }

    // ============================================================
    // FUNGSI OWNER: Isi house pool
    // ============================================================
    function fundHousePool() external payable onlyOwner {
        require(msg.value > 0, "Harus kirim MON");
        emit HouseFunded(msg.sender, msg.value);
    }

    // ============================================================
    // FUNGSI VIEW: Baca data player
    // ============================================================
    function getPlayerData(address player) external view returns (
        bool hasRented,
        uint256 rentEndTime,
        uint256 remainingDays,
        uint256 currentStep,
        bool hasActiveBet,
        int8 betDirection,
        uint256 betStartPrice,
        uint256 betEndTime,
        uint256 withdrawable,
        uint256 totalAccumulated,
        uint256 waitingUntil,
        uint256 nextDuration,
        uint256 nextRewardWei,
        bool isExpiringSoon
    ) {
        hasRented = players[player].hasRented;
        currentStep = players[player].currentStep;
        hasActiveBet = players[player].hasActiveBet;
        betDirection = players[player].betDirection;
        betStartPrice = players[player].betStartPrice;
        betEndTime = players[player].betEndTime;
        withdrawable = players[player].withdrawable;
        totalAccumulated = players[player].totalAccumulated;
        waitingUntil = players[player].waitingUntil;
        rentEndTime = players[player].rentEndTime;

        uint256 step = currentStep;
        if (step > 9) step = 9;
        nextDuration = stepDurations[step];
        nextRewardWei = stepRewards[step];

        uint256 _now = block.timestamp;
        uint256 end = players[player].rentEndTime;
        bool rented = players[player].hasRented;
        if (rented && end > _now) {
            remainingDays = (end - _now) / DAYS_TO_SECS + 1;
            isExpiringSoon = (end - _now) <= 2 days;
        }
    }

    // ============================================================
    // FUNGSI VIEW: Cek apakah owner
    // ============================================================
    function isOwner(address addr) external view returns (bool) {
        return addr == owner;
    }

    receive() external payable {}
}
