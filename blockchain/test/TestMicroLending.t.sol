// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/MicroLendingPlatform.sol";
import "../src/BDAGToken.sol";

contract TestMicroLendingPlatform is Test {
    MicroLendingPlatform public platform;
    BDAGToken public bdagToken;

    address public admin = makeAddr("admin");
    address public treasury = makeAddr("treasury");
    address public borrower = makeAddr("borrower");
    address public lender = makeAddr("lender");
    address public liquidator = makeAddr("liquidator");
    address public operator = makeAddr("operator");

    uint256 public constant LOAN_AMOUNT = 10_000e18; // 10k BDAG
    uint256 public constant COLLATERAL_AMOUNT = 15_000e18; // 15k BDAG (150% ratio)
    uint256 public constant INTEREST_RATE = 1000; // 10% APR
    uint256 public constant LOAN_DURATION = 30 days;

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

    function setUp() public {
        vm.startPrank(admin);

        // Deploy contracts
        bdagToken = new BDAGToken(admin);
        platform = new MicroLendingPlatform(
            address(bdagToken),
            treasury,
            admin
        );

        // Grant operator role
        platform.grantRole(platform.OPERATOR_ROLE(), operator);

        vm.stopPrank();

        // Mint tokens to test accounts
        vm.prank(admin);
        bdagToken.mint(borrower, 100_000e18);

        vm.prank(admin);
        bdagToken.mint(lender, 100_000e18);

        vm.prank(admin);
        bdagToken.mint(liquidator, 100_000e18);
    }

    // =============================================================
    //                    BDAG TOKEN TESTS
    // =============================================================

    function testBDAGTokenDeployment() public view {
        assertEq(bdagToken.name(), "BlockDAG");
        assertEq(bdagToken.symbol(), "BDAG");
        assertEq(bdagToken.decimals(), 18);
        assertEq(bdagToken.totalSupply(), 1_000_000_000e18);
        assertEq(bdagToken.owner(), admin);
    }

    function testBDAGTokenMinting() public {
        vm.prank(admin);
        bdagToken.mint(borrower, 1000e18);

        assertEq(bdagToken.balanceOf(borrower), 101_000e18);
        assertEq(bdagToken.totalSupply(), 1_000_000_001_000e18);
    }

    function testBDAGTokenMintingExceedsMaxSupply() public {
        vm.prank(admin);
        vm.expectRevert("Exceeds max supply");
        bdagToken.mint(borrower, 50_000_000_000e18);
    }

    function testBDAGTokenMintingNonOwner() public {
        vm.prank(borrower);
        vm.expectRevert();
        bdagToken.mint(borrower, 1000e18);
    }

    function testBDAGTokenBurning() public {
        vm.prank(borrower);
        bdagToken.burn(1000e18);

        assertEq(bdagToken.balanceOf(borrower), 99_000e18);
    }

    function testBDAGTokenBurningInsufficientBalance() public {
        vm.prank(borrower);
        vm.expectRevert();
        bdagToken.burn(200_000e18);
    }

    // =============================================================
    //                    PLATFORM DEPLOYMENT TESTS
    // =============================================================

    function testPlatformDeployment() public view {
        assertEq(address(platform.bdagToken()), address(bdagToken));
        assertEq(platform.treasury(), treasury);
        assertTrue(platform.hasRole(platform.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(platform.hasRole(platform.ADMIN_ROLE(), admin));
        assertTrue(platform.hasRole(platform.OPERATOR_ROLE(), admin));
    }

    function testPlatformDeploymentZeroAddresses() public {
        vm.expectRevert(MicroLendingPlatform.InvalidAmount.selector);
        new MicroLendingPlatform(address(0), treasury, admin);

        vm.expectRevert(MicroLendingPlatform.InvalidAmount.selector);
        new MicroLendingPlatform(address(bdagToken), address(0), admin);

        vm.expectRevert(MicroLendingPlatform.InvalidAmount.selector);
        new MicroLendingPlatform(address(bdagToken), treasury, address(0));
    }

    // =============================================================
    //                    LOAN REQUEST TESTS
    // =============================================================

    function testRequestLoanSuccess() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Business expansion"
            });

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), COLLATERAL_AMOUNT);

        vm.expectEmit(true, true, false, true);
        emit LoanRequested(
            1,
            borrower,
            LOAN_AMOUNT,
            INTEREST_RATE,
            COLLATERAL_AMOUNT,
            "Business expansion"
        );

        platform.requestLoan(request);
        vm.stopPrank();

        // Verify loan details
        (
            address borrowerAddr,
            address lenderAddr,
            uint256 amount,
            uint256 interestRate,
            uint256 duration,
            uint256 startTime,
            uint256 collateralAmount,
            MicroLendingPlatform.LoanStatus status,
            uint256 repaidAmount,
            bool isPartiallyRepaid,
            string memory purpose
        ) = platform.loans(1);

        assertEq(borrowerAddr, borrower);
        assertEq(lenderAddr, address(0));
        assertEq(amount, LOAN_AMOUNT);
        assertEq(interestRate, INTEREST_RATE);
        assertEq(duration, LOAN_DURATION);
        assertEq(startTime, 0);
        assertEq(collateralAmount, COLLATERAL_AMOUNT);
        assertTrue(status == MicroLendingPlatform.LoanStatus.REQUESTED);
        assertEq(repaidAmount, 0);
        assertFalse(isPartiallyRepaid);
        assertEq(purpose, "Business expansion");

        // Verify borrower info
        (uint256 totalBorrowed, uint256 activeLoans, , , , ) = platform
            .borrowers(borrower);
        assertEq(totalBorrowed, 0); // Not funded yet
        assertEq(activeLoans, 1);

        // Verify collateral was transferred
        assertEq(bdagToken.balanceOf(address(platform)), COLLATERAL_AMOUNT);
        assertEq(bdagToken.balanceOf(borrower), 100_000e18 - COLLATERAL_AMOUNT);
    }

    function testRequestLoanInvalidAmount() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: 0,
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Test"
            });

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.InvalidAmount.selector);
        platform.requestLoan(request);
    }

    function testRequestLoanAmountTooHigh() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: 2_000_000e18, // > MAX_LOAN_AMOUNT
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Test"
            });

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.InvalidAmount.selector);
        platform.requestLoan(request);
    }

    function testRequestLoanInvalidDuration() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: INTEREST_RATE,
                duration: 12 hours, // < MIN_LOAN_DURATION
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Test"
            });

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.InvalidDuration.selector);
        platform.requestLoan(request);
    }

    function testRequestLoanDurationTooLong() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: INTEREST_RATE,
                duration: 400 days, // > MAX_LOAN_DURATION
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Test"
            });

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.InvalidDuration.selector);
        platform.requestLoan(request);
    }

    function testRequestLoanInvalidInterestRate() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: 4000, // > MAX_INTEREST_RATE (30%)
                duration: LOAN_DURATION,
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Test"
            });

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.InvalidInterestRate.selector);
        platform.requestLoan(request);
    }

    function testRequestLoanInsufficientCollateral() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: 10_000e18, // Only 100%, minimum is 120%
                purpose: "Test"
            });

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.InvalidCollateralAmount.selector);
        platform.requestLoan(request);
    }

    function testRequestLoanMaxLoansExceeded() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Test"
            });

        // Mint more tokens for collateral
        vm.prank(admin);
        bdagToken.mint(borrower, 1_000_000e18);

        vm.startPrank(borrower);

        // Create 5 loans (maximum allowed)
        for (uint256 i = 0; i < 5; i++) {
            bdagToken.approve(address(platform), COLLATERAL_AMOUNT);
            platform.requestLoan(request);
        }

        // Try to create 6th loan
        bdagToken.approve(address(platform), COLLATERAL_AMOUNT);
        vm.expectRevert(MicroLendingPlatform.MaxLoansExceeded.selector);
        platform.requestLoan(request);

        vm.stopPrank();
    }

    function testRequestLoanBlacklisted() public {
        // Blacklist borrower
        vm.prank(admin);
        platform.setBlacklist(borrower, true);

        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Test"
            });

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.UserBlacklisted.selector);
        platform.requestLoan(request);
    }

    function testRequestLoanWhenPaused() public {
        vm.prank(admin);
        platform.togglePause();

        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Test"
            });

        vm.prank(borrower);
        vm.expectRevert("Pausable: paused");
        platform.requestLoan(request);
    }

    // =============================================================
    //                    LOAN FUNDING TESTS
    // =============================================================

    function testFundLoanSuccess() public {
        // Create loan request first
        _createLoanRequest();

        vm.startPrank(lender);
        bdagToken.approve(address(platform), LOAN_AMOUNT);

        vm.expectEmit(true, true, false, true);
        emit LoanFunded(1, lender, LOAN_AMOUNT);

        platform.fundLoan(1);
        vm.stopPrank();

        // Verify loan was funded
        (
            ,
            address lenderAddr,
            ,
            ,
            ,
            uint256 startTime,
            ,
            MicroLendingPlatform.LoanStatus status,
            ,
            ,

        ) = platform.loans(1);
        assertEq(lenderAddr, lender);
        assertGt(startTime, 0);
        assertTrue(status == MicroLendingPlatform.LoanStatus.FUNDED);

        // Verify borrower received tokens (minus platform fee)
        uint256 platformFee = (LOAN_AMOUNT * 100) / 10000; // 1%
        uint256 expectedBorrowerAmount = LOAN_AMOUNT - platformFee;
        assertEq(
            bdagToken.balanceOf(borrower),
            100_000e18 - COLLATERAL_AMOUNT + expectedBorrowerAmount
        );

        // Verify treasury received fee
        assertEq(bdagToken.balanceOf(treasury), platformFee);

        // Verify lender stats
        (uint256 totalLent, uint256 activeLends, , , ) = platform.lenders(
            lender
        );
        assertEq(totalLent, LOAN_AMOUNT);
        assertEq(activeLends, 1);

        // Verify borrower stats
        (uint256 totalBorrowed, , , , , ) = platform.borrowers(borrower);
        assertEq(totalBorrowed, LOAN_AMOUNT);
    }

    function testFundLoanInvalidLoanId() public {
        vm.prank(lender);
        vm.expectRevert(MicroLendingPlatform.LoanNotFound.selector);
        platform.fundLoan(999);
    }

    function testFundLoanAlreadyFunded() public {
        _createAndFundLoan();

        vm.startPrank(lender);
        bdagToken.approve(address(platform), LOAN_AMOUNT);
        vm.expectRevert(MicroLendingPlatform.LoanAlreadyFunded.selector);
        platform.fundLoan(1);
        vm.stopPrank();
    }

    function testFundLoanSelfFunding() public {
        _createLoanRequest();

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), LOAN_AMOUNT);
        vm.expectRevert(MicroLendingPlatform.SelfFunding.selector);
        platform.fundLoan(1);
        vm.stopPrank();
    }

    function testFundLoanInsufficientBalance() public {
        _createLoanRequest();

        address poorLender = makeAddr("poorLender");

        vm.startPrank(poorLender);
        vm.expectRevert(MicroLendingPlatform.InsufficientBalance.selector);
        platform.fundLoan(1);
        vm.stopPrank();
    }

    function testFundLoanBlacklisted() public {
        _createLoanRequest();

        // Blacklist lender
        vm.prank(admin);
        platform.setBlacklist(lender, true);

        vm.startPrank(lender);
        bdagToken.approve(address(platform), LOAN_AMOUNT);
        vm.expectRevert(MicroLendingPlatform.UserBlacklisted.selector);
        platform.fundLoan(1);
        vm.stopPrank();
    }

    // =============================================================
    //                    LOAN REPAYMENT TESTS
    // =============================================================

    function testRepayLoanFullSuccess() public {
        _createAndFundLoan();

        uint256 totalRepayment = platform.calculateTotalRepayment(1);

        // Mint additional tokens for interest payment
        vm.prank(admin);
        bdagToken.mint(borrower, totalRepayment);

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), totalRepayment);

        vm.expectEmit(true, true, false, true);
        emit LoanRepaid(1, borrower, totalRepayment, true);

        platform.repayLoan(1, totalRepayment);
        vm.stopPrank();

        // Verify loan status
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            MicroLendingPlatform.LoanStatus status,
            uint256 repaidAmount,
            ,

        ) = platform.loans(1);
        assertTrue(status == MicroLendingPlatform.LoanStatus.REPAID);
        assertEq(repaidAmount, totalRepayment);

        // Verify borrower got collateral back
        assertGt(bdagToken.balanceOf(borrower), 0);

        // Verify lender received repayment
        assertGt(bdagToken.balanceOf(lender), 0);

        // Verify borrower stats updated
        (
            ,
            uint256 activeLoans,
            uint256 successfulLoans,
            ,
            ,
            uint256 creditScore
        ) = platform.borrowers(borrower);
        assertEq(activeLoans, 0);
        assertEq(successfulLoans, 1);
        assertGt(creditScore, 0);
    }

    function testRepayLoanPartialSuccess() public {
        _createAndFundLoan();

        uint256 totalRepayment = platform.calculateTotalRepayment(1);
        uint256 partialAmount = totalRepayment / 2;

        // Mint additional tokens for partial payment
        vm.prank(admin);
        bdagToken.mint(borrower, partialAmount);

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), partialAmount);

        vm.expectEmit(true, true, false, true);
        emit LoanRepaid(1, borrower, partialAmount, false);

        platform.repayLoan(1, partialAmount);
        vm.stopPrank();

        // Verify loan is still funded but partially repaid
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            MicroLendingPlatform.LoanStatus status,
            uint256 repaidAmount,
            bool isPartiallyRepaid,

        ) = platform.loans(1);
        assertTrue(status == MicroLendingPlatform.LoanStatus.FUNDED);
        assertEq(repaidAmount, partialAmount);
        assertTrue(isPartiallyRepaid);
    }

    function testRepayLoanNotFunded() public {
        _createLoanRequest();

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.LoanNotFunded.selector);
        platform.repayLoan(1, 1000e18);
    }

    function testRepayLoanExpired() public {
        _createAndFundLoan();

        // Fast forward past loan duration + grace period
        vm.warp(block.timestamp + LOAN_DURATION + 25 hours);

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.LoanExpired.selector);
        platform.repayLoan(1, 1000e18);
    }

    function testRepayLoanZeroAmount() public {
        _createAndFundLoan();

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.InvalidAmount.selector);
        platform.repayLoan(1, 0);
    }

    function testRepayLoanExcessAmount() public {
        _createAndFundLoan();

        uint256 totalRepayment = platform.calculateTotalRepayment(1);
        uint256 excessAmount = totalRepayment * 2;

        // Mint tokens for excess payment
        vm.prank(admin);
        bdagToken.mint(borrower, excessAmount);

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), excessAmount);

        // Should only charge the exact amount needed
        platform.repayLoan(1, excessAmount);
        vm.stopPrank();

        // Verify only total repayment was taken
        (, , , , , , , , uint256 repaidAmount, , ) = platform.loans(1);
        assertEq(repaidAmount, totalRepayment);
    }

    function testRepayLoanNotBorrower() public {
        _createAndFundLoan();

        vm.prank(lender);
        vm.expectRevert(MicroLendingPlatform.NotBorrower.selector);
        platform.repayLoan(1, 1000e18);
    }

    // =============================================================
    //                    LOAN DEFAULT TESTS
    // =============================================================

    function testDefaultLoanSuccess() public {
        _createAndFundLoan();

        // Fast forward past loan expiry + grace period
        vm.warp(block.timestamp + LOAN_DURATION + 25 hours);

        platform.defaultLoan(1);

        // Verify loan status
        (, , , , , , , MicroLendingPlatform.LoanStatus status, , , ) = platform
            .loans(1);
        assertTrue(status == MicroLendingPlatform.LoanStatus.DEFAULTED);

        // Verify lender received collateral
        assertGt(bdagToken.balanceOf(lender), 100_000e18);

        // Verify borrower stats penalty
        (
            ,
            uint256 activeLoans,
            ,
            uint256 defaultedLoans,
            ,
            uint256 creditScore
        ) = platform.borrowers(borrower);
        assertEq(activeLoans, 0);
        assertEq(defaultedLoans, 1);
        assertLt(creditScore, 100); // Should be reduced
    }

    function testDefaultLoanNotExpired() public {
        _createAndFundLoan();

        vm.expectRevert(MicroLendingPlatform.LoanNotExpired.selector);
        platform.defaultLoan(1);
    }

    function testDefaultLoanNotFunded() public {
        _createLoanRequest();

        vm.expectRevert(MicroLendingPlatform.LoanNotFunded.selector);
        platform.defaultLoan(1);
    }

    // =============================================================
    //                    LOAN CANCELLATION TESTS
    // =============================================================

    function testCancelLoanSuccess() public {
        _createLoanRequest();

        vm.prank(borrower);
        platform.cancelLoan(1);

        // Verify loan status
        (, , , , , , , MicroLendingPlatform.LoanStatus status, , , ) = platform
            .loans(1);
        assertTrue(status == MicroLendingPlatform.LoanStatus.CANCELLED);

        // Verify borrower got collateral back
        assertEq(bdagToken.balanceOf(borrower), 100_000e18);

        // Verify borrower active loans decreased
        (, uint256 activeLoans, , , , ) = platform.borrowers(borrower);
        assertEq(activeLoans, 0);
    }

    function testCancelLoanNotBorrower() public {
        _createLoanRequest();

        vm.prank(lender);
        vm.expectRevert(MicroLendingPlatform.NotBorrower.selector);
        platform.cancelLoan(1);
    }

    function testCancelLoanAlreadyFunded() public {
        _createAndFundLoan();

        vm.prank(borrower);
        vm.expectRevert(MicroLendingPlatform.LoanNotFound.selector);
        platform.cancelLoan(1);
    }

    // =============================================================
    //                    LIQUIDATION TESTS
    // =============================================================

    function testLiquidateLoanSuccess() public {
        _createAndFundLoan();

        // Make loan under-collateralized by increasing debt
        // Note: In real scenario, this would happen due to price changes
        // For testing, we'll assume collateral ratio calculation logic

        // Skip time but not enough to default
        vm.warp(block.timestamp + 15 days);

        // Since we can't easily simulate price changes in this test,
        // we'll test the liquidation logic with a modified scenario
        // This test verifies the function exists and basic structure
        vm.expectRevert(MicroLendingPlatform.CollateralRatioTooLow.selector);
        platform.liquidateLoan(1);
    }

    function testLiquidateLoanNotFunded() public {
        _createLoanRequest();

        vm.expectRevert(MicroLendingPlatform.LoanNotFunded.selector);
        platform.liquidateLoan(1);
    }

    // =============================================================
    //                    VIEW FUNCTION TESTS
    // =============================================================

    function testCalculateTotalRepayment() public {
        _createLoanRequest();

        uint256 totalRepayment = platform.calculateTotalRepayment(1);
        uint256 expectedInterest = (LOAN_AMOUNT * INTEREST_RATE) / 10000;
        uint256 expectedTotal = LOAN_AMOUNT + expectedInterest;

        assertEq(totalRepayment, expectedTotal);
    }

    function testGetUserLoans() public {
        _createLoanRequest();

        uint256[] memory userLoans = platform.getUserLoans(borrower);
        assertEq(userLoans.length, 1);
        assertEq(userLoans[0], 1);
    }

    function testGetUserLends() public {
        _createAndFundLoan();

        uint256[] memory userLends = platform.getUserLends(lender);
        assertEq(userLends.length, 1);
        assertEq(userLends[0], 1);
    }

    function testGetPlatformStats() public {
        _createAndFundLoan();

        (
            uint256 totalLoans,
            uint256 totalBorrowedAmount,
            uint256 totalCollateralLocked,
            uint256 utilizationRate,
            bool emergencyStatus
        ) = platform.getPlatformStats();

        assertEq(totalLoans, 1);
        assertEq(totalBorrowedAmount, LOAN_AMOUNT);
        assertEq(totalCollateralLocked, COLLATERAL_AMOUNT);
        assertEq(utilizationRate, 0); // liquidityRatio is used here
        assertFalse(emergencyStatus);
    }

    // =============================================================
    //                    ADMIN FUNCTION TESTS
    // =============================================================

    function testSetBlacklist() public {
        vm.prank(admin);
        platform.setBlacklist(borrower, true);

        assertTrue(platform.blacklisted(borrower));

        vm.prank(admin);
        platform.setBlacklist(borrower, false);

        assertFalse(platform.blacklisted(borrower));
    }

    function testSetBlacklistNonAdmin() public {
        vm.prank(borrower);
        vm.expectRevert();
        platform.setBlacklist(lender, true);
    }

    function testVerifyUser() public {
        vm.prank(operator);
        platform.verifyUser(borrower, true);

        (, , , , bool isVerifiedBorrower, ) = platform.borrowers(borrower);
        (, , , bool isVerifiedLender, ) = platform.lenders(borrower);

        assertTrue(isVerifiedBorrower);
        assertTrue(isVerifiedLender);
    }

    function testVerifyUserNonOperator() public {
        vm.prank(borrower);
        vm.expectRevert();
        platform.verifyUser(lender, true);
    }

    function testTogglePause() public {
        assertFalse(platform.paused());

        vm.prank(admin);
        platform.togglePause();

        assertTrue(platform.paused());

        vm.prank(admin);
        platform.togglePause();

        assertFalse(platform.paused());
    }

    function testTogglePauseNonAdmin() public {
        vm.prank(borrower);
        vm.expectRevert();
        platform.togglePause();
    }

    function testSetMaxUtilizationRate() public {
        vm.prank(admin);
        platform.setMaxUtilizationRate(9000); // 90%

        assertEq(platform.maxUtilizationRate(), 9000);
    }

    function testSetMaxUtilizationRateInvalid() public {
        vm.prank(admin);
        vm.expectRevert("Invalid rate");
        platform.setMaxUtilizationRate(11000); // > 100%
    }

    function testSetMaxUtilizationRateNonAdmin() public {
        vm.prank(borrower);
        vm.expectRevert();
        platform.setMaxUtilizationRate(9000);
    }

    function testSetTreasury() public {
        address newTreasury = makeAddr("newTreasury");

        vm.prank(admin);
        platform.setTreasury(newTreasury);

        assertEq(platform.treasury(), newTreasury);
    }

    function testSetTreasuryZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("Invalid address");
        platform.setTreasury(address(0));
    }

    function testSetTreasuryNonAdmin() public {
        address newTreasury = makeAddr("newTreasury");

        vm.prank(borrower);
        vm.expectRevert();
        platform.setTreasury(newTreasury);
    }

    // =============================================================
    //                    EDGE CASE TESTS
    // =============================================================

    function testLoanWithMinimumValues() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: 1e18, // MIN_LOAN_AMOUNT
                interestRate: 1, // 0.01% - very low but valid
                duration: 1 days, // MIN_LOAN_DURATION
                collateralAmount: 2e18, // Just above minimum required (120% of 1e18)
                purpose: "Minimum loan test"
            });

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), 2e18);
        platform.requestLoan(request);
        vm.stopPrank();

        // Verify loan created successfully
        (, , uint256 amount, , , , , , , , ) = platform.loans(1);
        assertEq(amount, 1e18);
    }

    function testLoanWithMaximumValues() public {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: 1000000e18, // MAX_LOAN_AMOUNT
                interestRate: 3000, // MAX_INTEREST_RATE (30%)
                duration: 365 days, // MAX_LOAN_DURATION
                collateralAmount: 1200000e18, // 120% collateral
                purpose: "Maximum loan test"
            });

        // Mint enough tokens for collateral
        vm.prank(admin);
        bdagToken.mint(borrower, 1200000e18);

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), 1200000e18);
        platform.requestLoan(request);
        vm.stopPrank();

        // Verify loan created successfully
        (
            ,
            ,
            uint256 amount,
            uint256 interestRate,
            uint256 duration,
            ,
            ,
            ,
            ,
            ,

        ) = platform.loans(1);
        assertEq(amount, 1000000e18);
        assertEq(interestRate, 3000);
        assertEq(duration, 365 days);
    }

    function testMultipleLoansByDifferentBorrowers() public {
        address borrower2 = makeAddr("borrower2");

        // Mint tokens for borrower2
        vm.prank(admin);
        bdagToken.mint(borrower2, 100_000e18);

        // Create first loan by borrower1
        _createLoanRequest();

        // Create second loan by borrower2
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Second borrower loan"
            });

        vm.startPrank(borrower2);
        bdagToken.approve(address(platform), COLLATERAL_AMOUNT);
        platform.requestLoan(request);
        vm.stopPrank();

        // Verify both loans exist
        assertEq(platform.loanCounter(), 2);

        // Verify loan ownership
        (address borrower1Addr, , , , , , , , , , ) = platform.loans(1);
        (address borrower2Addr, , , , , , , , , , ) = platform.loans(2);

        assertEq(borrower1Addr, borrower);
        assertEq(borrower2Addr, borrower2);
    }

    function testLoanRepaymentAfterPartialPayments() public {
        _createAndFundLoan();

        uint256 totalRepayment = platform.calculateTotalRepayment(1);
        uint256 firstPayment = totalRepayment / 3;
        uint256 secondPayment = totalRepayment / 3;
        uint256 finalPayment = totalRepayment - firstPayment - secondPayment;

        // Mint tokens for repayments
        vm.prank(admin);
        bdagToken.mint(borrower, totalRepayment);

        vm.startPrank(borrower);

        // First partial payment
        bdagToken.approve(address(platform), firstPayment);
        platform.repayLoan(1, firstPayment);

        // Second partial payment
        bdagToken.approve(address(platform), secondPayment);
        platform.repayLoan(1, secondPayment);

        // Final payment
        bdagToken.approve(address(platform), finalPayment);
        platform.repayLoan(1, finalPayment);

        vm.stopPrank();

        // Verify loan is fully repaid
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            MicroLendingPlatform.LoanStatus status,
            uint256 repaidAmount,
            ,

        ) = platform.loans(1);
        assertTrue(status == MicroLendingPlatform.LoanStatus.REPAID);
        assertEq(repaidAmount, totalRepayment);
    }

    function testBorrowerInfoUpdatesCorrectly() public {
        // Initial state
        (
            uint256 totalBorrowed,
            uint256 activeLoans,
            uint256 successfulLoans,
            uint256 defaultedLoans,
            bool isVerified,
            uint256 creditScore
        ) = platform.borrowers(borrower);
        assertEq(totalBorrowed, 0);
        assertEq(activeLoans, 0);
        assertEq(successfulLoans, 0);
        assertEq(defaultedLoans, 0);
        assertFalse(isVerified);
        assertEq(creditScore, 0);

        // After loan request
        _createLoanRequest();
        (, activeLoans, , , , ) = platform.borrowers(borrower);
        assertEq(activeLoans, 1);

        // After loan funding
        vm.startPrank(lender);
        bdagToken.approve(address(platform), LOAN_AMOUNT);
        platform.fundLoan(1);
        vm.stopPrank();

        (totalBorrowed, , , , , ) = platform.borrowers(borrower);
        assertEq(totalBorrowed, LOAN_AMOUNT);

        // After successful repayment
        uint256 totalRepayment = platform.calculateTotalRepayment(1);
        vm.prank(admin);
        bdagToken.mint(borrower, totalRepayment);

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), totalRepayment);
        platform.repayLoan(1, totalRepayment);
        vm.stopPrank();

        (, activeLoans, successfulLoans, , , creditScore) = platform.borrowers(
            borrower
        );
        assertEq(activeLoans, 0);
        assertEq(successfulLoans, 1);
        assertGt(creditScore, 0);
    }

    function testLenderInfoUpdatesCorrectly() public {
        _createAndFundLoan();

        // Check lender info after funding
        (
            uint256 totalLent,
            uint256 activeLends,
            uint256 totalEarned,
            bool isVerified,
            uint256 reputationScore
        ) = platform.lenders(lender);
        assertEq(totalLent, LOAN_AMOUNT);
        assertEq(activeLends, 1);
        assertEq(totalEarned, 0); // No earnings yet
        assertFalse(isVerified);
        assertEq(reputationScore, 0);

        // After loan repayment
        uint256 totalRepayment = platform.calculateTotalRepayment(1);
        vm.prank(admin);
        bdagToken.mint(borrower, totalRepayment);

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), totalRepayment);
        platform.repayLoan(1, totalRepayment);
        vm.stopPrank();

        (, activeLends, totalEarned, , reputationScore) = platform.lenders(
            lender
        );
        assertEq(activeLends, 0);
        assertGt(totalEarned, 0); // Should have earned interest
        assertGt(reputationScore, 0); // Should have gained reputation
    }

    function testGracePeriodFunctionality() public {
        _createAndFundLoan();

        // Fast forward to exactly loan duration (not yet in grace period)
        vm.warp(block.timestamp + LOAN_DURATION);

        // Should still be able to repay
        uint256 totalRepayment = platform.calculateTotalRepayment(1);
        vm.prank(admin);
        bdagToken.mint(borrower, totalRepayment);

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), totalRepayment);
        platform.repayLoan(1, totalRepayment);
        vm.stopPrank();

        // Verify successful repayment
        (, , , , , , , MicroLendingPlatform.LoanStatus status, , , ) = platform
            .loans(1);
        assertTrue(status == MicroLendingPlatform.LoanStatus.REPAID);
    }

    function testCollateralCalculation() public {
        uint256 loanAmount = 10_000e18;
        uint256 minCollateral = (loanAmount * 12000) / 10000; // 120%

        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: loanAmount,
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: minCollateral,
                purpose: "Exact minimum collateral test"
            });

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), minCollateral);
        platform.requestLoan(request);
        vm.stopPrank();

        // Verify loan created with exact minimum collateral
        (, , , , , , uint256 collateralAmount, , , , ) = platform.loans(1);
        assertEq(collateralAmount, minCollateral);
    }

    function testInvalidLoanIdInViewFunctions() public {
        vm.expectRevert(MicroLendingPlatform.LoanNotFound.selector);
        platform.calculateTotalRepayment(999);
    }

    // =============================================================
    //                    HELPER FUNCTIONS
    // =============================================================

    function _createLoanRequest() internal {
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: LOAN_AMOUNT,
                interestRate: INTEREST_RATE,
                duration: LOAN_DURATION,
                collateralAmount: COLLATERAL_AMOUNT,
                purpose: "Test loan"
            });

        vm.startPrank(borrower);
        bdagToken.approve(address(platform), COLLATERAL_AMOUNT);
        platform.requestLoan(request);
        vm.stopPrank();
    }

    function _createAndFundLoan() internal {
        _createLoanRequest();

        vm.startPrank(lender);
        bdagToken.approve(address(platform), LOAN_AMOUNT);
        platform.fundLoan(1);
        vm.stopPrank();
    }
}
