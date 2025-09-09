import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Wallet,
  User,
  TrendingUp,
  Shield,
  DollarSign,
  Activity,
  Filter,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Star,
  Award,
  Target,
  Zap,
} from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatEther, parseEther } from "viem";
// import type { Address } from "viem";
import {
  useMicroLendingPlatform,
  useBDAGToken,
  useAllLoans,
  useNeedsApproval,
  calculateLoanReturn,
  calculateTotalRepayment,
  formatLoanStatus,
  LoanStatus,
  // TransformedLoan,
  // LenderInfoStruct,
  // PlatformStatsStruct,
} from "../hooks/useContracts";

// Type definitions
interface AvailableLoan {
  loanId: number;
  borrower: string;
  amount: string;
  interestRate: number;
  duration: number;
  collateral: string;
  purpose: string;
  borrowerCreditScore: number;
  borrowerVerified: boolean;
  collateralRatio: number;
  estimatedReturn: number;
  totalRepayment: number;
  riskScore: number;
  timestamp: string;
}

interface FilterOptions {
  status: "all" | "high-yield" | "short-term" | "low-risk";
  sortBy: "newest" | "highest-yield" | "lowest-risk" | "shortest-term";
  searchTerm: string;
}

interface PortfolioData {
  totalSupplied: string;
  activeLoans: number;
  totalEarnings: string;
  averageAPY: string;
  pendingReturns: string;
  riskScore: string;
}

// Custom Card Components
const Card: React.FC<{
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ className = "", children, onClick }) => (
  <div
    className={`rounded-xl shadow-lg overflow-hidden backdrop-blur-sm transition-all duration-300 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <h3 className={`text-xl font-semibold ${className}`}>{children}</h3>
);

const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

// Custom Alert Component
const Alert: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: "info" | "success" | "warning" | "error";
}> = ({ children, className = "", variant = "info" }) => {
  const variants = {
    info: "bg-blue-900/30 border-blue-400/30 text-blue-300",
    success: "bg-green-900/30 border-green-400/30 text-green-300",
    warning: "bg-yellow-900/30 border-yellow-400/30 text-yellow-300",
    error: "bg-red-900/30 border-red-400/30 text-red-300",
  };

  return (
    <div className={`p-4 rounded-xl border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const SupplyDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: nativeBalance } = useBalance({ address });

  // Contract hooks
  const {
    loanCounter,
    platformStats,
    lenderInfo,
    fundLoan,
    isPending: isFundingPending,
    isConfirming: isFundingConfirming,
    isConfirmed: isFundingConfirmed,
    error: fundingError,
    refetchAll,
  } = useMicroLendingPlatform();

  const {
    balance: bdagBalance,
    balanceWei,
    allowanceWei,
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
    error: tokenError,
    refetchTokenData,
  } = useBDAGToken();

  // Use the hook to get all available loans
  const { loans: allLoans, loading: loadingLoans, refetch: refetchLoans } = useAllLoans();

  // Component state
  const [selectedLoan, setSelectedLoan] = useState<AvailableLoan | null>(null);
  const [status, setStatus] = useState<string>("");
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    sortBy: "newest",
    searchTerm: "",
  });
  const [isApprovalStep, setIsApprovalStep] = useState<boolean>(false);

  // Check if approval is needed for selected loan
  const needsApproval = useNeedsApproval(selectedLoan?.amount || "0");

  // Transform contract loans to available loans
  const getAvailableLoans = useCallback((): AvailableLoan[] => {
    if (!allLoans || allLoans.length === 0) return [];

    return allLoans
      .filter((loan: any) => loan.status === 0) // Only REQUESTED loans
      .map((loan: any) => ({
        loanId: loan.id,
        borrower: loan.borrower,
        amount: loan?.loanAmount.toString(),
        interestRate: loan.interestRate,
        duration: loan.duration,
        collateral: loan.collateralAmount?.toString(),
        purpose: loan.purpose,
        borrowerCreditScore: 750, // Would come from borrower info
        borrowerVerified: true, // Would come from borrower info
        collateralRatio: loan.collateralRatio,
        estimatedReturn: calculateLoanReturn(
          loan?.loanAmount.toString(),
          loan.interestRate,
          loan.duration
        ),
        totalRepayment: parseFloat(
          calculateTotalRepayment(
            loan?.loanAmount.toString(),
            loan.interestRate,
            loan.duration
          )
        ),
        riskScore: loan.collateralRatio >= 150 ? 85 : 65, // Calculate based on collateral ratio
        timestamp: loan.timestamp,
      }));
  }, [allLoans]);

  const availableLoans = getAvailableLoans();

  // Filter and sort loans
  const filteredLoans = availableLoans
    .filter((loan) => {
      if (filters.status === "high-yield" && loan.interestRate < 6) return false;
      if (filters.status === "short-term" && loan.duration > 30) return false;
      if (filters.status === "low-risk" && loan.riskScore < 80) return false;
      
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          loan.borrower.toLowerCase().includes(searchLower) ||
          loan.purpose.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "highest-yield":
          return b.interestRate - a.interestRate;
        case "lowest-risk":
          return b.riskScore - a.riskScore;
        case "shortest-term":
          return a.duration - b.duration;
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

  // Handle transaction confirmations
  useEffect(() => {
    if (isFundingConfirmed) {
      setStatus("Loan funded successfully!");
      setSelectedLoan(null);
      setIsApprovalStep(false);
      refetchAll();
      refetchLoans();
    } else if (fundingError) {
      setStatus(`Error funding loan: ${fundingError.message || "Transaction failed"}`);
      setIsApprovalStep(false);
    }
  }, [isFundingConfirmed, fundingError, refetchAll, refetchLoans]);

  useEffect(() => {
    if (isApproveConfirmed) {
      setStatus("BDAG approval successful! Now funding loan...");
      setIsApprovalStep(false);
      // Automatically proceed to funding after approval
      if (selectedLoan) {
        fundLoanAfterApproval();
      }
    } else if (tokenError) {
      setStatus(`Approval error: ${tokenError.message || "Approval failed"}`);
      setIsApprovalStep(false);
    }
  }, [isApproveConfirmed, tokenError, selectedLoan]);

  const fundLoanAfterApproval = async (): Promise<void> => {
    if (!selectedLoan) return;

    try {
      setStatus("Funding loan...");
      await fundLoan(selectedLoan.loanId);
    } catch (err) {
      console.error("Error funding loan after approval:", err);
      setStatus(`Error funding loan: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleApproval = async (loan: AvailableLoan): Promise<void> => {
    if (!isConnected || !address) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (balanceWei < parseEther(loan.amount)) {
      setStatus("Insufficient BDAG balance");
      return;
    }

    setIsApprovalStep(true);
    setStatus("Approving BDAG tokens...");

    try {
      await approve(loan.amount);
    } catch (err) {
      console.error("Approval failed:", err);
      setStatus(`Approval failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsApprovalStep(false);
    }
  };

  const handleFundLoan = async (loan: AvailableLoan): Promise<void> => {
    if (!isConnected || !address) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (balanceWei < parseEther(loan.amount)) {
      setStatus("Insufficient BDAG balance");
      return;
    }

    // Check if approval is needed
    if (needsApproval) {
      await handleApproval(loan);
      return;
    }

    setStatus("Funding loan...");

    try {
      await fundLoan(loan.loanId);
    } catch (err) {
      console.error("Error funding loan:", err);
      setStatus(`Error funding loan: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const getRiskColor = (score: number): string => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  const getRiskBadge = (score: number): string => {
    if (score >= 90) return "bg-green-400/20 text-green-400";
    if (score >= 75) return "bg-yellow-400/20 text-yellow-400";
    return "bg-red-400/20 text-red-400";
  };

  const getRiskLabel = (score: number): string => {
    if (score >= 90) return "Low Risk";
    if (score >= 75) return "Medium Risk";
    return "High Risk";
  };

  // Portfolio data from contract
  const portfolioData: PortfolioData = {
    totalSupplied: lenderInfo
      ? formatEther(lenderInfo.totalLent || BigInt(0))
      : "0.00",
    activeLoans: lenderInfo ? Number(lenderInfo.activeLends || 0) : 0,
    totalEarnings: lenderInfo
      ? formatEther(lenderInfo.totalEarned || BigInt(0))
      : "0.00",
    averageAPY: "8.4%", // Calculate from actual loan data
    pendingReturns: "0.00", // Calculate from active loans
    riskScore: "Low-Medium",
  };

  return (
    <div className="min-h-screen bg-gray-900/50 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-violet-400 mb-2">
                Supply Dashboard
              </h1>
              <p className="text-xl text-gray-400">
                Earn yield by supplying liquidity to borrowers
              </p>
            </div>

            {isConnected && (
              <div className="mt-4 lg:mt-0 bg-gray-900/50 border border-violet-400/20 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">Your Balance</div>
                <div className="text-2xl font-bold text-white">
                  {nativeBalance
                    ? `${parseFloat(nativeBalance.formatted).toFixed(2)} ${
                        nativeBalance.symbol
                      }`
                    : "0.0000 BDAG"}
                </div>
                {lenderInfo && (
                  <div className="text-sm text-gray-400 mt-1">
                    Active Lends: {Number(lenderInfo.activeLends || 0)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-violet-400" />
                  <span className="text-sm text-gray-400">Total Supplied</span>
                </div>
                <div className="text-xl font-bold">
                  {portfolioData.totalSupplied} BDAG
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Active Loans</span>
                </div>
                <div className="text-xl font-bold">
                  {portfolioData.activeLoans}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Total Earnings</span>
                </div>
                <div className="text-xl font-bold text-green-400">
                  {portfolioData.totalEarnings} BDAG
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-400">Avg APY</span>
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {portfolioData.averageAPY}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-gray-400">Available Loans</span>
                </div>
                <div className="text-xl font-bold text-orange-400">
                  {availableLoans.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Risk Score</span>
                </div>
                <div className="text-lg font-bold text-purple-400">
                  {portfolioData.riskScore}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Alert */}
        {status && (
          <Alert
            variant={
              status.includes("successfully") || status.includes("successful")
                ? "success"
                : status.includes("Error") || status.includes("failed")
                ? "error"
                : "info"
            }
            className="mb-6"
          >
            <div className="flex items-center gap-2">
              {(status.includes("successfully") || status.includes("successful")) && (
                <CheckCircle className="w-5 h-5" />
              )}
              {(status.includes("Error") || status.includes("failed")) && (
                <AlertTriangle className="w-5 h-5" />
              )}
              {!status.includes("successfully") &&
                !status.includes("Error") &&
                !status.includes("successful") &&
                !status.includes("failed") && <Info className="w-5 h-5" />}
              {status}
            </div>
          </Alert>
        )}

        {/* Platform Stats */}
        {platformStats && (
          <Card className="bg-gray-900/50 border border-violet-400/20 mb-6">
            <CardHeader>
              <CardTitle className="text-violet-400">Platform Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Loans:</span>
                  <div className="text-white font-semibold text-lg">
                    {platformStats?.totalLoans ?Number(platformStats?.totalLoans) : 0}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Total Borrowed:</span>
                  <div className="text-white font-semibold text-lg">
                    {platformStats?.totalBorrowedAmount
                      ? formatEther(platformStats?.totalBorrowedAmount)
                      : "0.00"}{" "}
                    BDAG
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Total Collateral:</span>
                  <div className="text-white font-semibold text-lg">
                    {platformStats?.totalCollateralLocked
                      ? formatEther(platformStats?.totalCollateralLocked)
                      : "0.00"}{" "}
                    BDAG
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Utilization:</span>
                  <div className="text-white font-semibold text-lg">
                    { platformStats?.utilizationRate
                      ? (Number(platformStats?.utilizationRate) / 100).toFixed(1)
                      : "0.0"}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by borrower address or purpose..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-violet-400/20 rounded-xl text-white placeholder-gray-400 focus:border-violet-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterOptions["status"] }))}
              className="px-4 py-3 bg-gray-900/50 border border-violet-400/20 rounded-xl text-white focus:border-violet-400 focus:outline-none"
            >
              <option value="all">All Loans</option>
              <option value="high-yield">High Yield (6%+)</option>
              <option value="short-term">Short Term (≤30 days)</option>
              <option value="low-risk">Low Risk</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterOptions["sortBy"] }))}
              className="px-4 py-3 bg-gray-900/50 border border-violet-400/20 rounded-xl text-white focus:border-violet-400 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="highest-yield">Highest Yield</option>
              <option value="lowest-risk">Lowest Risk</option>
              <option value="shortest-term">Shortest Term</option>
            </select>

            <button
              onClick={() => {
                refetchLoans();
                refetchAll();
                refetchTokenData();
              }}
              disabled={loadingLoans}
              className="px-4 py-3 bg-violet-400/20 border border-violet-400/30 rounded-xl text-violet-400 hover:bg-violet-400/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${loadingLoans ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loadingLoans && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-4" />
            <div className="text-gray-400">Loading available loans...</div>
          </div>
        )}

        {/* Available Loans Grid */}
        {!loadingLoans && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLoans.map((loan) => (
              <Card
                key={loan.loanId}
                className="bg-gray-900/50 border border-violet-400/20 hover:border-violet-400/60 hover:transform hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedLoan(loan)}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <CardTitle className="text-white flex items-center gap-2">
                      <DollarSign className="w-6 h-6 text-violet-400" />
                      {parseFloat(loan.amount).toFixed(2)} BDAG
                    </CardTitle>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(loan.riskScore)}`}>
                      {getRiskLabel(loan.riskScore)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{loan.timestamp}</span>
                    <span className="font-bold text-green-400">
                      {loan.interestRate.toFixed(1)}% APR
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-300">
                        <User className="w-4 h-4 mr-2" />
                        <span>Borrower:</span>
                      </div>
                      <span className="font-semibold text-white font-mono text-xs">
                        {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-300">
                        <Shield className="w-4 h-4 mr-2" />
                        <span>Collateral:</span>
                      </div>
                      <span className="font-semibold text-white">
                        {parseFloat(loan.collateral).toFixed(2)} BDAG
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-300">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Duration:</span>
                      </div>
                      <span className="font-semibold text-white">
                        {loan.duration} days
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-300">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        <span>Your Return:</span>
                      </div>
                      <span className="font-semibold text-green-400">
                        {loan.estimatedReturn.toFixed(4)} BDAG
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-700">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Purpose:</span>
                        <span className="text-violet-300 font-medium">
                          {loan.purpose}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Collateral Ratio:</span>
                      <span className="text-blue-400 font-medium">
                        {loan.collateralRatio}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredLoans.length === 0 && !loadingLoans && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-4">
              No loans match your current filters
            </div>
            <button
              onClick={() => {
                setFilters({
                  status: "all",
                  sortBy: "newest",
                  searchTerm: "",
                });
                refetchLoans();
              }}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Clear filters and refresh
            </button>
          </div>
        )}

        {/* Loan Funding Modal */}
        {selectedLoan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border border-violet-400/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-violet-400" />
                  Fund Loan: {parseFloat(selectedLoan.amount).toFixed(2)} BDAG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Loan Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-violet-400">
                      Loan Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Loan Amount:</span>
                        <span className="text-white font-semibold">
                          {parseFloat(selectedLoan.amount).toFixed(2)} BDAG
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Interest Rate:</span>
                        <span className="text-green-400 font-semibold">
                          {selectedLoan.interestRate.toFixed(1)}% APR
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white font-semibold">
                          {selectedLoan.duration} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Your Return:</span>
                        <span className="text-green-400 font-semibold">
                          {selectedLoan.estimatedReturn.toFixed(4)} BDAG
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-3">
                        <span className="text-gray-400">Total Repayment:</span>
                        <span className="text-white font-bold">
                          {selectedLoan.totalRepayment.toFixed(4)} BDAG
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk & Borrower Info */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-violet-400">
                      Risk Assessment
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Score:</span>
                        <span className={`font-semibold ${getRiskColor(selectedLoan.riskScore)}`}>
                          {selectedLoan.riskScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collateral:</span>
                        <span className="text-white font-semibold">
                          {parseFloat(selectedLoan.collateral).toFixed(2)} BDAG
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collateral Ratio:</span>
                        <span className="text-blue-400 font-semibold">
                          {selectedLoan.collateralRatio}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Credit Score:</span>
                        <span className="text-white font-semibold">
                          {selectedLoan.borrowerCreditScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Verified:</span>
                        <span className={`font-semibold ${selectedLoan.borrowerVerified ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedLoan.borrowerVerified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-3">
                        <span className="text-gray-400">Purpose:</span>
                        <span className="text-violet-300 font-semibold">
                          {selectedLoan.purpose}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Check */}
                <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Your BDAG Balance:</span>
                    <span className="text-white font-semibold">
                      {nativeBalance
                    ? `${parseFloat(nativeBalance.formatted).toFixed(2)} ${
                        nativeBalance.symbol
                      }`
                    : "0.0000 BDAG"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Required Amount:</span>
                    <span className="text-violet-400 font-semibold">
                      {parseFloat(selectedLoan.amount).toFixed(4)} BDAG
                    </span>
                  </div>
                  {balanceWei < parseEther(selectedLoan.amount) && (
                    <div className="mt-2 text-red-400 text-sm">
                      ⚠️ Insufficient BDAG balance
                    </div>
                  )}
                </div>

                {/* Approval Status */}
                {needsApproval && (
                  <Alert variant="warning" className="mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      You need to approve BDAG spending first. Click "Approve & Fund" to complete both steps.
                    </div>
                  </Alert>
                )}

                {/* Investment Summary */}
                <div className="mb-6 p-4 bg-violet-900/20 border border-violet-400/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Investment Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Investment:</span>
                      <div className="text-white font-semibold text-lg">
                        {parseFloat(selectedLoan.amount).toFixed(2)} BDAG
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Expected Return:</span>
                      <div className="text-green-400 font-semibold text-lg">
                        {selectedLoan.estimatedReturn.toFixed(4)} BDAG
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">ROI:</span>
                      <div className="text-yellow-400 font-semibold text-lg">
                        {((selectedLoan.estimatedReturn / parseFloat(selectedLoan.amount)) * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Time to Maturity:</span>
                      <div className="text-blue-400 font-semibold text-lg">
                        {selectedLoan.duration} days
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={() => handleFundLoan(selectedLoan)}
                    disabled={
                      isFundingPending ||
                      isFundingConfirming ||
                      isApprovePending ||
                      isApproveConfirming ||
                      !isConnected ||
                      balanceWei < parseEther(selectedLoan.amount)
                    }
                  >
                    {isFundingPending || isFundingConfirming || isApprovePending || isApproveConfirming ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        {isApprovalStep
                          ? "Approving..."
                          : isFundingConfirming
                          ? "Confirming..."
                          : "Processing..."}
                      </>
                    ) : needsApproval ? (
                      <>
                        <Shield className="w-5 h-5" />
                        Approve & Fund
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Fund Loan
                      </>
                    )}
                  </button>
                  
                  <button
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                    onClick={() => setSelectedLoan(null)}
                    disabled={
                      isFundingPending || isFundingConfirming || isApprovePending || isApproveConfirming
                    }
                  >
                    Cancel
                  </button>
                </div>

                {/* Connection Warning */}
                {!isConnected && (
                  <Alert variant="warning" className="mt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Please connect your wallet to fund loans
                    </div>
                  </Alert>
                )}

                {/* Insufficient Balance Warning */}
                {balanceWei < parseEther(selectedLoan.amount) && isConnected && (
                  <Alert variant="error" className="mt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Insufficient BDAG balance. You need {parseFloat(selectedLoan.amount).toFixed(4)} BDAG but only have {nativeBalance ? `${parseFloat(nativeBalance.formatted).toFixed(2)} ${nativeBalance.symbol}` : "0.0000 BDAG"}.
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// export default SupplyDashboard;


// ErrorBoundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log errorInfo to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
          <h1 className="text-3xl font-bold text-red-400 mb-4">Something went wrong.</h1>
          <p className="mb-2 text-gray-300">{this.state.error?.message}</p>
          <button
            className="bg-violet-500 text-white px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ...existing SupplyDashboard component...

// Wrap export with ErrorBoundary
const SupplyDashboardWithBoundary: React.FC = () => (
  <ErrorBoundary>
    <SupplyDashboard />
  </ErrorBoundary>
);

export default SupplyDashboardWithBoundary;
// ...existing code...