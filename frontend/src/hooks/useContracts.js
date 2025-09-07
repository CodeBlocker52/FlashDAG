// hooks/useContracts.js
import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  MICRO_LENDING_PLATFORM_ADDRESS,
  BDAG_TOKEN_ADDRESS,
  MICRO_LENDING_PLATFORM_ABI,
  BDAG_TOKEN_ABI,
} from "../config/contracts";

// Custom hook for lending platform interactions
export const useMicroLendingPlatform = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Get loan counter to fetch all loans
  const { data: loanCounter, refetch: refetchLoanCounter } = useReadContract({
    address: MICRO_LENDING_PLATFORM_ADDRESS,
    abi: MICRO_LENDING_PLATFORM_ABI,
    functionName: "loanCounter",
  });

  // Get platform stats
  const { data: platformStats, refetch: refetchPlatformStats } =
    useReadContract({
      address: MICRO_LENDING_PLATFORM_ADDRESS,
      abi: MICRO_LENDING_PLATFORM_ABI,
      functionName: "getPlatformStats",
    });

  // Get lender info for connected user
  const { data: lenderInfo, refetch: refetchLenderInfo } = useReadContract({
    address: MICRO_LENDING_PLATFORM_ADDRESS,
    abi: MICRO_LENDING_PLATFORM_ABI,
    functionName: "lenders",
    args: [address],
    enabled: !!address,
  });

  // Fund a loan
  const fundLoan = async (loanId) => {
    try {
      await writeContract({
        address: MICRO_LENDING_PLATFORM_ADDRESS,
        abi: MICRO_LENDING_PLATFORM_ABI,
        functionName: "fundLoan",
        args: [BigInt(loanId)],
      });
    } catch (err) {
      console.error("Error funding loan:", err);
      throw err;
    }
  };

  // Refetch all data
  const refetchAll = () => {
    refetchLoanCounter();
    refetchPlatformStats();
    refetchLenderInfo();
  };

  return {
    fundLoan,
    loanCounter: loanCounter ? Number(loanCounter) : 0,
    platformStats,
    lenderInfo,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    refetchAll,
  };
};

// Custom hook for BDAG token interactions
export const useBDAGToken = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Get BDAG balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: BDAG_TOKEN_ADDRESS,
    abi: BDAG_TOKEN_ABI,
    functionName: "balanceOf",
    args: [address],
    enabled: !!address,
  });

  // Get allowance for lending platform
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: BDAG_TOKEN_ADDRESS,
    abi: BDAG_TOKEN_ABI,
    functionName: "allowance",
    args: [address, MICRO_LENDING_PLATFORM_ADDRESS],
    enabled: !!address,
  });

  // Approve BDAG spending
  const approve = async (amount) => {
    try {
      await writeContract({
        address: BDAG_TOKEN_ADDRESS,
        abi: BDAG_TOKEN_ABI,
        functionName: "approve",
        args: [MICRO_LENDING_PLATFORM_ADDRESS, parseEther(amount.toString())],
      });
    } catch (err) {
      console.error("Error approving BDAG:", err);
      throw err;
    }
  };

  return {
    balance: balance ? formatEther(balance) : "0",
    allowance: allowance ? formatEther(allowance) : "0",
    approve,
    refetchBalance,
    refetchAllowance,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
};

// Custom hook to fetch individual loan details
export const useLoanDetails = (loanId) => {
  const { data: loanData, refetch } = useReadContract({
    address: MICRO_LENDING_PLATFORM_ADDRESS,
    abi: MICRO_LENDING_PLATFORM_ABI,
    functionName: "loans",
    args: [BigInt(loanId)],
    enabled: !!loanId && loanId > 0,
  });

  return {
    loan: loanData,
    refetch,
    isLoading: !loanData && loanId > 0,
  };
};

// Custom hook to fetch all loans
export const useAllLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: loanCounter } = useReadContract({
    address: MICRO_LENDING_PLATFORM_ADDRESS,
    abi: MICRO_LENDING_PLATFORM_ABI,
    functionName: "loanCounter",
  });

  useEffect(() => {
    const fetchAllLoans = async () => {
      if (!loanCounter || loanCounter === 0n) {
        setLoans([]);
        return;
      }

      setLoading(true);
      try {
        const loanPromises = [];
        const count = Number(loanCounter);

        for (let i = 1; i <= count; i++) {
          loanPromises.push(
            // In a real implementation, you'd make contract calls here
            // For now, this is a placeholder structure
            Promise.resolve({
              id: i,
              borrower: `0x${"0".repeat(40)}`,
              lender: `0x${"0".repeat(40)}`,
              amount: 0n,
              interestRate: 0n,
              duration: 0n,
              startTime: 0n,
              collateralAmount: 0n,
              status: 0,
              repaidAmount: 0n,
              isPartiallyRepaid: false,
              purpose: "Loading...",
            })
          );
        }

        const loanResults = await Promise.all(loanPromises);

        // Transform contract data to UI format
        const transformedLoans = loanResults.map((loan) => ({
          id: loan.id,
          borrower: loan.borrower,
          lender: loan.lender,
          loanAmount: parseFloat(formatEther(loan.amount || 0n)),
          collateralAmount: parseFloat(
            formatEther(loan.collateralAmount || 0n)
          ),
          collateralType: "BDAG",
          duration: Number(loan.duration || 0n),
          interestRate: Number(loan.interestRate || 0n) / 100, // Convert basis points to percentage
          timestamp: new Date().toISOString().split("T")[0], // Placeholder
          purpose: loan.purpose || "General Purpose",
          status: Number(loan.status || 0),
          collateralRatio: 160, // Calculate from actual data
          repaidAmount: parseFloat(formatEther(loan.repaidAmount || 0n)),
          isPartiallyRepaid: loan.isPartiallyRepaid || false,
        }));

        setLoans(transformedLoans);
      } catch (error) {
        console.error("Error fetching loans:", error);
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLoans();
  }, [loanCounter]);

  return { loans, loading, refetch: () => window.location.reload() };
};

// Helper function to calculate loan returns
export const calculateLoanReturn = (amount, interestRate, duration) => {
  const interest =
    (parseFloat(amount) * parseFloat(interestRate) * parseInt(duration)) /
    (365 * 100);
  return interest;
};

// Helper function to check if user needs approval
export const useNeedsApproval = (amount) => {
  const { allowance } = useBDAGToken();
  return parseFloat(allowance) < parseFloat(amount);
};
// Helper function to format loan status
export const formatLoanStatus = (status) => {
  const statusMap = {
    0: "Requested",
    1: "Funded",
    2: "Repaid",
    3: "Defaulted",
    4: "Cancelled",
  };
  return statusMap[status] || "Unknown";
};
