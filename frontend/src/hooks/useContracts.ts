// hooks/useContracts.ts
import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContracts,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import type { Address } from "viem";
import {
  CONTRACT_ADDRESSES,
  MICRO_LENDING_PLATFORM_ABI,
  BDAG_TOKEN_ABI,
} from "../config/contracts";

// Types and Interfaces
export interface LoanRequestStruct {
  amount: bigint;
  interestRate: bigint;
  duration: bigint;
  collateralAmount: bigint;
  purpose: string;
}

export interface LoanStruct {
  borrower: Address;
  lender: Address;
  amount: bigint;
  interestRate: bigint;
  duration: bigint;
  startTime: bigint;
  collateralAmount: bigint;
  status: LoanStatus;
  repaidAmount: bigint;
  isPartiallyRepaid: boolean;
  purpose: string;
}

export interface BorrowerInfoStruct {
  totalBorrowed: bigint;
  activeLoans: bigint;
  successfulLoans: bigint;
  defaultedLoans: bigint;
  isVerified: boolean;
  creditScore: bigint;
}

export interface LenderInfoStruct {
  totalLent: bigint;
  activeLends: bigint;
  totalEarned: bigint;
  isVerified: boolean;
  reputationScore: bigint;
}

export interface PlatformStatsStruct {
  totalLoans: bigint;
  totalBorrowedAmount: bigint;
  totalCollateralLocked: bigint;
  utilizationRate: bigint;
  emergencyStatus: boolean;
}

export type LoanStatus =
  | 0 // REQUESTED
  | 1 // FUNDED
  | 2 // REPAID
  | 3 // DEFAULTED
  | 4 // CANCELLED
  | 5; // LIQUIDATED;

export const LoanStatus = {
  REQUESTED: 0 as 0,
  FUNDED: 1 as 1,
  REPAID: 2 as 2,
  DEFAULTED: 3 as 3,
  CANCELLED: 4 as 4,
  LIQUIDATED: 5 as 5,
};

export interface TransformedLoan {
  id: number;
  borrower: string;
  lender: string;
  loanAmount: number;
  collateralAmount: number;
  collateralType: string;
  duration: number;
  interestRate: number;
  timestamp: string;
  purpose: string;
  status: LoanStatus;
  collateralRatio: number;
  repaidAmount: number;
  isPartiallyRepaid: boolean;
  totalOwed: number;
  remainingDebt: number;
  dueDate: string;
  canWithdraw: boolean;
}

export interface UserLoan extends TransformedLoan {
  progress: number;
}

export interface CreateLoanParams {
  amount: string;
  interestRate: number;
  duration: number;
  collateralAmount: string;
  purpose: string;
}

export interface CollateralInfo {
  loanId: number;
  collateralAmount: string;
  status: LoanStatus;
  canWithdraw: boolean;
}

export interface UserCollateralInfo {
  totalCollateralLocked: string;
  collateralDetails: CollateralInfo[];
}

// Platform Constants
export const PLATFORM_CONSTANTS = {
  MIN_LOAN_AMOUNT: "1",
  MAX_LOAN_AMOUNT: "1000000",
  MIN_LOAN_DURATION: 1,
  MAX_LOAN_DURATION: 365,
  MAX_INTEREST_RATE: 3000,
  MIN_COLLATERAL_RATIO: 12000,
  LIQUIDATION_THRESHOLD: 12000,
  PLATFORM_FEE: 100,
  GRACE_PERIOD: 24 * 60 * 60,
  MAX_LOANS_PER_USER: 5,
} as const;

// Error Messages
export const ERROR_CODES = {
  InvalidAmount: "Invalid loan amount. Check min/max limits.",
  InvalidDuration: "Invalid loan duration. Must be 1-365 days.",
  InvalidInterestRate: "Interest rate too high. Maximum 30%.",
  InvalidCollateralAmount: "Insufficient collateral. Minimum 120% required.",
  InsufficientCollateral: "Collateral ratio below liquidation threshold.",
  LoanNotFound: "Loan ID does not exist.",
  NotBorrower: "Only borrower can perform this action.",
  NotLender: "Only lender can perform this action.",
  LoanNotActive: "Loan is not in active state.",
  UserBlacklisted: "User is blacklisted from platform.",
  MaxLoansExceeded: "Maximum 5 active loans per user.",
} as const;

// Custom hook for lending platform interactions
export const useMicroLendingPlatform = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Multi-read contract calls for better performance
  const { data: platformData, refetch: refetchPlatformData } = useReadContracts(
    {
      contracts: [
        {
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "loanCounter",
        },
        {
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "getPlatformStats",
        },
        {
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "treasury",
        },
        {
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "totalBorrowed",
        },
        {
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "totalCollateral",
        },
        {
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "maxUtilizationRate",
        },
        {
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "liquidityEmergency",
        },
      ],
    }
  );

  // User-specific data
  const { data: userData, refetch: refetchUserData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
        abi: MICRO_LENDING_PLATFORM_ABI,
        functionName: "lenders",
        args: [address as Address],
      },
      {
        address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
        abi: MICRO_LENDING_PLATFORM_ABI,
        functionName: "borrowers",
        args: [address as Address],
      },
      {
        address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
        abi: MICRO_LENDING_PLATFORM_ABI,
        functionName: "getUserLoans",
        args: [address as Address],
      },
      {
        address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
        abi: MICRO_LENDING_PLATFORM_ABI,
        functionName: "getUserLends",
        args: [address as Address],
      },
      {
        address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
        abi: MICRO_LENDING_PLATFORM_ABI,
        functionName: "blacklisted",
        args: [address as Address],
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  // Extract data with proper typing
  const loanCounter = platformData?.[0]?.result
    ? Number(platformData[0].result as bigint)
    : 0;
  const platformStats = platformData?.[1]?.result as
    | PlatformStatsStruct
    | undefined;
  const treasury = platformData?.[2]?.result as Address | undefined;
  const totalBorrowed = platformData?.[3]?.result as bigint | undefined;
  const totalCollateral = platformData?.[4]?.result as bigint | undefined;
  const maxUtilizationRate = platformData?.[5]?.result as bigint | undefined;
  const liquidityEmergency = platformData?.[6]?.result as boolean | undefined;

  const lenderInfo = userData?.[0]?.result as LenderInfoStruct | undefined;
  const borrowerInfo = userData?.[1]?.result as BorrowerInfoStruct | undefined;
  const userLoans = userData?.[2]?.result as bigint[] | undefined;
  const userLends = userData?.[3]?.result as bigint[] | undefined;
  const isBlacklisted = userData?.[4]?.result as boolean | undefined;
  console.log("userData", userData);
  // Write functions
  const requestLoan = useCallback(
    async (loanRequest: CreateLoanParams) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        const { amount, interestRate, duration, collateralAmount, purpose } =
          loanRequest;

        // Validate inputs
        const amountWei = parseEther(amount);
        const collateralWei = parseEther(collateralAmount);
        const durationSeconds = BigInt(duration * 24 * 60 * 60);
        const interestRateBasisPoints = BigInt(interestRate * 100);

        // Validate minimum collateral (120% of loan amount)
        const minCollateral =
          (amountWei * BigInt(PLATFORM_CONSTANTS.MIN_COLLATERAL_RATIO)) /
          BigInt(10000);
        if (collateralWei < minCollateral) {
          throw new Error(ERROR_CODES.InvalidCollateralAmount);
        }

        await writeContract({
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "requestLoan",
          args: [
            {
              amount: amountWei,
              interestRate: interestRateBasisPoints,
              duration: durationSeconds,
              collateralAmount: collateralWei,
              purpose: purpose || "General Purpose",
            },
          ],
        });
      } catch (err) {
        console.error("Error requesting loan:", err);
        throw err;
      }
    },
    [address, writeContract]
  );

  const fundLoan = useCallback(
    async (loanId: number) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "fundLoan",
          args: [BigInt(loanId)],
        });
      } catch (err) {
        console.error("Error funding loan:", err);
        throw err;
      }
    },
    [address, writeContract]
  );

  const repayLoan = useCallback(
    async (loanId: number, amount?: string) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        const repayAmount = amount ? parseEther(amount) : BigInt(0);
        await writeContract({
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "repayLoan",
          args: [BigInt(loanId), repayAmount],
        });
      } catch (err) {
        console.error("Error repaying loan:", err);
        throw err;
      }
    },
    [address, writeContract]
  );

  const cancelLoan = useCallback(
    async (loanId: number) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "cancelLoan",
          args: [BigInt(loanId)],
        });
      } catch (err) {
        console.error("Error cancelling loan:", err);
        throw err;
      }
    },
    [address, writeContract]
  );

  const defaultLoan = useCallback(
    async (loanId: number) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "defaultLoan",
          args: [BigInt(loanId)],
        });
      } catch (err) {
        console.error("Error defaulting loan:", err);
        throw err;
      }
    },
    [address, writeContract]
  );

  const liquidateLoan = useCallback(
    async (loanId: number) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
          abi: MICRO_LENDING_PLATFORM_ABI,
          functionName: "liquidateLoan",
          args: [BigInt(loanId)],
        });
      } catch (err) {
        console.error("Error liquidating loan:", err);
        throw err;
      }
    },
    [address, writeContract]
  );

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchPlatformData();
    refetchUserData();
  }, [refetchPlatformData, refetchUserData]);

  return {
    // Platform data
    loanCounter,
    platformStats,
    treasury,
    totalBorrowed: totalBorrowed ? formatEther(totalBorrowed) : "0",
    totalCollateral: totalCollateral ? formatEther(totalCollateral) : "0",
    maxUtilizationRate: maxUtilizationRate ? Number(maxUtilizationRate) : 0,
    liquidityEmergency: liquidityEmergency ?? false,

    // User data
    lenderInfo,
    borrowerInfo,
    userLoans: userLoans || [],
    userLends: userLends || [],
    isBlacklisted: isBlacklisted ?? false,

    // Write functions
    requestLoan,
    fundLoan,
    repayLoan,
    cancelLoan,
    defaultLoan,
    liquidateLoan,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,

    // Refetch functions
    refetchAll,
    refetchPlatformData,
    refetchUserData,
  };
};

// Custom hook for BDAG token interactions
export const useBDAGToken = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Token data
  const { data: tokenData, refetch: refetchTokenData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.BDAG_TOKEN,
        abi: BDAG_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address as Address],
      },
      {
        address: CONTRACT_ADDRESSES.BDAG_TOKEN,
        abi: BDAG_TOKEN_ABI,
        functionName: "allowance",
        args: [address as Address, CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM],
      },
      {
        address: CONTRACT_ADDRESSES.BDAG_TOKEN,
        abi: BDAG_TOKEN_ABI,
        functionName: "totalSupply",
      },
      {
        address: CONTRACT_ADDRESSES.BDAG_TOKEN,
        abi: BDAG_TOKEN_ABI,
        functionName: "name",
      },
      {
        address: CONTRACT_ADDRESSES.BDAG_TOKEN,
        abi: BDAG_TOKEN_ABI,
        functionName: "symbol",
      },
      {
        address: CONTRACT_ADDRESSES.BDAG_TOKEN,
        abi: BDAG_TOKEN_ABI,
        functionName: "decimals",
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  const balance = tokenData?.[0]?.result as bigint | undefined;
  const allowance = tokenData?.[1]?.result as bigint | undefined;
  const totalSupply = tokenData?.[2]?.result as bigint | undefined;
  const name = tokenData?.[3]?.result as string | undefined;
  const symbol = tokenData?.[4]?.result as string | undefined;
  const decimals = tokenData?.[5]?.result as number | undefined;

  // Write functions
  const approve = useCallback(
    async (amount: string) => {
      if (!address) throw new Error("Wallet not connected");
      console.log("amount",parseEther(amount));
      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.BDAG_TOKEN,
          abi: BDAG_TOKEN_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM, parseEther(amount)],
        });
      } catch (err) {
        console.error("Error approving BDAG:", err);
        throw err;
      }
    },
    [address, writeContract]
  );

  const transfer = useCallback(
    async (to: Address, amount: string) => {
      if (!address) throw new Error("Wallet not connected");

      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.BDAG_TOKEN,
          abi: BDAG_TOKEN_ABI,
          functionName: "transfer",
          args: [to, parseEther(amount)],
        });
      } catch (err) {
        console.error("Error transferring BDAG:", err);
        throw err;
      }
    },
    [address, writeContract]
  );

  return {
    // Token info
    name: name ?? "BlockDAG",
    symbol: symbol ?? "BDAG",
    decimals: decimals ?? 18,
    totalSupply: totalSupply ? formatEther(totalSupply) : "0",

    // User balances
    balance: balance ? formatEther(balance) : "0",
    balanceWei: balance ?? BigInt(0),
    allowance: allowance ? formatEther(allowance) : "0",
    allowanceWei: allowance ?? BigInt(0),

    // Write functions
    approve,
    transfer,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,

    // Refetch
    refetchTokenData,
  };
};

// Custom hook to fetch individual loan details
export const useLoanDetails = (loanId: number | null) => {
  const {
    data: loanData,
    refetch,
    isLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
    abi: MICRO_LENDING_PLATFORM_ABI,
    functionName: "loans",
    args: loanId ? [BigInt(loanId)] : undefined,
    query: {
      enabled: !!loanId && loanId > 0,
    },
  });

  const { data: totalRepayment } = useReadContract({
    address: CONTRACT_ADDRESSES.MICRO_LENDING_PLATFORM,
    abi: MICRO_LENDING_PLATFORM_ABI,
    functionName: "calculateTotalRepayment",
    args: loanId ? [BigInt(loanId)] : undefined,
    query: {
      enabled: !!loanId && loanId > 0,
    },
  });

  const loan = loanData as LoanStruct | undefined;

  return {
    loan,
    totalRepayment: totalRepayment as bigint | undefined,
    refetch,
    isLoading,
  };
};

// Custom hook to check borrower status
export const useBorrowerStatus = () => {
  const { address } = useAccount();
  // const { data: balance } = useBalance({ address });
  const { borrowerInfo, isBlacklisted } = useMicroLendingPlatform();
  const { balance } = useBDAGToken();

  return {
    activeLoans: borrowerInfo?.activeLoans
      ? Number(borrowerInfo.activeLoans)
      : 0,
    creditScore: borrowerInfo?.creditScore
      ? Number(borrowerInfo.creditScore)
      : 0,
    isVerified: borrowerInfo?.isVerified ?? false,
    isBlacklisted: isBlacklisted ?? false,
    canBorrow:
      !isBlacklisted &&
      (borrowerInfo
        ? borrowerInfo.activeLoans
          ? Number(borrowerInfo.activeLoans) <
            PLATFORM_CONSTANTS.MAX_LOANS_PER_USER
          : true
        : true),
    bdagBalance: balance,
    totalBorrowed: borrowerInfo?.totalBorrowed
      ? formatEther(borrowerInfo.totalBorrowed)
      : "0",
    successfulLoans: borrowerInfo?.successfulLoans
      ? Number(borrowerInfo.successfulLoans)
      : 0,
    defaultedLoans: borrowerInfo?.defaultedLoans
      ? Number(borrowerInfo.defaultedLoans)
      : 0,
  };
};

// Custom hook to get user's collateral info
export const useUserCollateralInfo = (): UserCollateralInfo => {
  const { address } = useAccount();
  const { userLoans } = useMicroLendingPlatform();
  const [collateralInfo, setCollateralInfo] = useState<UserCollateralInfo>({
    totalCollateralLocked: "0",
    collateralDetails: [],
  });

  useEffect(() => {
    const fetchCollateralInfo = async () => {
      if (!userLoans || userLoans.length === 0) {
        setCollateralInfo({
          totalCollateralLocked: "0",
          collateralDetails: [],
        });
        return;
      }

      // This would need to be implemented with actual contract calls
      // For now, returning mock data structure
      const mockDetails: CollateralInfo[] = userLoans.map((loanId) => ({
        loanId: Number(loanId),
        collateralAmount: "0",
        status: LoanStatus.REQUESTED,
        canWithdraw: true,
      }));

      setCollateralInfo({
        totalCollateralLocked: "0",
        collateralDetails: mockDetails,
      });
    };

    fetchCollateralInfo();
  }, [userLoans, address]);

  return collateralInfo;
};

// Utility functions
export const calculateLoanReturn = (
  amount: string,
  interestRate: number,
  duration: number
): number => {
  const principal = parseFloat(amount);
  const rate = interestRate / 100;
  const days = duration;
  return (principal * rate * days) / 365;
};

export const calculateTotalRepayment = (
  amount: string,
  interestRate: number,
  duration: number
): string => {
  const principal = parseFloat(amount);
  const interest = calculateLoanReturn(amount, interestRate, duration);
  return (principal + interest).toFixed(4);
};

export const calculateCollateralRatio = (
  loanAmount: string,
  collateralAmount: string
): string | null => {
  if (!loanAmount || !collateralAmount) return null;
  const ratio = (parseFloat(collateralAmount) / parseFloat(loanAmount)) * 100;
  return ratio.toFixed(0);
};

export const formatLoanStatus = (status: LoanStatus): string => {
  const statusMap = {
    [LoanStatus.REQUESTED]: "Requested",
    [LoanStatus.FUNDED]: "Funded",
    [LoanStatus.REPAID]: "Repaid",
    [LoanStatus.DEFAULTED]: "Defaulted",
    [LoanStatus.CANCELLED]: "Cancelled",
    [LoanStatus.LIQUIDATED]: "Liquidated",
  };
  return statusMap[status] || "Unknown";
};

export const useNeedsApproval = (amount: string): boolean => {
  const { allowance } = useBDAGToken();
  return parseFloat(allowance) < parseFloat(amount);
};
