// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/MicroLendingPlatform.sol";
import "../src/BDAGToken.sol";

/**
 * @title SetupScript
 * @dev Script to setup initial data and configurations for the lending platform
 */
contract SetupScript is Script {
    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        // address deployer = vm.addr(deployerPrivateKey);

        // Load contract addresses from deployment
        string memory json = vm.readFile("./deployments/latest.json");
        address bdagTokenAddress = vm.parseJsonAddress(json, ".bdagToken");
        address lendingPlatformAddress = vm.parseJsonAddress(
            json,
            ".lendingPlatform"
        );

        console.log("Setting up contracts...");
        console.log("BDAG Token:", bdagTokenAddress);
        console.log("Lending Platform:", lendingPlatformAddress);

        vm.startBroadcast(deployerPrivateKey);

        BDAGToken bdagToken = BDAGToken(bdagTokenAddress);
        MicroLendingPlatform lendingPlatform = MicroLendingPlatform(
            lendingPlatformAddress
        );

        // Create test accounts and fund them
        _setupTestAccounts(bdagToken);

        // Create sample loan requests for testing
        _createSampleLoans();

        // Verify initial setup
        _verifySetup(bdagToken, lendingPlatform);

        vm.stopBroadcast();

        console.log("Setup completed successfully!");
    }

    function _setupTestAccounts(BDAGToken bdagToken) internal {
        console.log("Setting up test accounts...");

        // Test account addresses (replace with actual test addresses)
        address[] memory testAccounts = new address[](4);
        testAccounts[0] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Test borrower 1
        testAccounts[1] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Test borrower 2
        testAccounts[2] = 0x90F79bf6EB2c4f870365E785982E1f101E93b906; // Test lender 1
        testAccounts[3] = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65; // Test lender 2

        uint256 testAmount = 100_000 * 10 ** 18; // 100K BDAG per account

        for (uint256 i = 0; i < testAccounts.length; i++) {
            if (testAccounts[i] != address(0)) {
                bdagToken.mint(testAccounts[i], testAmount);
                console.log("Funded account:", testAccounts[i]);
            }
        }
    }

    function _createSampleLoans() internal pure {
        console.log("Creating sample loan requests...");

        // Sample loan data
        MicroLendingPlatform.LoanRequest[]
            memory sampleLoans = new MicroLendingPlatform.LoanRequest[](3);

        sampleLoans[0] = MicroLendingPlatform.LoanRequest({
            amount: 10_000 * 10 ** 18, // 10K BDAG
            interestRate: 1000, // 10% APR
            duration: 30 days, // 30 days
            collateralAmount: 15_000 * 10 ** 18, // 15K BDAG (150% ratio)
            purpose: "Business working capital"
        });

        sampleLoans[1] = MicroLendingPlatform.LoanRequest({
            amount: 5_000 * 10 ** 18, // 5K BDAG
            interestRate: 800, // 8% APR
            duration: 14 days, // 14 days
            collateralAmount: 7_500 * 10 ** 18, // 7.5K BDAG (150% ratio)
            purpose: "Equipment purchase"
        });

        sampleLoans[2] = MicroLendingPlatform.LoanRequest({
            amount: 25_000 * 10 ** 18, // 25K BDAG
            interestRate: 1200, // 12% APR
            duration: 60 days, // 60 days
            collateralAmount: 37_500 * 10 ** 18, // 37.5K BDAG (150% ratio)
            purpose: "Inventory financing"
        });

        // Create loans (this would need to be done by actual borrowers in production)
        for (uint256 i = 0; i < sampleLoans.length; i++) {
            // Note: In production, this would be called by different borrowers
            // For setup, we're creating template loans
            console.log("Sample loan", i + 1, "template created");
        }
    }

    function _verifySetup(
        BDAGToken bdagToken,
        MicroLendingPlatform lendingPlatform
    ) internal view {
        console.log("Verifying setup...");

        // Check token supply
        uint256 totalSupply = bdagToken.totalSupply();
        console.log("Total BDAG supply:", totalSupply);

        // Check platform state
        (
            uint256 totalLoans,
            uint256 totalBorrowed,
            uint256 totalCollateral,
            uint256 utilizationRate,
            bool emergency
        ) = lendingPlatform.getPlatformStats();

        console.log("Platform stats:");
        console.log("- Total loans:", totalLoans);
        console.log("- Total borrowed:", totalBorrowed);
        console.log("- Total collateral:", totalCollateral);
        console.log("- Utilization rate:", utilizationRate);
        console.log("- Emergency status:", emergency);

        console.log("Setup verification completed!");
    }

    // Helper function to create a real loan for testing
    function createTestLoan(
        address borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 duration,
        uint256 collateralAmount,
        string memory purpose
    ) external {
        // Load contract addresses
        string memory json = vm.readFile("./deployments/latest.json");
        address bdagTokenAddress = vm.parseJsonAddress(json, ".bdagToken");
        address lendingPlatformAddress = vm.parseJsonAddress(
            json,
            ".lendingPlatform"
        );

        BDAGToken bdagToken = BDAGToken(bdagTokenAddress);
        MicroLendingPlatform lendingPlatform = MicroLendingPlatform(
            lendingPlatformAddress
        );

        vm.startBroadcast();

        // Ensure borrower has enough tokens
        if (bdagToken.balanceOf(borrower) < collateralAmount) {
            bdagToken.mint(borrower, collateralAmount);
        }

        vm.stopBroadcast();

        // Switch to borrower
        vm.startBroadcast(vm.envUint("BORROWER_PRIVATE_KEY"));

        // Approve collateral
        bdagToken.approve(address(lendingPlatform), collateralAmount);

        // Create loan request
        MicroLendingPlatform.LoanRequest memory request = MicroLendingPlatform
            .LoanRequest({
                amount: amount,
                interestRate: interestRate,
                duration: duration,
                collateralAmount: collateralAmount,
                purpose: purpose
            });

        lendingPlatform.requestLoan(request);

        vm.stopBroadcast();

        console.log("Test loan created successfully!");
    }
}
