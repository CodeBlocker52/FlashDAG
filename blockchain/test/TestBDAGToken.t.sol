// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/BDAGToken.sol";

contract TestBDAGToken is Test {
    BDAGToken public token;

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public spender = makeAddr("spender");

    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10 ** 18;
    uint256 public constant MAX_SUPPLY = 50_000_000_000 * 10 ** 18;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function setUp() public {
        vm.prank(owner);
        token = new BDAGToken(owner);
    }

    // =============================================================
    //                    DEPLOYMENT TESTS
    // =============================================================

    function testDeployment() public view {
        assertEq(token.name(), "BlockDAG");
        assertEq(token.symbol(), "BDAG");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.owner(), owner);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
    }

    function testInitialSupplyConstants() public view {
        assertEq(token.INITIAL_SUPPLY(), INITIAL_SUPPLY);
        assertEq(token.MAX_SUPPLY(), MAX_SUPPLY);
    }

    // =============================================================
    //                    ERC20 BASIC FUNCTIONALITY TESTS
    // =============================================================

    function testTransfer() public {
        uint256 transferAmount = 1000e18;

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, user1, transferAmount);

        bool success = token.transfer(user1, transferAmount);
        assertTrue(success);

        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - transferAmount);
        assertEq(token.balanceOf(user1), transferAmount);
    }

    function testTransferInsufficientBalance() public {
        vm.prank(user1); // user1 has 0 balance
        vm.expectRevert();
        token.transfer(user2, 1e18);
    }

    function testTransferToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert();
        token.transfer(address(0), 1000e18);
    }

    function testTransferZeroAmount() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, user1, 0);

        bool success = token.transfer(user1, 0);
        assertTrue(success);

        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.balanceOf(user1), 0);
    }

    function testApprove() public {
        uint256 approveAmount = 5000e18;

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Approval(owner, spender, approveAmount);

        bool success = token.approve(spender, approveAmount);
        assertTrue(success);

        assertEq(token.allowance(owner, spender), approveAmount);
    }

    function testApproveZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert();
        token.approve(address(0), 1000e18);
    }

    function testTransferFrom() public {
        uint256 approveAmount = 5000e18;
        uint256 transferAmount = 2000e18;

        // First approve
        vm.prank(owner);
        token.approve(spender, approveAmount);

        // Then transfer from
        vm.prank(spender);
        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, user1, transferAmount);

        bool success = token.transferFrom(owner, user1, transferAmount);
        assertTrue(success);

        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - transferAmount);
        assertEq(token.balanceOf(user1), transferAmount);
        assertEq(
            token.allowance(owner, spender),
            approveAmount - transferAmount
        );
    }

    function testTransferFromInsufficientAllowance() public {
        uint256 approveAmount = 1000e18;
        uint256 transferAmount = 2000e18;

        vm.prank(owner);
        token.approve(spender, approveAmount);

        vm.prank(spender);
        vm.expectRevert();
        token.transferFrom(owner, user1, transferAmount);
    }

    function testTransferFromInsufficientBalance() public {
        // Transfer most tokens away first
        vm.prank(owner);
        token.transfer(user2, INITIAL_SUPPLY - 500e18);

        // Approve more than remaining balance
        vm.prank(owner);
        token.approve(spender, 1000e18);

        // Try to transfer more than balance
        vm.prank(spender);
        vm.expectRevert();
        token.transferFrom(owner, user1, 1000e18);
    }

    function testIncreaseAllowance() public {
        uint256 initialAllowance = 1000e18;
        uint256 increaseAmount = 500e18;

        vm.prank(owner);
        token.approve(spender, initialAllowance);

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Approval(owner, spender, initialAllowance + increaseAmount);

        bool success = token.increaseAllowance(spender, increaseAmount);
        assertTrue(success);

        assertEq(
            token.allowance(owner, spender),
            initialAllowance + increaseAmount
        );
    }

    function testDecreaseAllowance() public {
        uint256 initialAllowance = 1000e18;
        uint256 decreaseAmount = 300e18;

        vm.prank(owner);
        token.approve(spender, initialAllowance);

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Approval(owner, spender, initialAllowance - decreaseAmount);

        bool success = token.decreaseAllowance(spender, decreaseAmount);
        assertTrue(success);

        assertEq(
            token.allowance(owner, spender),
            initialAllowance - decreaseAmount
        );
    }

    function testDecreaseAllowanceBelowZero() public {
        uint256 initialAllowance = 1000e18;
        uint256 decreaseAmount = 1500e18;

        vm.prank(owner);
        token.approve(spender, initialAllowance);

        vm.prank(owner);
        vm.expectRevert();
        token.decreaseAllowance(spender, decreaseAmount);
    }

    // =============================================================
    //                    MINTING TESTS
    // =============================================================

    function testMint() public {
        uint256 mintAmount = 1000e18;
        uint256 initialTotalSupply = token.totalSupply();
        uint256 initialBalance = token.balanceOf(user1);

        vm.prank(owner);
        token.mint(user1, mintAmount);

        assertEq(token.totalSupply(), initialTotalSupply + mintAmount);
        assertEq(token.balanceOf(user1), initialBalance + mintAmount);
    }

    function testMintToOwner() public {
        uint256 mintAmount = 5000e18;
        uint256 initialBalance = token.balanceOf(owner);

        vm.prank(owner);
        token.mint(owner, mintAmount);

        assertEq(token.balanceOf(owner), initialBalance + mintAmount);
    }

    function testMintExceedsMaxSupply() public {
        uint256 excessiveAmount = MAX_SUPPLY - INITIAL_SUPPLY + 1;

        vm.prank(owner);
        vm.expectRevert("Exceeds max supply");
        token.mint(user1, excessiveAmount);
    }

    function testMintAtMaxSupply() public {
        uint256 remainingSupply = MAX_SUPPLY - INITIAL_SUPPLY;

        vm.prank(owner);
        token.mint(user1, remainingSupply);

        assertEq(token.totalSupply(), MAX_SUPPLY);
        assertEq(token.balanceOf(user1), remainingSupply);
    }

    function testMintNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, 1000e18);
    }

    function testMintZeroAmount() public {
        uint256 initialTotalSupply = token.totalSupply();
        uint256 initialBalance = token.balanceOf(user1);

        vm.prank(owner);
        token.mint(user1, 0);

        assertEq(token.totalSupply(), initialTotalSupply);
        assertEq(token.balanceOf(user1), initialBalance);
    }

    function testMintToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert();
        token.mint(address(0), 1000e18);
    }

    // =============================================================
    //                    BURNING TESTS
    // =============================================================

    function testBurn() public {
        uint256 burnAmount = 1000e18;

        // First transfer some tokens to user1
        vm.prank(owner);
        token.transfer(user1, 5000e18);

        uint256 initialTotalSupply = token.totalSupply();
        uint256 initialBalance = token.balanceOf(user1);

        vm.prank(user1);
        token.burn(burnAmount);

        assertEq(token.totalSupply(), initialTotalSupply - burnAmount);
        assertEq(token.balanceOf(user1), initialBalance - burnAmount);
    }

    function testBurnOwnerTokens() public {
        uint256 burnAmount = 10000e18;
        uint256 initialTotalSupply = token.totalSupply();
        uint256 initialBalance = token.balanceOf(owner);

        vm.prank(owner);
        token.burn(burnAmount);

        assertEq(token.totalSupply(), initialTotalSupply - burnAmount);
        assertEq(token.balanceOf(owner), initialBalance - burnAmount);
    }

    function testBurnInsufficientBalance() public {
        vm.prank(user1); // user1 has 0 balance
        vm.expectRevert();
        token.burn(1e18);
    }

    function testBurnZeroAmount() public {
        uint256 initialTotalSupply = token.totalSupply();
        uint256 initialBalance = token.balanceOf(owner);

        vm.prank(owner);
        token.burn(0);

        assertEq(token.totalSupply(), initialTotalSupply);
        assertEq(token.balanceOf(owner), initialBalance);
    }

    function testBurnAllTokens() public {
        // Transfer some tokens to user1
        uint256 userAmount = 5000e18;
        vm.prank(owner);
        token.transfer(user1, userAmount);

        // Burn all user1's tokens
        vm.prank(user1);
        token.burn(userAmount);

        assertEq(token.balanceOf(user1), 0);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - userAmount);
    }

    // =============================================================
    //                    OWNERSHIP TESTS
    // =============================================================

    function testOwnership() public view {
        assertEq(token.owner(), owner);
    }

    function testTransferOwnership() public {
        vm.prank(owner);
        token.transferOwnership(user1);

        assertEq(token.owner(), user1);
    }

    function testTransferOwnershipNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.transferOwnership(user2);
    }

    function testRenounceOwnership() public {
        vm.prank(owner);
        token.renounceOwnership();

        assertEq(token.owner(), address(0));
    }

    function testRenounceOwnershipNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.renounceOwnership();
    }

    // =============================================================
    //                    ERC20 PERMIT TESTS
    // =============================================================

    function testDomainSeparator() public view {
        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        assertGt(uint256(domainSeparator), 0);
    }

    function testNonces() public view {
        assertEq(token.nonces(owner), 0);
        assertEq(token.nonces(user1), 0);
    }

    function testPermit() public {
        uint256 privateKey = 0xBEEF;
        address user = vm.addr(privateKey);

        // Mint some tokens to the user
        vm.prank(owner);
        token.mint(user, 1000e18);

        uint256 amount = 500e18;
        uint256 deadline = block.timestamp + 1 hours;

        // Create permit signature
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
                ),
                user,
                spender,
                amount,
                token.nonces(user),
                deadline
            )
        );

        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);

        // Execute permit
        token.permit(user, spender, amount, deadline, v, r, s);

        assertEq(token.allowance(user, spender), amount);
        assertEq(token.nonces(user), 1);
    }

    function testPermitExpired() public {
        uint256 privateKey = 0xBEEF;
        address user = vm.addr(privateKey);

        uint256 amount = 500e18;
        uint256 deadline = block.timestamp - 1; // Expired

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
                ),
                user,
                spender,
                amount,
                token.nonces(user),
                deadline
            )
        );

        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);

        vm.expectRevert();
        token.permit(user, spender, amount, deadline, v, r, s);
    }

    // =============================================================
    //                    EDGE CASES AND STRESS TESTS
    // =============================================================

    function testLargeTransfer() public {
        uint256 largeAmount = INITIAL_SUPPLY / 2;

        vm.prank(owner);
        token.transfer(user1, largeAmount);

        assertEq(token.balanceOf(user1), largeAmount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - largeAmount);
    }

    function testMultipleTransfers() public {
        uint256 transferAmount = 1000e18;

        vm.startPrank(owner);

        for (uint256 i = 0; i < 10; i++) {
            address recipient = makeAddr(string(abi.encodePacked("user", i)));
            token.transfer(recipient, transferAmount);
            assertEq(token.balanceOf(recipient), transferAmount);
        }

        vm.stopPrank();

        assertEq(
            token.balanceOf(owner),
            INITIAL_SUPPLY - (transferAmount * 10)
        );
    }

    function testCircularTransfers() public {
        uint256 amount = 1000e18;

        // owner -> user1 -> user2 -> owner
        vm.prank(owner);
        token.transfer(user1, amount);

        vm.prank(user1);
        token.transfer(user2, amount);

        vm.prank(user2);
        token.transfer(owner, amount);

        // Should end up where we started
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.balanceOf(user1), 0);
        assertEq(token.balanceOf(user2), 0);
    }

    function testMintAndBurnCombination() public {
        uint256 mintAmount = 5000e18;
        uint256 burnAmount = 2000e18;

        // Mint to user1
        vm.prank(owner);
        token.mint(user1, mintAmount);

        uint256 balanceAfterMint = token.balanceOf(user1);
        uint256 totalSupplyAfterMint = token.totalSupply();

        // Burn from user1
        vm.prank(user1);
        token.burn(burnAmount);

        assertEq(token.balanceOf(user1), balanceAfterMint - burnAmount);
        assertEq(token.totalSupply(), totalSupplyAfterMint - burnAmount);
    }

    function testMintToMultipleUsers() public {
        uint256 mintAmount = 1000e18;
        address[] memory users = new address[](5);

        for (uint256 i = 0; i < 5; i++) {
            users[i] = makeAddr(string(abi.encodePacked("batchUser", i)));
        }

        vm.startPrank(owner);
        for (uint256 i = 0; i < users.length; i++) {
            token.mint(users[i], mintAmount);
            assertEq(token.balanceOf(users[i]), mintAmount);
        }
        vm.stopPrank();

        assertEq(token.totalSupply(), INITIAL_SUPPLY + (mintAmount * 5));
    }

    function testTransferBetweenNonOwnerUsers() public {
        uint256 initialAmount = 5000e18;
        uint256 transferAmount = 2000e18;

        // Give user1 some tokens
        vm.prank(owner);
        token.transfer(user1, initialAmount);

        // user1 transfers to user2
        vm.prank(user1);
        token.transfer(user2, transferAmount);

        assertEq(token.balanceOf(user1), initialAmount - transferAmount);
        assertEq(token.balanceOf(user2), transferAmount);
    }

    function testApprovalAndTransferFromChain() public {
        uint256 amount = 3000e18;

        // Give user1 some tokens
        vm.prank(owner);
        token.transfer(user1, 10000e18);

        // user1 approves spender
        vm.prank(user1);
        token.approve(spender, amount);

        // spender transfers from user1 to user2
        vm.prank(spender);
        token.transferFrom(user1, user2, amount);

        assertEq(token.balanceOf(user1), 10000e18 - amount);
        assertEq(token.balanceOf(user2), amount);
        assertEq(token.allowance(user1, spender), 0);
    }

    function testMaximumApproval() public {
        uint256 maxApproval = type(uint256).max;

        vm.prank(owner);
        token.approve(spender, maxApproval);

        assertEq(token.allowance(owner, spender), maxApproval);

        // Transfer should work with max approval
        uint256 transferAmount = 1000e18;
        vm.prank(spender);
        token.transferFrom(owner, user1, transferAmount);

        // With max approval, allowance should remain max (OpenZeppelin behavior)
        assertEq(token.allowance(owner, spender), maxApproval);
    }

    // =============================================================
    //                    FUZZ TESTING HELPERS
    // =============================================================

    function testFuzzTransfer(uint256 amount) public {
        // Bound amount to available balance
        amount = bound(amount, 0, token.balanceOf(owner));

        uint256 initialOwnerBalance = token.balanceOf(owner);
        uint256 initialUserBalance = token.balanceOf(user1);

        vm.prank(owner);
        token.transfer(user1, amount);

        assertEq(token.balanceOf(owner), initialOwnerBalance - amount);
        assertEq(token.balanceOf(user1), initialUserBalance + amount);
    }

    function testFuzzMint(uint256 amount) public {
        // Bound amount to not exceed max supply
        uint256 maxMintable = MAX_SUPPLY - token.totalSupply();
        amount = bound(amount, 0, maxMintable);

        uint256 initialSupply = token.totalSupply();
        uint256 initialBalance = token.balanceOf(user1);

        vm.prank(owner);
        token.mint(user1, amount);

        assertEq(token.totalSupply(), initialSupply + amount);
        assertEq(token.balanceOf(user1), initialBalance + amount);
    }

    function testFuzzBurn(uint256 amount) public {
        // First give user1 some tokens
        uint256 initialAmount = 10000e18;
        vm.prank(owner);
        token.transfer(user1, initialAmount);

        // Bound amount to available balance
        amount = bound(amount, 0, token.balanceOf(user1));

        uint256 initialSupply = token.totalSupply();
        uint256 initialBalance = token.balanceOf(user1);

        vm.prank(user1);
        token.burn(amount);

        assertEq(token.totalSupply(), initialSupply - amount);
        assertEq(token.balanceOf(user1), initialBalance - amount);
    }

    function testFuzzApprove(uint256 amount) public {
        vm.prank(owner);
        token.approve(spender, amount);

        assertEq(token.allowance(owner, spender), amount);
    }

    // =============================================================
    //                    INVARIANT HELPERS
    // =============================================================

    function testTotalSupplyNeverExceedsMax() public {
        // Try to mint maximum possible
        uint256 maxMintable = MAX_SUPPLY - token.totalSupply();

        vm.prank(owner);
        token.mint(user1, maxMintable);

        assertEq(token.totalSupply(), MAX_SUPPLY);

        // Now try to mint one more token - should fail
        vm.prank(owner);
        vm.expectRevert("Exceeds max supply");
        token.mint(user1, 1);
    }

    function testBalancesAlwaysAddUpToTotalSupply() public {
        uint256 amount1 = 5000e18;
        uint256 amount2 = 3000e18;

        // Transfer to two users
        vm.prank(owner);
        token.transfer(user1, amount1);

        vm.prank(owner);
        token.transfer(user2, amount2);

        // Check that balances add up
        uint256 totalBalances = token.balanceOf(owner) +
            token.balanceOf(user1) +
            token.balanceOf(user2);

        assertEq(totalBalances, token.totalSupply());
    }

    function testBurnReducesTotalSupply() public {
        uint256 burnAmount = 1000e18;
        uint256 initialSupply = token.totalSupply();

        vm.prank(owner);
        token.burn(burnAmount);

        assertEq(token.totalSupply(), initialSupply - burnAmount);
        assertLt(token.totalSupply(), INITIAL_SUPPLY);
    }

    // =============================================================
    //                    SECURITY TESTS
    // =============================================================

    function testCannotMintAfterOwnershipRenounced() public {
        vm.prank(owner);
        token.renounceOwnership();

        vm.expectRevert();
        token.mint(user1, 1000e18);
    }

    function testCannotMintToZeroAddressEvenAsOwner() public {
        vm.prank(owner);
        vm.expectRevert();
        token.mint(address(0), 1000e18);
    }

    function testCannotTransferToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert();
        token.transfer(address(0), 1000e18);
    }

    function testCannotApproveToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert();
        token.approve(address(0), 1000e18);
    }

    function testCannotTransferFromZeroAddress() public {
        vm.prank(spender);
        vm.expectRevert();
        token.transferFrom(address(0), user1, 1000e18);
    }

    function testCannotTransferMoreThanBalance() public {
        uint256 balance = token.balanceOf(owner);

        vm.prank(owner);
        vm.expectRevert();
        token.transfer(user1, balance + 1);
    }

    function testCannotBurnMoreThanBalance() public {
        uint256 userBalance = 1000e18;

        vm.prank(owner);
        token.transfer(user1, userBalance);

        vm.prank(user1);
        vm.expectRevert();
        token.burn(userBalance + 1);
    }

    // =============================================================
    //                    INTEGRATION WITH EXTERNAL CONTRACTS
    // =============================================================

    function testIntegrationWithExternalContract() public {
        // Simulate how the token would work with the lending platform
        uint256 approvalAmount = 10000e18;
        address lendingPlatform = makeAddr("lendingPlatform");

        // User approves lending platform
        vm.prank(owner);
        token.approve(lendingPlatform, approvalAmount);

        // Platform transfers tokens (simulating collateral deposit)
        vm.prank(lendingPlatform);
        token.transferFrom(owner, lendingPlatform, approvalAmount);

        assertEq(token.balanceOf(lendingPlatform), approvalAmount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - approvalAmount);
    }

    // =============================================================
    //                    GAS OPTIMIZATION TESTS
    // =============================================================

    function testGasUsageForBasicOperations() public {
        uint256 transferAmount = 1000e18;

        // Measure gas for transfer
        uint256 gasBefore = gasleft();
        vm.prank(owner);
        token.transfer(user1, transferAmount);
        uint256 gasUsed = gasBefore - gasleft();

        // Basic transfer should not use excessive gas (rough estimate)
        assertLt(gasUsed, 100000);
    }

    function testGasUsageForMinting() public {
        uint256 mintAmount = 1000e18;

        uint256 gasBefore = gasleft();
        vm.prank(owner);
        token.mint(user1, mintAmount);
        uint256 gasUsed = gasBefore - gasleft();

        // Minting should be reasonably gas efficient
        assertLt(gasUsed, 150000);
    }
}
