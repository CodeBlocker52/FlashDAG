import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatEther, parseEther } from "viem";
import {
  useMicroLendingPlatform,
  useBDAGToken,
  calculateLoanReturn,
  formatLoanStatus,
} from "../hooks/useContracts";

// Contract addresses - Replace with actual deployed addresses
const MICRO_LENDING_PLATFORM_ADDRESS = "0x..."; // Your contract address
const BDAG_TOKEN_ADDRESS = "0x..."; // Your BDAG token address

// Custom Card Components (same as before)
const Card = ({ className, children, onClick }) => (
  <div
    className={`rounded-xl shadow-lg overflow-hidden backdrop-blur-sm transition-all duration-300 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className }) => (
  <h3 className={`text-xl font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const Alert = ({ children, className, variant = "info" }) => {
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

const SupplyDashboard = () => {
  const { address, isConnected } = useAccount();
  const { data: nativeBalance } = useBalance({ address });

  // Contract hooks
  const {
    fundLoan,
    loanCounter,
    platformStats,
    lenderInfo,
    isPending: isFundingPending,
    isConfirming: isFundingConfirming,
    isConfirmed: isFundingConfirmed,
    error: fundingError,
  } = useMicroLendingPlatform();

  const {
    balance: bdagBalance,
    allowance,
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
  } = useBDAGToken();

  // Component state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetails, setShowDetails] = useState({});
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // Fetch all pending loans
  const { data: allLoansData, refetch: refetchLoans } = useReadContract({
    address: MICRO_LENDING_PLATFORM_ADDRESS,
    abi: [
      {
        type: "function",
        name: "loans",
        inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        outputs: [
          { name: "borrower", type: "address", internalType: "address" },
          { name: "lender", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "interestRate", type: "uint256", internalType: "uint256" },
          { name: "duration", type: "uint256", internalType: "uint256" },
          { name: "startTime", type: "uint256", internalType: "uint256" },
          {
            name: "collateralAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "status",
            type: "uint8",
            internalType: "enum MicroLendingPlatform.LoanStatus",
          },
          { name: "repaidAmount", type: "uint256", internalType: "uint256" },
          { name: "isPartiallyRepaid", type: "bool", internalType: "bool" },
          { name: "purpose", type: "string", internalType: "string" },
        ],
        stateMutability: "view",
      },
    ],
    functionName: "loans",
    args: [1], // This would need to be called for each loan ID
    enabled: !!loanCounter && loanCounter > 0,
  });

  // Effect to handle transaction confirmations
  useEffect(() => {
    if (isFundingConfirmed) {
      setStatus("✅ Loan funded successfully!");
      setSelectedRequest(null);
      setProcessing(false);
      refetchLoans();
      // Refetch user data
    } else if (fundingError) {
      setStatus(`❌ Error funding loan: ${fundingError.message}`);
      setProcessing(false);
    }
  }, [isFundingConfirmed, fundingError, refetchLoans]);

  useEffect(() => {
    if (isApproveConfirmed) {
      setStatus("✅ BDAG approval successful! You can now fund loans.");
    }
  }, [isApproveConfirmed]);

  // Fetch loan details for all loan IDs
  useEffect(() => {
    const fetchAllLoans = async () => {
      if (!loanCounter || loanCounter === 0) return;

      setLoadingLoans(true);
      try {
        // In a real implementation, you'd use multicall or batch requests
        const loanPromises = [];
        for (let i = 1; i <= loanCounter; i++) {
          // You'd need to make individual contract calls here
          // This is a simplified example
        }

        // For now, using mock data - replace with actual contract data
        setLoans(mockBorrowRequests);
      } catch (error) {
        console.error("Error fetching loans:", error);
        setStatus("❌ Error fetching loan data");
      } finally {
        setLoadingLoans(false);
      }
    };

    fetchAllLoans();
  }, [loanCounter]);

  // Mock data for development - replace with contract data
  const mockBorrowRequests = [
    {
      id: 1,
      borrower: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      loanAmount: 2.5,
      collateralAmount: 4.0,
      collateralType: "BDAG",
      duration: 30,
      interestRate: 6.8,
      timestamp: "2024-01-15",
      purpose: "DeFi Farming",
      status: 0, // 0 = Requested
      collateralRatio: 160,
    },
    {
      id: 2,
      borrower: "0x932d35Cc6634C0532925a3b844Bc454e4438f55f",
      loanAmount: 1.8,
      collateralAmount: 2.88,
      collateralType: "BDAG",
      duration: 15,
      interestRate: 5.2,
      timestamp: "2024-01-14",
      purpose: "Arbitrage Trading",
      status: 0, // 0 = Requested
      collateralRatio: 160,
    },
  ];

  const filteredRequests = loans.filter(
    (loan) =>
      loan.status === 0 && // Only show pending loans
      (filterBy === "all" ||
        (filterBy === "high-yield" && loan.interestRate >= 6) ||
        (filterBy === "short-term" && loan.duration <= 30)) &&
      (searchTerm === "" ||
        loan.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const approveLoan = async (request) => {
    if (!isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    setProcessing(true);
    setStatus("Processing loan approval...");

    try {
      // Check if approval is needed
      const loanAmount = parseFloat(request.loanAmount);
      const currentAllowance = parseFloat(allowance);

      if (currentAllowance < loanAmount) {
        setStatus("Approving BDAG spending...");
        await approve(loanAmount);
        // Wait for approval to complete
        return;
      }

      // Fund the loan
      setStatus("Funding loan...");
      await fundLoan(request.id, request.loanAmount);
    } catch (error) {
      console.error("Error in loan approval:", error);
      setStatus(`❌ Error: ${error.message}`);
      setProcessing(false);
    }
  };

  const calculateTotalRepayment = (amount, rate, duration) => {
    const interest = (amount * rate * duration) / (365 * 100);
    return (amount + interest).toFixed(4);
  };

  const calculateEstimatedReturn = (amount, rate, duration) => {
    return ((amount * rate * duration) / (365 * 100)).toFixed(4);
  };

  const getRiskColor = (score) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  const getRiskBadge = (score) => {
    if (score >= 90) return "bg-green-400/20 text-green-400";
    if (score >= 75) return "bg-yellow-400/20 text-yellow-400";
    return "bg-red-400/20 text-red-400";
  };

  const toggleDetails = (id) => {
    setShowDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Portfolio data from contract
  const portfolioData = {
    totalSupplied: lenderInfo
      ? `${formatEther(lenderInfo[0] || 0)} BDAG`
      : "0.00 BDAG",
    activeLoans: lenderInfo ? Number(lenderInfo[1] || 0) : 0,
    totalEarnings: lenderInfo
      ? `${formatEther(lenderInfo[2] || 0)} BDAG`
      : "0.00 BDAG",
    averageAPY: "8.4%", // Calculate from actual data
    pendingReturns: "0.00 BDAG", // Calculate from active loans
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
                  {balance
                    ? `${parseFloat(balance.formatted).toFixed(4)} ${
                        balance.symbol
                      }`
                    : "0.0000 BDAG"}
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-violet-400" />
                  <span className="text-sm text-gray-400">Total Supplied</span>
                </div>
                <div className="text-xl font-bold">
                  {portfolioData.totalSupplied}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent>
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
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Total Earnings</span>
                </div>
                <div className="text-xl font-bold text-green-400">
                  {portfolioData.totalEarnings}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent>
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
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-gray-400">Platform Loans</span>
                </div>
                <div className="text-xl font-bold text-orange-400">
                  {loanCounter || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent>
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
              status.includes("✅")
                ? "success"
                : status.includes("❌")
                ? "error"
                : "info"
            }
            className="mb-6"
          >
            <div className="flex items-center gap-2">
              {status.includes("✅") && <CheckCircle className="w-5 h-5" />}
              {status.includes("❌") && <AlertTriangle className="w-5 h-5" />}
              {!status.includes("✅") && !status.includes("❌") && (
                <Info className="w-5 h-5" />
              )}
              {status}
            </div>
          </Alert>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by borrower address or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-violet-400/20 rounded-xl text-white placeholder-gray-400 focus:border-violet-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-4 py-3 bg-gray-900/50 border border-violet-400/20 rounded-xl text-white focus:border-violet-400 focus:outline-none"
            >
              <option value="all">All Requests</option>
              <option value="high-yield">High Yield (6%+)</option>
              <option value="short-term">Short Term (≤30 days)</option>
            </select>

            <button
              onClick={() => {
                refetchLoans();
                refetchContractData();
                refetchBalance();
                refetchAllowance();
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
            <div className="text-gray-400">Loading loan requests...</div>
          </div>
        )}

        {/* Loan Requests Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <Card
              key={request.id}
              className={`bg-gray-900/50 border transition-all duration-300 hover:border-violet-400/60 hover:transform hover:scale-105 ${
                selectedRequest?.id === request.id
                  ? "border-violet-400 ring-2 ring-violet-400/30"
                  : "border-violet-400/20"
              } cursor-pointer`}
              onClick={() => setSelectedRequest(request)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-violet-400" />
                    {request.loanAmount} BDAG
                  </CardTitle>
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-400/20 text-blue-400">
                    {formatLoanStatus(request.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{request.timestamp}</span>
                  <span className="font-bold text-green-400">
                    {request.interestRate}% APR
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
                      {request.borrower.slice(0, 6)}...
                      {request.borrower.slice(-4)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-300">
                      <Wallet className="w-4 h-4 mr-2" />
                      <span>Collateral:</span>
                    </div>
                    <span className="font-semibold text-white">
                      {request.collateralAmount} {request.collateralType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-300">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Duration:</span>
                    </div>
                    <span className="font-semibold text-white">
                      {request.duration} days
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-300">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span>Your Return:</span>
                    </div>
                    <span className="font-semibold text-green-400">
                      {calculateEstimatedReturn(
                        request.loanAmount,
                        request.interestRate,
                        request.duration
                      )}{" "}
                      BDAG
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Purpose:</span>
                      <span className="text-violet-300 font-medium">
                        {request.purpose}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Collateral Ratio:</span>
                    <span className="text-blue-400 font-medium">
                      {request.collateralRatio}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && !loadingLoans && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              No pending loan requests available
            </div>
            <button
              onClick={() => {
                setFilterBy("all");
                setSearchTerm("");
                refetchLoans();
              }}
              className="text-violet-400 hover:text-violet-300"
            >
              Refresh data
            </button>
          </div>
        )}

        {/* Loan Approval Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border border-violet-400/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-violet-400" />
                  Fund Loan: {selectedRequest.loanAmount} BDAG
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
                          {selectedRequest.loanAmount} BDAG
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Interest Rate:</span>
                        <span className="text-green-400 font-semibold">
                          {selectedRequest.interestRate}% APR
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white font-semibold">
                          {selectedRequest.duration} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Your Return:</span>
                        <span className="text-green-400 font-semibold">
                          {calculateEstimatedReturn(
                            selectedRequest.loanAmount,
                            selectedRequest.interestRate,
                            selectedRequest.duration
                          )}{" "}
                          BDAG
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-3">
                        <span className="text-gray-400">Total Repayment:</span>
                        <span className="text-white font-bold">
                          {calculateTotalRepayment(
                            selectedRequest.loanAmount,
                            selectedRequest.interestRate,
                            selectedRequest.duration
                          )}{" "}
                          BDAG
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Collateral & Risk Info */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-violet-400">
                      Collateral & Risk
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collateral:</span>
                        <span className="text-white font-semibold">
                          {selectedRequest.collateralAmount}{" "}
                          {selectedRequest.collateralType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collateral Ratio:</span>
                        <span className="text-blue-400 font-semibold">
                          {selectedRequest.collateralRatio}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-blue-400 font-semibold">
                          {formatLoanStatus(selectedRequest.status)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-3">
                        <span className="text-gray-400">Purpose:</span>
                        <span className="text-violet-300 font-semibold">
                          {selectedRequest.purpose}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Borrower:</span>
                        <span className="text-white font-mono text-xs">
                          {selectedRequest.borrower.slice(0, 10)}...
                          {selectedRequest.borrower.slice(-8)}
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
                      {parseFloat(bdagBalance).toFixed(4)} BDAG
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Required Amount:</span>
                    <span className="text-violet-400 font-semibold">
                      {selectedRequest.loanAmount} BDAG
                    </span>
                  </div>
                  {parseFloat(bdagBalance) < selectedRequest.loanAmount && (
                    <div className="mt-2 text-red-400 text-sm">
                      Insufficient BDAG balance
                    </div>
                  )}
                </div>

                {/* Allowance Check */}
                {parseFloat(allowance) < selectedRequest.loanAmount && (
                  <Alert variant="warning" className="mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    You need to approve BDAG spending first. Click "Approve &
                    Fund" to complete both steps.
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={() => approveLoan(selectedRequest)}
                    disabled={
                      processing ||
                      !isConnected ||
                      parseFloat(bdagBalance) < selectedRequest.loanAmount ||
                      isFundingPending ||
                      isFundingConfirming ||
                      isApprovePending ||
                      isApproveConfirming
                    }
                  >
                    {isFundingPending ||
                    isFundingConfirming ||
                    isApprovePending ||
                    isApproveConfirming ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        {isApprovePending || isApproveConfirming
                          ? "Approving..."
                          : "Funding..."}
                      </>
                    ) : parseFloat(allowance) < selectedRequest.loanAmount ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Approve & Fund
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Fund Loan
                      </>
                    )}
                  </button>
                  <button
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                    onClick={() => setSelectedRequest(null)}
                    disabled={
                      processing || isFundingPending || isFundingConfirming
                    }
                  >
                    Cancel
                  </button>
                </div>

                {!isConnected && (
                  <Alert variant="warning" className="mt-4">
                    <AlertTriangle className="w-5 h-5" />
                    Please connect your wallet to fund loans
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

export default SupplyDashboard;
