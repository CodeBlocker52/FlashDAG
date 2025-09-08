# Frontend Integration Guide - BlockDAG Micro Lending Platform

## Overview

This guide provides comprehensive information for frontend developers to integrate with the BlockDAG Micro Lending Platform smart contracts. It covers all necessary functions, state variables, and user flows for building a complete DApp interface.

## Contract Addresses & Setup

```typescript
// Contract addresses (replace with actual deployed addresses)
const CONTRACTS = {
  BDAG_TOKEN: "0x...", // BDAGToken contract address
  LENDING_PLATFORM: "0x...", // MicroLendingPlatform contract address
  TREASURY: "0x..." // Treasury address
};

// Network configuration
const BLOCKDAG_NETWORK = {
  chainId: 1043,
  name: "BlockDAG Primordial Testnet",
  rpcUrl: "https://rpc.primordial.bdagscan.com",
  explorer: "https://bdagscan.com"
};
```

## Essential Contract Interfaces

### BDAGToken Contract Functions

```typescript
interface BDAGToken {
  // Read functions
  balanceOf(address: string): Promise<BigNumber>;
  allowance(owner: string, spender: string): Promise<BigNumber>;
  totalSupply(): Promise<BigNumber>;
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  
  // Write functions
  approve(spender: string, amount: BigNumber): Promise<Transaction>;
  transfer(to: string, amount: BigNumber): Promise<Transaction>;
  transferFrom(from: string, to: string, amount: BigNumber): Promise<Transaction>;
  
  // Owner functions (if user is owner)
  mint(to: string, amount: BigNumber): Promise<Transaction>;
  burn(amount: BigNumber): Promise<Transaction>;
}
```

### MicroLendingPlatform Contract Functions

```typescript
interface MicroLendingPlatform {
  // Read functions - Platform Info
  loanCounter(): Promise<BigNumber>;
  treasury(): Promise<string>;
  totalBorrowed(): Promise<BigNumber>;
  totalCollateral(): Promise<BigNumber>;
  maxUtilizationRate(): Promise<BigNumber>;
  liquidityEmergency(): Promise<boolean>;
  
  // Read functions - Loan Info
  loans(loanId: BigNumber): Promise<LoanStruct>;
  calculateTotalRepayment(loanId: BigNumber): Promise<BigNumber>;
  getUserLoans(user: string): Promise<BigNumber[]>;
  getUserLends(user: string): Promise<BigNumber[]>;
  
  // Read functions - User Info
  borrowers(user: string): Promise<BorrowerInfoStruct>;
  lenders(user: string): Promise<LenderInfoStruct>;
  blacklisted(user: string): Promise<boolean>;
  
  // Read functions - Platform Stats
  getPlatformStats(): Promise<PlatformStatsStruct>;
  
  // Write functions - Core Lending
  requestLoan(request: LoanRequestStruct): Promise<Transaction>;
  fundLoan(loanId: BigNumber): Promise<Transaction>;
  repayLoan(loanId: BigNumber, amount: BigNumber): Promise<Transaction>;
  cancelLoan(loanId: BigNumber): Promise<Transaction>;
  defaultLoan(loanId: BigNumber): Promise<Transaction>;
  liquidateLoan(loanId: BigNumber): Promise<Transaction>;
}
```

## Data Structures

### Core Structs

```typescript
interface LoanRequestStruct {
  amount: BigNumber;           // Loan amount in BDAG (18 decimals)
  interestRate: BigNumber;     // Interest rate in basis points (1000 = 10%)
  duration: BigNumber;         // Loan duration in seconds
  collateralAmount: BigNumber; // Collateral amount in BDAG (18 decimals)
  purpose: string;             // Loan purpose description
}

interface LoanStruct {
  borrower: string;            // Borrower address
  lender: string;             // Lender address (0x0 if not funded)
  amount: BigNumber;          // Principal amount
  interestRate: BigNumber;    // Interest rate in basis points
  duration: BigNumber;        // Loan duration in seconds
  startTime: BigNumber;       // Timestamp when funded (0 if not funded)
  collateralAmount: BigNumber; // Collateral amount locked
  status: LoanStatus;         // Current loan status (0-5)
  repaidAmount: BigNumber;    // Amount repaid so far
  isPartiallyRepaid: boolean; // Flag for partial repayments
  purpose: string;            // Loan purpose
}

interface BorrowerInfoStruct {
  totalBorrowed: BigNumber;    // Total amount borrowed
  activeLoans: BigNumber;      // Number of active loans
  successfulLoans: BigNumber;  // Number of successful repayments
  defaultedLoans: BigNumber;   // Number of defaulted loans
  isVerified: boolean;         // KYC verification status
  creditScore: BigNumber;      // Credit score (0-1000)
}

interface LenderInfoStruct {
  totalLent: BigNumber;        // Total amount lent
  activeLends: BigNumber;      // Number of active lends
  totalEarned: BigNumber;      // Total interest earned
  isVerified: boolean;         // KYC verification status
  reputationScore: BigNumber;  // Lender reputation (0-1000)
}

interface PlatformStatsStruct {
  totalLoans: BigNumber;           // Total number of loans
  totalBorrowedAmount: BigNumber;  // Total amount currently borrowed
  totalCollateralLocked: BigNumber; // Total collateral locked
  utilizationRate: BigNumber;      // Current utilization rate
  emergencyStatus: boolean;        // Whether emergency is active
}

enum LoanStatus {
  REQUESTED = 0,  // Loan created, awaiting funding
  FUNDED = 1,     // Loan funded, active
  REPAID = 2,     // Loan successfully repaid
  DEFAULTED = 3,  // Loan defaulted, collateral claimed
  CANCELLED = 4,  // Loan cancelled by borrower
  LIQUIDATED = 5  // Loan liquidated due to collateral issues
}
```

## User Flow Integration

### 1. Borrower Flow

#### Step 1: Check User Status
```typescript
async function checkBorrowerStatus(userAddress: string) {
  const borrowerInfo = await lendingPlatform.borrowers(userAddress);
  const isBlacklisted = await lendingPlatform.blacklisted(userAddress);
  const bdagBalance = await bdagToken.balanceOf(userAddress);
  
  return {
    activeLoans: borrowerInfo.activeLoans.toNumber(),
    creditScore: borrowerInfo.creditScore.toNumber(),
    isVerified: borrowerInfo.isVerified,
    isBlacklisted,
    canBorrow: !isBlacklisted && borrowerInfo.activeLoans.lt(5), // Max 5 loans
    bdagBalance: ethers.utils.formatEther(bdagBalance)
  };
}
```

#### Step 2: Create Loan Request
```typescript
async function createLoanRequest(params: {
  amount: string;           // Amount in BDAG (e.g., "10000")
  interestRate: number;     // Interest rate in basis points (e.g., 1000 for 10%)
  duration: number;         // Duration in days
  collateralAmount: string; // Collateral in BDAG (e.g., "15000")
  purpose: string;          // Loan purpose
}) {
  const amountWei = ethers.utils.parseEther(params.amount);
  const collateralWei = ethers.utils.parseEther(params.collateralAmount);
  const durationSeconds = params.duration * 24 * 60 * 60;
  
  // Validate minimum collateral (120% of loan amount)
  const minCollateral = amountWei.mul(12000).div(10000);
  if (collateralWei.lt(minCollateral)) {
    throw new Error("Insufficient collateral. Minimum 120% required.");
  }
  
  // Step 1: Approve collateral
  const approveTx = await bdagToken.approve(CONTRACTS.LENDING_PLATFORM, collateralWei);
  await approveTx.wait();
  
  // Step 2: Submit loan request
  const loanRequest = {
    amount: amountWei,
    interestRate: params.interestRate,
    duration: durationSeconds,
    collateralAmount: collateralWei,
    purpose: params.purpose
  };
  
  const requestTx = await lendingPlatform.requestLoan(loanRequest);
  const receipt = await requestTx.wait();
  
  // Extract loan ID from events
  const loanRequestedEvent = receipt.events?.find(e => e.event === 'LoanRequested');
  const loanId = loanRequestedEvent?.args?.loanId;
  
  return { loanId: loanId.toNumber(), transactionHash: receipt.transactionHash };
}
```

#### Step 3: Repay Loan
```typescript
async function repayLoan(loanId: number, repaymentAmount?: string) {
  const loan = await lendingPlatform.loans(loanId);
  const totalOwed = await lendingPlatform.calculateTotalRepayment(loanId);
  const remainingDebt = totalOwed.sub(loan.repaidAmount);
  
  const repayAmount = repaymentAmount 
    ? ethers.utils.parseEther(repaymentAmount)
    : remainingDebt; // Full repayment if no amount specified
    
  // Step 1: Approve repayment amount
  const approveTx = await bdagToken.approve(CONTRACTS.LENDING_PLATFORM, repayAmount);
  await approveTx.wait();
  
  // Step 2: Repay loan
  const repayTx = await lendingPlatform.repayLoan(loanId, repayAmount);
  return await repayTx.wait();
}
```

### 2. Lender Flow

#### Step 1: Browse Available Loans
```typescript
async function getAvailableLoans() {
  const totalLoans = await lendingPlatform.loanCounter();
  const availableLoans = [];
  
  for (let i = 1; i <= totalLoans.toNumber(); i++) {
    const loan = await lendingPlatform.loans(i);
    
    if (loan.status === LoanStatus.REQUESTED) {
      const borrowerInfo = await lendingPlatform.borrowers(loan.borrower);
      
      availableLoans.push({
        loanId: i,
        borrower: loan.borrower,
        amount: ethers.utils.formatEther(loan.amount),
        interestRate: loan.interestRate.toNumber() / 100, // Convert to percentage
        duration: loan.duration.toNumber() / (24 * 60 * 60), // Convert to days
        collateral: ethers.utils.formatEther(loan.collateralAmount),
        purpose: loan.purpose,
        borrowerCreditScore: borrowerInfo.creditScore.toNumber(),
        borrowerVerified: borrowerInfo.isVerified
      });
    }
  }
  
  return availableLoans;
}
```

#### Step 2: Fund a Loan
```typescript
async function fundLoan(loanId: number) {
  const loan = await lendingPlatform.loans(loanId);
  
  // Validate loan status
  if (loan.status !== LoanStatus.REQUESTED) {
    throw new Error("Loan is not available for funding");
  }
  
  // Check lender balance
  const lenderBalance = await bdagToken.balanceOf(userAddress);
  if (lenderBalance.lt(loan.amount)) {
    throw new Error("Insufficient BDAG balance");
  }
  
  // Step 1: Approve loan amount
  const approveTx = await bdagToken.approve(CONTRACTS.LENDING_PLATFORM, loan.amount);
  await approveTx.wait();
  
  // Step 2: Fund the loan
  const fundTx = await lendingPlatform.fundLoan(loanId);
  return await fundTx.wait();
}
```

### 3. User Dashboard Data

#### Get User's Loans (Borrower)
```typescript
async function getUserBorrowedLoans(userAddress: string) {
  const loanIds = await lendingPlatform.getUserLoans(userAddress);
  const loans = [];
  
  for (const loanId of loanIds) {
    const loan = await lendingPlatform.loans(loanId);
    const totalOwed = await lendingPlatform.calculateTotalRepayment(loanId.toNumber());
    const remainingDebt = totalOwed.sub(loan.repaidAmount);
    
    loans.push({
      loanId: loanId.toNumber(),
      amount: ethers.utils.formatEther(loan.amount),
      interestRate: loan.interestRate.toNumber() / 100,
      status: loan.status,
      totalOwed: ethers.utils.formatEther(totalOwed),
      remainingDebt: ethers.utils.formatEther(remainingDebt),
      collateral: ethers.utils.formatEther(loan.collateralAmount),
      startTime: loan.startTime.toNumber(),
      duration: loan.duration.toNumber(),
      purpose: loan.purpose
    });
  }
  
  return loans;
}
```

#### Get User's Lends (Lender)
```typescript
async function getUserLentLoans(userAddress: string) {
  const loanIds = await lendingPlatform.getUserLends(userAddress);
  const lends = [];
  
  for (const loanId of loanIds) {
    const loan = await lendingPlatform.loans(loanId);
    
    lends.push({
      loanId: loanId.toNumber(),
      borrower: loan.borrower,
      amount: ethers.utils.formatEther(loan.amount),
      interestRate: loan.interestRate.toNumber() / 100,
      status: loan.status,
      repaidAmount: ethers.utils.formatEther(loan.repaidAmount),
      startTime: loan.startTime.toNumber(),
      duration: loan.duration.toNumber()
    });
  }
  
  return lends;
}
```

## Key Questions Answered

### Q: Which function deposits collateral?

**Answer**: Collateral is deposited automatically when calling `requestLoan()`. There's no separate collateral deposit function. The flow is:

1. User approves BDAG tokens: `bdagToken.approve(lendingPlatform, collateralAmount)`
2. User calls `requestLoan()` which transfers the collateral to the contract
3. Collateral is locked until loan is repaid or defaulted

### Q: How to get user's collateral deposited?

**Answer**: Collateral information is retrieved through loan data:

```typescript
async function getUserCollateralInfo(userAddress: string) {
  const loanIds = await lendingPlatform.getUserLoans(userAddress);
  let totalCollateralLocked = ethers.BigNumber.from(0);
  const collateralDetails = [];
  
  for (const loanId of loanIds) {
    const loan = await lendingPlatform.loans(loanId);
    
    // Only count collateral for active loans (REQUESTED or FUNDED)
    if (loan.status === LoanStatus.REQUESTED || loan.status === LoanStatus.FUNDED) {
      totalCollateralLocked = totalCollateralLocked.add(loan.collateralAmount);
      
      collateralDetails.push({
        loanId: loanId.toNumber(),
        collateralAmount: ethers.utils.formatEther(loan.collateralAmount),
        status: loan.status,
        canWithdraw: loan.status === LoanStatus.REQUESTED // Can withdraw if loan not funded yet
      });
    }
  }
  
  return {
    totalCollateralLocked: ethers.utils.formatEther(totalCollateralLocked),
    collateralDetails
  };
}
```

## Platform Constants & Limits

```typescript
const PLATFORM_CONSTANTS = {
  MIN_LOAN_AMOUNT: "1", // 1 BDAG
  MAX_LOAN_AMOUNT: "1000000", // 1M BDAG
  MIN_LOAN_DURATION: 1, // 1 day
  MAX_LOAN_DURATION: 365, // 365 days
  MAX_INTEREST_RATE: 3000, // 30% (in basis points)
  MIN_COLLATERAL_RATIO: 12000, // 120% (in basis points)
  LIQUIDATION_THRESHOLD: 12000, // 120% (in basis points)
  PLATFORM_FEE: 100, // 1% (in basis points)
  GRACE_PERIOD: 24 * 60 * 60, // 24 hours in seconds
  MAX_LOANS_PER_USER: 5
};
```

## Event Listening

```typescript
// Listen to loan events
lendingPlatform.on("LoanRequested", (loanId, borrower, amount, interestRate, collateralAmount, purpose) => {
  console.log(`New loan requested: ${loanId}`);
  // Update UI with new loan
});

lendingPlatform.on("LoanFunded", (loanId, lender, amount) => {
  console.log(`Loan ${loanId} funded by ${lender}`);
  // Update loan status in UI
});

lendingPlatform.on("LoanRepaid", (loanId, borrower, amount, isFullRepayment) => {
  console.log(`Loan ${loanId} repayment: ${ethers.utils.formatEther(amount)} BDAG`);
  // Update repayment status
});
```

## Error Handling

```typescript
const ERROR_CODES = {
  "InvalidAmount": "Invalid loan amount. Check min/max limits.",
  "InvalidDuration": "Invalid loan duration. Must be 1-365 days.",
  "InvalidInterestRate": "Interest rate too high. Maximum 30%.",
  "InvalidCollateralAmount": "Insufficient collateral. Minimum 120% required.",
  "InsufficientCollateral": "Collateral ratio below liquidation threshold.",
  "LoanNotFound": "Loan ID does not exist.",
  "NotBorrower": "Only borrower can perform this action.",
  "NotLender": "Only lender can perform this action.",
  "LoanNotActive": "Loan is not in active state.",
  "UserBlacklisted": "User is blacklisted from platform.",
  "MaxLoansExceeded": "Maximum 5 active loans per user."
};
```

This guide provides all the essential integration points for building a complete DApp frontend for the BlockDAG Micro Lending Platform.