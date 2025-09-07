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
import { useAccount, useBalance } from "wagmi";

// Custom Card Components
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

// Custom Alert Component
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
  const { data: balance } = useBalance({ address });

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetails, setShowDetails] = useState({});

  // Enhanced mock borrow requests data
  const borrowRequests = [
    {
      id: 1,
      borrower: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      loanAmount: 2.5,
      collateralAmount: 4.0,
      collateralType: "ETH",
      duration: 30,
      interestRate: 6.8,
      timestamp: "2024-01-15",
      riskScore: 85,
      creditScore: 742,
      previousLoans: 12,
      repaymentHistory: "98%",
      purpose: "DeFi Farming",
      status: "pending",
      collateralRatio: 160,
      estimatedReturn: 0.14,
    },
    {
      id: 2,
      borrower: "0x932d35Cc6634C0532925a3b844Bc454e4438f55f",
      loanAmount: 1.8,
      collateralAmount: 2.88,
      collateralType: "WBTC",
      duration: 15,
      interestRate: 5.2,
      timestamp: "2024-01-14",
      riskScore: 92,
      creditScore: 815,
      previousLoans: 28,
      repaymentHistory: "100%",
      purpose: "Arbitrage Trading",
      status: "pending",
      collateralRatio: 160,
      estimatedReturn: 0.065,
    },
    {
      id: 3,
      borrower: "0x542d35Cc6634C0532925a3b844Bc454e4438f66e",
      loanAmount: 5.0,
      collateralAmount: 8.5,
      collateralType: "ETH",
      duration: 60,
      interestRate: 7.5,
      timestamp: "2024-01-13",
      riskScore: 76,
      creditScore: 680,
      previousLoans: 5,
      repaymentHistory: "80%",
      purpose: "Liquidity Mining",
      status: "pending",
      collateralRatio: 170,
      estimatedReturn: 0.62,
    },
    {
      id: 4,
      borrower: "0x123d35Cc6634C0532925a3b844Bc454e4438f77g",
      loanAmount: 0.8,
      collateralAmount: 1.28,
      collateralType: "ETH",
      duration: 7,
      interestRate: 4.5,
      timestamp: "2024-01-12",
      riskScore: 95,
      creditScore: 890,
      previousLoans: 45,
      repaymentHistory: "100%",
      purpose: "Short-term Liquidity",
      status: "pending",
      collateralRatio: 160,
      estimatedReturn: 0.007,
    },
  ];

  const [filteredRequests, setFilteredRequests] = useState(borrowRequests);

  // Portfolio summary data
  const portfolioData = {
    totalSupplied: "12.45 ETH",
    activeLoans: 8,
    totalEarnings: "1.87 ETH",
    averageAPY: "8.4%",
    pendingReturns: "0.42 ETH",
    riskScore: "Low-Medium",
  };

  useEffect(() => {
    let filtered = borrowRequests;

    // Apply filters
    if (filterBy !== "all") {
      filtered = filtered.filter((req) => {
        switch (filterBy) {
          case "high-yield":
            return req.interestRate >= 6;
          case "low-risk":
            return req.riskScore >= 85;
          case "short-term":
            return req.duration <= 30;
          default:
            return true;
        }
      });
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "highest-rate":
          return b.interestRate - a.interestRate;
        case "lowest-risk":
          return b.riskScore - a.riskScore;
        case "amount":
          return b.loanAmount - a.loanAmount;
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

    setFilteredRequests(filtered);
  }, [filterBy, sortBy, searchTerm]);

  const approveLoan = async (request) => {
    if (!isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    setProcessing(true);
    setStatus("Processing loan approval...");

    try {
      // Simulate transaction processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setStatus(
        `✅ Loan approved! ${
          request.loanAmount
        } ETH supplied to ${request.borrower.slice(0, 6)}...`
      );
      setSelectedRequest(null);
    } catch (error) {
      setStatus("❌ Error approving loan: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotalRepayment = (amount, rate, duration) => {
    const interest = (amount * rate * duration) / (365 * 100);
    return (amount + interest).toFixed(4);
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
                    : "0.0000 ETH"}
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
                  <span className="text-sm text-gray-400">Pending Returns</span>
                </div>
                <div className="text-xl font-bold text-orange-400">
                  {portfolioData.pendingReturns}
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
              <option value="low-risk">Low Risk (85%+)</option>
              <option value="short-term">Short Term (≤30 days)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-gray-900/50 border border-violet-400/20 rounded-xl text-white focus:border-violet-400 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="highest-rate">Highest Rate</option>
              <option value="lowest-risk">Lowest Risk</option>
              <option value="amount">Loan Amount</option>
            </select>

            <button className="px-4 py-3 bg-violet-400/20 border border-violet-400/30 rounded-xl text-violet-400 hover:bg-violet-400/30 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

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
                    {request.loanAmount} ETH
                  </CardTitle>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(
                      request.riskScore
                    )}`}
                  >
                    {request.riskScore}% Safe
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{request.timestamp}</span>
                  <span
                    className={`font-bold ${
                      request.interestRate >= 6
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {request.interestRate}% APR
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-300">
                      <User className="w-4 h-4 mr-2" />
                      <span>Credit Score:</span>
                    </div>
                    <span className="font-semibold text-white">
                      {request.creditScore}
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
                      {request.estimatedReturn.toFixed(4)} ETH
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

                  {/* Toggle detailed view */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDetails(request.id);
                    }}
                    className="w-full mt-3 py-2 text-sm text-violet-400 hover:text-violet-300 flex items-center justify-center gap-2"
                  >
                    {showDetails[request.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {showDetails[request.id] ? "Hide Details" : "Show Details"}
                  </button>

                  {/* Detailed information */}
                  {showDetails[request.id] && (
                    <div className="mt-3 pt-3 border-t border-gray-700 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Previous Loans:</span>
                        <span className="text-white">
                          {request.previousLoans}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Repayment History:
                        </span>
                        <span className="text-green-400">
                          {request.repaymentHistory}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collateral Ratio:</span>
                        <span className="text-blue-400">
                          {request.collateralRatio}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Borrower:</span>
                        <span className="text-white font-mono text-xs">
                          {request.borrower.slice(0, 10)}...
                          {request.borrower.slice(-8)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              No loan requests match your criteria
            </div>
            <button
              onClick={() => {
                setFilterBy("all");
                setSearchTerm("");
              }}
              className="text-violet-400 hover:text-violet-300"
            >
              Clear filters
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
                  Supply {selectedRequest.loanAmount} ETH
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
                          {selectedRequest.loanAmount} ETH
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
                          {selectedRequest.estimatedReturn.toFixed(4)} ETH
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
                          ETH
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Borrower Profile */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-violet-400">
                      Borrower Profile
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Credit Score:</span>
                        <span className="text-white font-semibold">
                          {selectedRequest.creditScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Score:</span>
                        <span
                          className={`font-semibold ${getRiskColor(
                            selectedRequest.riskScore
                          )}`}
                        >
                          {selectedRequest.riskScore}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Previous Loans:</span>
                        <span className="text-white font-semibold">
                          {selectedRequest.previousLoans}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Repayment History:
                        </span>
                        <span className="text-green-400 font-semibold">
                          {selectedRequest.repaymentHistory}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collateral:</span>
                        <span className="text-white font-semibold">
                          {selectedRequest.collateralAmount}{" "}
                          {selectedRequest.collateralType}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-3">
                        <span className="text-gray-400">Purpose:</span>
                        <span className="text-violet-300 font-semibold">
                          {selectedRequest.purpose}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={() => approveLoan(selectedRequest)}
                    disabled={processing || !isConnected}
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Supply & Earn
                      </>
                    )}
                  </button>
                  <button
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                    onClick={() => setSelectedRequest(null)}
                    disabled={processing}
                  >
                    Cancel
                  </button>
                </div>

                {!isConnected && (
                  <Alert variant="warning" className="mt-4">
                    <AlertTriangle className="w-5 h-5" />
                    Please connect your wallet to supply liquidity
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
