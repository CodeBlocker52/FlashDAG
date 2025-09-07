// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import "../src/MicroLendingPlatform.sol";
import "../src/BDAGToken.sol";

/**
 * @title DeployScript
 * @dev Simple deployment script for BlockDAG Micro Lending Platform
 */
contract DeployScript is Script {
    // Deployed contract addresses
    address public deployedBDAGToken;
    address public deployedLendingPlatform;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== BlockDAG Micro Lending Platform Deployment ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy BDAG Token
        console.log("1. Deploying BDAG Token...");
        BDAGToken bdagToken = new BDAGToken(deployer);
        deployedBDAGToken = address(bdagToken);
        console.log("BDAG Token deployed:", deployedBDAGToken);
        console.log("Total Supply:", bdagToken.totalSupply());
        console.log("");

        // Step 2: Deploy Lending Platform
        console.log("2. Deploying Micro Lending Platform...");
        MicroLendingPlatform lendingPlatform = new MicroLendingPlatform(
            deployedBDAGToken, // BDAG token address
            deployer, // Treasury (deployer initially)
            deployer // Admin (deployer initially)
        );
        deployedLendingPlatform = address(lendingPlatform);
        console.log("Lending Platform deployed:", deployedLendingPlatform);
        console.log("");

        // Step 3: Initial Setup
        console.log("3. Initial Setup...");

        // Mint some test tokens to deployer (10M BDAG)
        uint256 testAmount = 10_000_000 * 10 ** 18;
        bdagToken.mint(deployer, testAmount);
        console.log(" Minted test tokens:", testAmount);

        // Verify deployment
        require(
            address(lendingPlatform.bdagToken()) == deployedBDAGToken,
            "Token address mismatch"
        );
        require(
            lendingPlatform.treasury() == deployer,
            "Treasury address mismatch"
        );
        console.log("Deployment verified");
        console.log("");

        vm.stopBroadcast();

        // Step 4: Deployment Summary
        _logDeploymentSummary();
    }

    function _logDeploymentSummary() internal view {
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("");
        console.log("Contract Addresses:");
        console.log("   BDAG Token:      ", deployedBDAGToken);
        console.log("   Lending Platform:", deployedLendingPlatform);
        console.log("");
        console.log(" Network Info:");
        console.log("   Chain ID: 1043");
        console.log("   RPC URL:  https://rpc.primordial.bdagscan.com");
        console.log("   Explorer: https://bdagscan.com");
        console.log("");
        console.log("View on Explorer:");
        console.log(
            "   BDAG Token:       https://bdagscan.com/address/",
            deployedBDAGToken
        );
        console.log(
            "   Lending Platform: https://bdagscan.com/address/",
            deployedLendingPlatform
        );
        console.log("");
        console.log("=== END OF SUMMARY ===");
    }
}
