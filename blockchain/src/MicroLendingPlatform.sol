// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MicroLendingPlatform
 * @dev A production-ready micro lending platform for BlockDAG network
 * @author BlockDAG Development Team
 */
contract MicroLendingPlatform is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // =============================================================
    //                          CONSTANTS
    // =============================================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 public constant PLATFORM_FEE_BASIS_POINTS = 100; // 1%
    uint256 public constant MAX_INTEREST_RATE = 3000; // 30% max interest
    uint256 public constant MIN_LOAN_DURATION = 1 days;
    uint256 public constant MAX_LOAN_DURATION = 365 days;
    uint256 public constant MIN_LOAN_AMOUNT = 1e18; // 1 BDAG
    uint256 public constant MAX_LOAN_AMOUNT = 1000000e18; // 1M BDAG
    uint256 public constant LIQUIDATION_THRESHOLD = 12000; // 120% collateral ratio
    uint256 public constant GRACE_PERIOD = 24 hours;
    uint256 public constant BASIS_POINTS = 10000;

    // =============================================================
    //                            ENUMS
    // =============================================================

    enum LoanStatus {
        REQUESTED, // 0 - Loan created, awaiting funding
        FUNDED, // 1 - Loan funded, active
        REPAID, // 2 - Loan successfully repaid
        DEFAULTED, // 3 - Loan defaulted, collateral claimed
        CANCELLED, // 4 - Loan cancelled by borrower
        LIQUIDATED // 5 - Loan liquidated due to collateral issues
    }

    // =============================================================
    //                           STRUCTS
    // =============================================================

    struct LoanRequest {
        uint256 amount; // Loan amount in BDAG
        uint256 interestRate; // Interest rate in basis points
        uint256 duration; // Loan duration in seconds
        uint256 collateralAmount; // Collateral amount in BDAG
        string purpose; // Loan purpose for transparency
    }

    struct Loan {
        address borrower; // Borrower address
        address lender; // Lender address (zero if not funded)
        uint256 amount; // Principal amount
        uint256 interestRate; // Interest rate in basis points
        uint256 duration; // Loan duration in seconds
        uint256 startTime; // Timestamp when funded
        uint256 collateralAmount; // Collateral amount locked
        LoanStatus status; // Current loan status
        uint256 repaidAmount; // Amount repaid so far
        bool isPartiallyRepaid; // Flag for partial repayments
        string purpose; // Loan purpose
    }

    struct LenderInfo {
        uint256 totalLent; // Total amount lent
        uint256 activeLends; // Number of active lends
        uint256 totalEarned; // Total interest earned
        bool isVerified; // KYC verification status
        uint256 reputationScore; // Lender reputation (0-1000)
    }

    struct BorrowerInfo {
        uint256 totalBorrowed; // Total amount borrowed
        uint256 activeLoans; // Number of active loans
        uint256 successfulLoans; // Number of successful repayments
        uint256 defaultedLoans; // Number of defaulted loans
        bool isVerified; // KYC verification status
        uint256 creditScore; // Credit score (0-1000)
    }

    // =============================================================
    //                        STATE VARIABLES
    // =============================================================

    IERC20 public immutable bdagToken;
    address public treasury;

    uint256 public loanCounter;
    uint256 public totalSupply; // Total BDAG in the platform
    uint256 public totalBorrowed; // Total active borrowed amount
    uint256 public totalCollateral; // Total collateral locked
    uint256 public liquidityRatio; // Current liquidity ratio (basis points)

    // Mappings
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    mapping(address => uint256[]) public userLends;
    mapping(address => BorrowerInfo) public borrowers;
    mapping(address => LenderInfo) public lenders;
    mapping(address => bool) public blacklisted;

    // Risk management
    uint256 public maxUtilizationRate = 8500; // 85% max utilization
    uint256 public emergencyReserve = 1000; // 10% emergency reserve
    bool public liquidityEmergency = false;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 collateralAmount,
        string purpose
    );

    event LoanFunded(
        uint256 indexed loanId,
        address indexed lender,
        uint256 amount
    );

    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        bool isFullRepayment
    );

    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralClaimed
    );

    event LoanCancelled(uint256 indexed loanId, address indexed borrower);

    event LoanLiquidated(
        uint256 indexed loanId,
        address indexed liquidator,
        uint256 collateralAmount
    );

    event CollateralDeposited(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );

    event EmergencyWithdraw(address indexed user, uint256 amount);

    event UserVerified(address indexed user, bool isVerified);

    event LiquidityEmergencyToggled(bool status);

    // =============================================================
    //                        CUSTOM ERRORS
    // =============================================================

    error InvalidAmount();
    error InvalidDuration();
    error InvalidInterestRate();
    error InvalidCollateralAmount();
    error InsufficientCollateral();
    error LoanNotFound();
    error NotBorrower();
    error NotLender();
    error LoanNotActive();
    error LoanNotFunded();
    error LoanAlreadyFunded();
    error SelfFunding();
    error InsufficientBalance();
    error UserBlacklisted();
    error LiquidityInsufficient();
    error LoanExpired();
    error LoanNotExpired();
    error RepaymentTooEarly();
    error CollateralRatioTooLow();
    error MaxLoansExceeded();
    error UtilizationTooHigh();

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor(address _bdagToken, address _treasury, address _admin) {
        if (
            _bdagToken == address(0) ||
            _treasury == address(0) ||
            _admin == address(0)
        ) {
            revert InvalidAmount();
        }

        bdagToken = IERC20(_bdagToken);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
    }

    // =============================================================
    //                        MODIFIERS
    // =============================================================

    modifier validLoan(uint256 loanId) {
        if (loanId == 0 || loanId > loanCounter) revert LoanNotFound();
        _;
    }

    modifier notBlacklisted(address user) {
        if (blacklisted[user]) revert UserBlacklisted();
        _;
    }

    modifier onlyBorrower(uint256 loanId) {
        if (loans[loanId].borrower != msg.sender) revert NotBorrower();
        _;
    }

    modifier onlyLender(uint256 loanId) {
        if (loans[loanId].lender != msg.sender) revert NotLender();
        _;
    }

    // =============================================================
    //                    EXTERNAL FUNCTIONS
    // =============================================================

    /**
     * @dev Request a new loan
     * @param request Loan request parameters
     */
    function requestLoan(
        LoanRequest calldata request
    ) external nonReentrant whenNotPaused notBlacklisted(msg.sender) {
        // Validate loan parameters
        if (
            request.amount < MIN_LOAN_AMOUNT || request.amount > MAX_LOAN_AMOUNT
        ) {
            revert InvalidAmount();
        }
        if (
            request.duration < MIN_LOAN_DURATION ||
            request.duration > MAX_LOAN_DURATION
        ) {
            revert InvalidDuration();
        }
        if (request.interestRate > MAX_INTEREST_RATE) {
            revert InvalidInterestRate();
        }
        if (
            request.collateralAmount < _calculateMinCollateral(request.amount)
        ) {
            revert InvalidCollateralAmount();
        }

        // Check borrower limits
        BorrowerInfo storage borrower = borrowers[msg.sender];
        if (borrower.activeLoans >= 5) revert MaxLoansExceeded();

        // Check platform utilization
        uint256 newUtilization = _calculateUtilizationRate(request.amount);
        if (newUtilization > maxUtilizationRate) revert UtilizationTooHigh();

        // Transfer and lock collateral
        bdagToken.safeTransferFrom(
            msg.sender,
            address(this),
            request.collateralAmount
        );

        // Create loan
        loanCounter++;
        loans[loanCounter] = Loan({
            borrower: msg.sender,
            lender: address(0),
            amount: request.amount,
            interestRate: request.interestRate,
            duration: request.duration,
            startTime: 0,
            collateralAmount: request.collateralAmount,
            status: LoanStatus.REQUESTED,
            repaidAmount: 0,
            isPartiallyRepaid: false,
            purpose: request.purpose
        });

        // Update state
        userLoans[msg.sender].push(loanCounter);
        borrower.activeLoans++;
        totalCollateral += request.collateralAmount;

        emit LoanRequested(
            loanCounter,
            msg.sender,
            request.amount,
            request.interestRate,
            request.collateralAmount,
            request.purpose
        );
    }

    /**
     * @dev Fund a loan request
     * @param loanId The loan ID to fund
     */
    function fundLoan(
        uint256 loanId
    )
        external
        nonReentrant
        whenNotPaused
        notBlacklisted(msg.sender)
        validLoan(loanId)
    {
        Loan storage loan = loans[loanId];

        if (loan.status != LoanStatus.REQUESTED) revert LoanAlreadyFunded();
        if (loan.borrower == msg.sender) revert SelfFunding();

        // Check lender balance
        if (bdagToken.balanceOf(msg.sender) < loan.amount)
            revert InsufficientBalance();

        // Transfer loan amount from lender
        bdagToken.safeTransferFrom(msg.sender, address(this), loan.amount);

        // Update loan
        loan.lender = msg.sender;
        loan.startTime = block.timestamp;
        loan.status = LoanStatus.FUNDED;

        // Update state
        userLends[msg.sender].push(loanId);
        borrowers[loan.borrower].totalBorrowed += loan.amount;
        lenders[msg.sender].totalLent += loan.amount;
        lenders[msg.sender].activeLends++;
        totalBorrowed += loan.amount;

        // Transfer loan amount to borrower (minus platform fee)
        uint256 platformFee = (loan.amount * PLATFORM_FEE_BASIS_POINTS) /
            BASIS_POINTS;
        uint256 amountToBorrower = loan.amount - platformFee;

        bdagToken.safeTransfer(loan.borrower, amountToBorrower);
        bdagToken.safeTransfer(treasury, platformFee);

        emit LoanFunded(loanId, msg.sender, loan.amount);
    }

    /**
     * @dev Repay a loan (full or partial)
     * @param loanId The loan ID to repay
     * @param amount The amount to repay
     */
    function repayLoan(
        uint256 loanId,
        uint256 amount
    )
        external
        nonReentrant
        whenNotPaused
        validLoan(loanId)
        onlyBorrower(loanId)
    {
        Loan storage loan = loans[loanId];

        if (loan.status != LoanStatus.FUNDED) revert LoanNotFunded();
        if (block.timestamp > loan.startTime + loan.duration + GRACE_PERIOD) {
            revert LoanExpired();
        }
        if (amount == 0) revert InvalidAmount();

        uint256 totalOwed = calculateTotalRepayment(loanId);
        uint256 remainingDebt = totalOwed - loan.repaidAmount;

        if (amount > remainingDebt) {
            amount = remainingDebt;
        }

        // Transfer repayment from borrower
        bdagToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update loan
        loan.repaidAmount += amount;
        bool isFullRepayment = loan.repaidAmount >= totalOwed;

        if (isFullRepayment) {
            loan.status = LoanStatus.REPAID;

            // Update borrower stats
            BorrowerInfo storage borrower = borrowers[msg.sender];
            borrower.activeLoans--;
            borrower.successfulLoans++;
            borrower.creditScore = Math.min(borrower.creditScore + 10, 1000);

            // Update lender stats
            LenderInfo storage lender = lenders[loan.lender];
            lender.activeLends--;
            lender.totalEarned += (loan.repaidAmount - loan.amount);
            lender.reputationScore = Math.min(lender.reputationScore + 5, 1000);

            // Return collateral to borrower
            bdagToken.safeTransfer(msg.sender, loan.collateralAmount);
            totalCollateral -= loan.collateralAmount;
            totalBorrowed -= loan.amount;
        } else {
            loan.isPartiallyRepaid = true;
        }

        // Distribute repayment
        _distributeRepayment(loan.lender, amount);

        emit LoanRepaid(loanId, msg.sender, amount, isFullRepayment);
    }

    /**
     * @dev Default a loan (callable by anyone after expiration)
     * @param loanId The loan ID to default
     */
    function defaultLoan(
        uint256 loanId
    ) external nonReentrant validLoan(loanId) {
        Loan storage loan = loans[loanId];

        if (loan.status != LoanStatus.FUNDED) revert LoanNotFunded();
        if (block.timestamp <= loan.startTime + loan.duration + GRACE_PERIOD) {
            revert LoanNotExpired();
        }

        loan.status = LoanStatus.DEFAULTED;

        // Update borrower stats (penalty)
        BorrowerInfo storage borrower = borrowers[loan.borrower];
        borrower.activeLoans--;
        borrower.defaultedLoans++;
        borrower.creditScore = borrower.creditScore > 100
            ? borrower.creditScore - 100
            : 0;

        // Update lender stats
        LenderInfo storage lender = lenders[loan.lender];
        lender.activeLends--;

        // Transfer collateral to lender
        bdagToken.safeTransfer(loan.lender, loan.collateralAmount);
        totalCollateral -= loan.collateralAmount;
        totalBorrowed -= loan.amount;

        emit LoanDefaulted(loanId, loan.borrower, loan.collateralAmount);
    }

    /**
     * @dev Cancel a loan request (only before funding)
     * @param loanId The loan ID to cancel
     */
    function cancelLoan(
        uint256 loanId
    ) external nonReentrant validLoan(loanId) onlyBorrower(loanId) {
        Loan storage loan = loans[loanId];

        if (loan.status != LoanStatus.REQUESTED) revert LoanNotFound();

        loan.status = LoanStatus.CANCELLED;

        // Return collateral to borrower
        bdagToken.safeTransfer(msg.sender, loan.collateralAmount);
        totalCollateral -= loan.collateralAmount;
        borrowers[msg.sender].activeLoans--;

        emit LoanCancelled(loanId, msg.sender);
    }

    /**
     * @dev Liquidate an undercollateralized loan
     * @param loanId The loan ID to liquidate
     */
    function liquidateLoan(
        uint256 loanId
    ) external nonReentrant validLoan(loanId) {
        Loan storage loan = loans[loanId];

        if (loan.status != LoanStatus.FUNDED) revert LoanNotFunded();

        uint256 collateralRatio = _calculateCollateralRatio(loanId);
        if (collateralRatio >= LIQUIDATION_THRESHOLD)
            revert CollateralRatioTooLow();

        loan.status = LoanStatus.LIQUIDATED;

        // Calculate liquidation bonus (5% of collateral)
        uint256 liquidationBonus = (loan.collateralAmount * 500) / BASIS_POINTS;
        uint256 remainingCollateral = loan.collateralAmount - liquidationBonus;

        // Update state
        BorrowerInfo storage borrower = borrowers[loan.borrower];
        borrower.activeLoans--;
        borrower.defaultedLoans++;
        borrower.creditScore = borrower.creditScore > 150
            ? borrower.creditScore - 150
            : 0;

        LenderInfo storage lender = lenders[loan.lender];
        lender.activeLends--;

        // Distribute collateral
        bdagToken.safeTransfer(msg.sender, liquidationBonus); // Liquidator reward
        bdagToken.safeTransfer(loan.lender, remainingCollateral);

        totalCollateral -= loan.collateralAmount;
        totalBorrowed -= loan.amount;

        emit LoanLiquidated(loanId, msg.sender, loan.collateralAmount);
    }

    // =============================================================
    //                    VIEW FUNCTIONS
    // =============================================================

    /**
     * @dev Calculate total repayment amount for a loan
     * @param loanId The loan ID
     * @return Total amount to repay including interest and fees
     */
    function calculateTotalRepayment(
        uint256 loanId
    ) public view validLoan(loanId) returns (uint256) {
        Loan memory loan = loans[loanId];
        uint256 interest = (loan.amount * loan.interestRate) / BASIS_POINTS;
        return loan.amount + interest;
    }

    /**
     * @dev Get user's loan IDs
     * @param user The user address
     * @return Array of loan IDs
     */
    function getUserLoans(
        address user
    ) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    /**
     * @dev Get user's lend IDs
     * @param user The user address
     * @return Array of loan IDs where user is the lender
     */
    function getUserLends(
        address user
    ) external view returns (uint256[] memory) {
        return userLends[user];
    }

    /**
     * @dev Get platform statistics
     * @return totalLoans Total number of loans
     * @return totalBorrowedAmount Total amount currently borrowed
     * @return totalCollateralLocked Total collateral locked in the platform
     * @return utilizationRate Current utilization rate in basis points
     * @return emergencyStatus Whether liquidity emergency is active
     */
    function getPlatformStats()
        external
        view
        returns (
            uint256 totalLoans,
            uint256 totalBorrowedAmount,
            uint256 totalCollateralLocked,
            uint256 utilizationRate,
            bool emergencyStatus
        )
    {
        return (
            loanCounter,
            totalBorrowed,
            totalCollateral,
            liquidityRatio,
            liquidityEmergency
        );
    }

    // =============================================================
    //                    ADMIN FUNCTIONS
    // =============================================================

    /**
     * @dev Toggle blacklist status for a user
     * @param user The user address
     * @param status Blacklist status
     */
    function setBlacklist(
        address user,
        bool status
    ) external onlyRole(ADMIN_ROLE) {
        blacklisted[user] = status;
    }

    /**
     * @dev Verify a user for KYC
     * @param user The user address
     * @param isVerified Verification status
     */
    function verifyUser(
        address user,
        bool isVerified
    ) external onlyRole(OPERATOR_ROLE) {
        borrowers[user].isVerified = isVerified;
        lenders[user].isVerified = isVerified;
        emit UserVerified(user, isVerified);
    }

    /**
     * @dev Emergency pause/unpause
     */
    function togglePause() external onlyRole(ADMIN_ROLE) {
        if (paused()) {
            _unpause();
        } else {
            _pause();
        }
    }

    /**
     * @dev Set maximum utilization rate
     * @param _maxUtilizationRate New max utilization rate in basis points
     */
    function setMaxUtilizationRate(
        uint256 _maxUtilizationRate
    ) external onlyRole(ADMIN_ROLE) {
        require(_maxUtilizationRate <= BASIS_POINTS, "Invalid rate");
        maxUtilizationRate = _maxUtilizationRate;
    }

    /**
     * @dev Update treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    // =============================================================
    //                   INTERNAL FUNCTIONS
    // =============================================================

    /**
     * @dev Calculate minimum required collateral
     * @param loanAmount The loan amount
     * @return Minimum collateral required
     */
    function _calculateMinCollateral(
        uint256 loanAmount
    ) internal pure returns (uint256) {
        return (loanAmount * LIQUIDATION_THRESHOLD) / BASIS_POINTS;
    }

    /**
     * @dev Calculate current collateral ratio for a loan
     * @param loanId The loan ID
     * @return Collateral ratio in basis points
     */
    function _calculateCollateralRatio(
        uint256 loanId
    ) internal view returns (uint256) {
        Loan memory loan = loans[loanId];
        uint256 outstandingDebt = calculateTotalRepayment(loanId) -
            loan.repaidAmount;
        return (loan.collateralAmount * BASIS_POINTS) / outstandingDebt;
    }

    /**
     * @dev Calculate utilization rate after a new loan
     * @param newLoanAmount The new loan amount
     * @return New utilization rate in basis points
     */
    function _calculateUtilizationRate(
        uint256 newLoanAmount
    ) internal view returns (uint256) {
        uint256 totalLiquidity = bdagToken.balanceOf(address(this)) +
            totalBorrowed;
        if (totalLiquidity == 0) return 0;
        return
            ((totalBorrowed + newLoanAmount) * BASIS_POINTS) / totalLiquidity;
    }

    /**
     * @dev Distribute loan repayment
     * @param lender The lender address
     * @param amount The repayment amount
     */
    function _distributeRepayment(address lender, uint256 amount) internal {
        bdagToken.safeTransfer(lender, amount);
    }
}
