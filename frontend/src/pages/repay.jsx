import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Shield,
  Activity,
  TrendingDown,
  Calculator,
  RefreshCw,
  Info,
  Eye,
  EyeOff,
  Target,
  Award,
  Zap,
  CreditCard,
  Calendar,
  Wallet
} from "lucide-react";
import { useAccount, useBalance } from 'wagmi';

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
    error: "bg-red-900/30 border-red-400/30 text-red-300"
  };
  
  return (
    <div className={`p-4 rounded-xl border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const RepayDashboard = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Form states
  const [repayAmount, setRepayAmount] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  
  // UI states
  const [activeTab, setActiveTab] = useState("loans");
  const [showDetails, setShowDetails] = useState({});

  // Mock active loans data
  const [activeLoans, setActiveLoans] = useState([
    {
      id: 1,
      lender: "0x742d...f44e",
      principalAmount: 2.5,
      interestOwed: 0.14,
      totalOwed: 2.64,
      interestRate: 6.8,
      startDate: "2024-01-10",
      dueDate: "2024-02-09",
      daysRemaining: 15,
      status: "ACTIVE",
      collateral: "4.0 BDAG",
      collateralType: "BDAG",
      healthFactor: 1.87,
      minimumPayment: 0.05,
      nextPaymentDue: "2024-01-25",
      purpose: "DeFi Farming",
      canPartialRepay: true
    },
    {
      id: 2,
      lender: "0x932d...f55f",
      principalAmount: 1.8,
      interestOwed: 0.095,
      totalOwed: 1.895,
      interestRate: 5.2,
      startDate: "2024-01-05",
      dueDate: "2024-01-20",
      daysRemaining: -2,
      status: "OVERDUE",
      collateral: "2.88 WBTC",
      collateralType: "WBTC",
      healthFactor: 1.45,
      minimumPayment: 1.895,
      nextPaymentDue: "2024-01-20",
      purpose: "Arbitrage Trading",
      canPartialRepay: false,
      overdueInterest: 0.012
    },
    {
      id: 3,
      lender: "0x542d...f66e",
      principalAmount: 5.0,
      interestOwed: 0.42,
      totalOwed: 5.42,
      interestRate: 7.5,
      startDate: "2024-01-13",
      dueDate: "2024-03-13",
      daysRemaining: 45,
      status: "ACTIVE",
      collateral: "8.5 BDAG",
      collateralType: "BDAG",
      healthFactor: 2.1,
      minimumPayment: 0.08,
      nextPaymentDue: "2024-02-13",
      purpose: "Liquidity Mining",
      canPartialRepay: true
    },
    {
      id: 4,
      lender: "0x123d...f77g",
      principalAmount: 0.8,
      interestOwed: 0.007,
      totalOwed: 0.807,
      interestRate: 4.5,
      startDate: "2024-01-12",
      dueDate: "2024-01-19",
      daysRemaining: 3,
      status: "DUE_SOON",
      collateral: "1.28 BDAG",
      collateralType: "BDAG",
      healthFactor: 1.92,
      minimumPayment: 0.807,
      nextPaymentDue: "2024-01-19",
      purpose: "Short-term Liquidity",
      canPartialRepay: false
    }
  ]);

  // Repayment history
  const [repaymentHistory] = useState([
    {
      id: 1,
      loanId: 5,
      amount: 1.25,
      type: "Full Repayment",
      timestamp: "2024-01-08",
      txHash: "0xabc123...",
      status: "COMPLETED",
      interestPaid: 0.05,
      principalPaid: 1.2
    },
    {
      id: 2,
      loanId: 6,
      amount: 0.25,
      type: "Partial Payment",
      timestamp: "2024-01-05",
      txHash: "0xdef456...",
      status: "COMPLETED",
      interestPaid: 0.25,
      principalPaid: 0
    },
    {
      id: 3,
      loanId: 3,
      amount: 0.08,
      type: "Interest Payment",
      timestamp: "2024-01-03",
      txHash: "0xghi789...",
      status: "COMPLETED",
      interestPaid: 0.08,
      principalPaid: 0
    }
  ]);

  // Portfolio summary
  const portfolioData = {
    totalBorrowed: "10.1 BDAG",
    totalOwed: "10.862 BDAG",
    nextPayment: "0.05 BDAG",
    totalCollateral: "16.66 BDAG",
    avgHealthFactor: "1.86",
    overdueLoans: 1
  };

  const processRepayment = async (loan, amount, isFullRepayment = false) => {
    if (!isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus("Please enter a valid repayment amount");
      return;
    }

    const repaymentAmount = parseFloat(amount);
    const userBalance = balance ? parseFloat(balance.formatted) : 0;

    if (repaymentAmount > userBalance) {
      setStatus("Insufficient balance for repayment");
      return;
    }

    if (!isFullRepayment && !loan.canPartialRepay && repaymentAmount < loan.totalOwed) {
      setStatus("This loan requires full repayment");
      return;
    }

    setLoading(true);
    setStatus("Processing repayment...");

    try {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update the loan
      setActiveLoans(prev => 
        prev.map(l => {
          if (l.id === loan.id) {
            const remainingOwed = Math.max(0, l.totalOwed - repaymentAmount);
            const interestPaid = Math.min(repaymentAmount, l.interestOwed);
            const principalPaid = Math.max(0, repaymentAmount - l.interestOwed);
            
            return {
              ...l,
              totalOwed: remainingOwed,
              interestOwed: Math.max(0, l.interestOwed - interestPaid),
              principalAmount: Math.max(0, l.principalAmount - principalPaid),
              status: remainingOwed <= 0.001 ? "REPAID" : l.status,
              healthFactor: remainingOwed > 0 ? l.healthFactor + 0.1 : 999
            };
          }
          return l;
        })
      );

      setStatus(`Successfully repaid ${amount} BDAG${isFullRepayment ? ' (Full Repayment)' : ''}`);
      setSelectedLoan(null);
      setRepayAmount("");
      
      setTimeout(() => setActiveTab("history"), 1500);

    } catch (error) {
      setStatus("Error processing repayment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-blue-400 bg-blue-400/20';
      case 'OVERDUE': return 'text-red-400 bg-red-400/20';
      case 'DUE_SOON': return 'text-orange-400 bg-orange-400/20';
      case 'REPAID': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <Activity className="w-4 h-4" />;
      case 'OVERDUE': return <AlertTriangle className="w-4 h-4" />;
      case 'DUE_SOON': return <Clock className="w-4 h-4" />;
      case 'REPAID': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getHealthColor = (factor) => {
    if (factor >= 2.0) return 'text-green-400';
    if (factor >= 1.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const toggleDetails = (id) => {
    setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateDailyInterest = (principal, rate) => {
    return (principal * rate / 100) / 365;
  };

  return (
    <div className="min-h-screen bg-gray-900/50 flex flex-col items-center text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-violet-400 mb-2">
                Repay Dashboard
              </h1>
              <p className="text-xl text-gray-400">
                Manage your loan repayments and maintain healthy positions
              </p>
            </div>

            {isConnected && (
              <div className="mt-4 lg:mt-0 bg-gray-900/50 border border-violet-400/20 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">Your Balance</div>
                <div className="text-2xl font-bold text-white">
                  {balance
                    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
                    : "0.0000 BDAG"}
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Total Borrowed</span>
                </div>
                <div className="text-xl font-bold">
                  {portfolioData.totalBorrowed}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-gray-400">Total Owed</span>
                </div>
                <div className="text-xl font-bold text-red-400">
                  {portfolioData.totalOwed}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-gray-400">Next Payment</span>
                </div>
                <div className="text-xl font-bold text-orange-400">
                  {portfolioData.nextPayment}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Collateral</span>
                </div>
                <div className="text-xl font-bold text-green-400">
                  {portfolioData.totalCollateral}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Avg Health</span>
                </div>
                <div className="text-xl font-bold text-purple-400">
                  {portfolioData.avgHealthFactor}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-gray-400">Overdue</span>
                </div>
                <div className="text-xl font-bold text-red-400">
                  {portfolioData.overdueLoans}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-900/50 p-1 rounded-xl border border-violet-400/20">
          <button
            onClick={() => setActiveTab("loans")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === "loans"
                ? "bg-violet-400 text-black"
                : "text-gray-400 hover:text-violet-400"
            }`}
          >
            Active Loans
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === "history"
                ? "bg-violet-400 text-black"
                : "text-gray-400 hover:text-violet-400"
            }`}
          >
            Payment History
          </button>
        </div>

        {/* Status Alert */}
        {status && (
          <Alert
            variant={
              status.includes("Successfully")
                ? "success"
                : status.includes("Error") || status.includes("Insufficient")
                ? "error"
                : "info"
            }
            className="mb-6"
          >
            <div className="flex items-center gap-2">
              {status.includes("Successfully") && <CheckCircle className="w-5 h-5" />}
              {(status.includes("Error") || status.includes("Insufficient")) && <AlertTriangle className="w-5 h-5" />}
              {!status.includes("Successfully") && !status.includes("Error") && !status.includes("Insufficient") && <Info className="w-5 h-5" />}
              {status}
            </div>
          </Alert>
        )}

        {/* Active Loans Tab */}
        {activeTab === "loans" && (
          <div className="space-y-6">
            {activeLoans.filter(loan => loan.status !== "REPAID").length === 0 ? (
              <Card className="bg-gray-900/50 border border-violet-400/20">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    No active loans
                  </h3>
                  <p className="text-gray-500">
                    All your loans have been repaid!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {activeLoans.filter(loan => loan.status !== "REPAID").map((loan) => (
                  <Card
                    key={loan.id}
                    className={`bg-gray-900/50 border transition-all duration-300 ${
                      loan.status === "OVERDUE" 
                        ? "border-red-400/40 bg-red-900/10" 
                        : loan.status === "DUE_SOON"
                        ? "border-orange-400/40 bg-orange-900/10"
                        : "border-violet-400/20"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-white flex items-center gap-2">
                          <DollarSign className="w-6 h-6 text-violet-400" />
                          {loan.totalOwed.toFixed(4)} BDAG Owed
                        </CardTitle>
                        <div className="flex gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(loan.healthFactor)}`}>
                            Health: {loan.healthFactor.toFixed(2)}
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(loan.status)}`}
                          >
                            {getStatusIcon(loan.status)}
                            {loan.status.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-6">
                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">Loan Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Principal:</span>
                              <span className="text-white font-semibold">
                                {loan.principalAmount.toFixed(4)} BDAG
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Interest:</span>
                              <span className="text-red-400 font-semibold">
                                {loan.interestOwed.toFixed(4)} BDAG
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Rate:</span>
                              <span className="text-yellow-400">
                                {loan.interestRate}% APR
                              </span>
                            </div>
                            {loan.overdueInterest && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Overdue Fee:</span>
                                <span className="text-red-400 font-semibold">
                                  {loan.overdueInterest.toFixed(4)} BDAG
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">Timeline</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Start Date:</span>
                              <span className="text-white">{loan.startDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Due Date:</span>
                              <span className="text-white">{loan.dueDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Days Left:</span>
                              <span className={`${
                                loan.daysRemaining < 0 
                                  ? 'text-red-400 font-semibold' 
                                  : loan.daysRemaining <= 7 
                                    ? 'text-orange-400 font-semibold'
                                    : 'text-green-400'
                              }`}>
                                {loan.daysRemaining < 0 ? `${Math.abs(loan.daysRemaining)} overdue` : loan.daysRemaining}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Next Payment:</span>
                              <span className="text-white">{loan.nextPaymentDue}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">Collateral</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Amount:</span>
                              <span className="text-white font-semibold">
                                {loan.collateral}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Lender:</span>
                              <span className="text-white">{loan.lender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Purpose:</span>
                              <span className="text-violet-300">{loan.purpose}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">Repayment Options</h4>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-gray-400">Min Payment:</span>
                              <div className="text-white font-semibold">
                                {loan.minimumPayment.toFixed(4)} BDAG
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setSelectedLoan(loan)}
                                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                                  loan.status === "OVERDUE"
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : loan.status === "DUE_SOON"
                                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                                    : "bg-violet-500 hover:bg-violet-600 text-white"
                                }`}
                              >
                                {loan.status === "OVERDUE" ? "Pay Now!" : "Repay"}
                              </button>
                              {loan.canPartialRepay && (
                                <span className="text-xs text-gray-400 text-center">
                                  Partial payments allowed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Toggle Details */}
                      <button
                        onClick={() => toggleDetails(loan.id)}
                        className="w-full mt-4 py-2 text-sm text-violet-400 hover:text-violet-300 flex items-center justify-center gap-2"
                      >
                        {showDetails[loan.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showDetails[loan.id] ? "Hide Details" : "Show Details"}
                      </button>

                      {/* Detailed View */}
                      {showDetails[loan.id] && (
                        <div className="mt-4 pt-4 border-t border-gray-700 grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="text-violet-400 font-medium mb-2">Interest Breakdown</h5>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Daily Interest:</span>
                                <span className="text-red-400">
                                  {calculateDailyInterest(loan.principalAmount, loan.interestRate).toFixed(6)} BDAG
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Accrued So Far:</span>
                                <span className="text-yellow-400">
                                  {loan.interestOwed.toFixed(4)} BDAG
                                </span>
                              </div>
                              {loan.status === "OVERDUE" && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Late Fees:</span>
                                  <span className="text-red-400">
                                    {loan.overdueInterest?.toFixed(4)} BDAG
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-violet-400 font-medium mb-2">Health Analysis</h5>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Health Factor:</span>
                                <span className={getHealthColor(loan.healthFactor)}>
                                  {loan.healthFactor.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Liquidation Risk:</span>
                                <span className={loan.healthFactor < 1.5 ? "text-red-400" : "text-green-400"}>
                                  {loan.healthFactor < 1.5 ? "High" : "Low"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">LTV Ratio:</span>
                                <span className="text-blue-400">
                                  {((loan.totalOwed / parseFloat(loan.collateral.split(' ')[0])) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {repaymentHistory.length === 0 ? (
              <Card className="bg-gray-900/50 border border-violet-400/20">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    No payment history
                  </h3>
                  <p className="text-gray-500">
                    Your repayment transactions will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              repaymentHistory.map((payment) => (
                <Card key={payment.id} className="bg-gray-900/50 border border-violet-400/20">
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CreditCard className="w-5 h-5 text-green-400" />
                          <span className="text-xl font-semibold text-white">
                            {payment.amount.toFixed(4)} BDAG
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-400/20 text-green-400">
                            {payment.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                          <div>Type: {payment.type}</div>
                          <div>Date: {payment.timestamp}</div>
                          <div className="font-mono">Tx: {payment.txHash}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-400">Interest Paid: </span>
                            <span className="text-red-400">{payment.interestPaid.toFixed(4)} BDAG</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Principal Paid: </span>
                            <span className="text-blue-400">{payment.principalPaid.toFixed(4)} BDAG</span>
                          </div>
                          <button className="text-violet-400 hover:text-violet-300">
                            View on Explorer
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Repayment Modal */}
        {selectedLoan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border border-violet-400/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-violet-400" />
                  Repay Loan #{selectedLoan.id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Loan Summary */}
                  <div className={`p-6 rounded-xl border ${
                    selectedLoan.status === "OVERDUE" 
                      ? "bg-red-900/20 border-red-400/30" 
                      : "bg-violet-900/20 border-violet-400/30"
                  }`}>
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Loan Summary
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Principal Owed:</span>
                          <span className="text-white font-semibold">
                            {selectedLoan.principalAmount.toFixed(4)} BDAG
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Interest Owed:</span>
                          <span className="text-red-400 font-semibold">
                            {selectedLoan.interestOwed.toFixed(4)} BDAG
                          </span>
                        </div>
                        {selectedLoan.overdueInterest && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Late Fees:</span>
                            <span className="text-red-400 font-semibold">
                              {selectedLoan.overdueInterest.toFixed(4)} BDAG
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Owed:</span>
                          <span className="text-white font-bold text-lg">
                            {selectedLoan.totalOwed.toFixed(4)} BDAG
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Minimum Payment:</span>
                          <span className="text-orange-400 font-semibold">
                            {selectedLoan.minimumPayment.toFixed(4)} BDAG
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Health Factor:</span>
                          <span className={`font-semibold ${getHealthColor(selectedLoan.healthFactor)}`}>
                            {selectedLoan.healthFactor.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Repayment Amount Input */}
                  <div>
                    <label className="block text-white mb-3 font-medium">
                      Repayment Amount (BDAG) *
                    </label>
                    <input
                      type="number"
                      className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-violet-400 focus:outline-none transition-colors"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      max={selectedLoan.totalOwed}
                      step="0.0001"
                    />
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-gray-400">
                        Your Balance: {balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000"} BDAG
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRepayAmount(selectedLoan.minimumPayment.toString())}
                          className="text-orange-400 hover:text-orange-300"
                        >
                          Min Payment
                        </button>
                        <button
                          onClick={() => setRepayAmount(selectedLoan.totalOwed.toString())}
                          className="text-violet-400 hover:text-violet-300"
                        >
                          Full Amount
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Payment Options */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => setRepayAmount((selectedLoan.totalOwed * 0.25).toFixed(4))}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => setRepayAmount((selectedLoan.totalOwed * 0.5).toFixed(4))}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setRepayAmount((selectedLoan.totalOwed * 0.75).toFixed(4))}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                    >
                      75%
                    </button>
                    <button
                      onClick={() => setRepayAmount(selectedLoan.totalOwed.toString())}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                    >
                      100%
                    </button>
                  </div>

                  {/* Payment Impact Preview */}
                  {repayAmount && parseFloat(repayAmount) > 0 && (
                    <div className="bg-blue-900/20 border border-blue-400/30 rounded-xl p-4">
                      <h4 className="text-blue-400 font-medium mb-3">Payment Impact</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Remaining Debt:</span>
                          <div className="text-white font-semibold">
                            {Math.max(0, selectedLoan.totalOwed - parseFloat(repayAmount)).toFixed(4)} BDAG
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">New Health Factor:</span>
                          <div className={`font-semibold ${getHealthColor(selectedLoan.healthFactor + 0.2)}`}>
                            ≈ {(selectedLoan.healthFactor + (parseFloat(repayAmount) / selectedLoan.totalOwed) * 0.5).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {!selectedLoan.canPartialRepay && repayAmount && parseFloat(repayAmount) < selectedLoan.totalOwed && (
                    <Alert variant="warning">
                      <AlertTriangle className="w-5 h-5" />
                      This loan requires full repayment. Partial payments are not allowed.
                    </Alert>
                  )}

                  {selectedLoan.status === "OVERDUE" && (
                    <Alert variant="error">
                      <AlertTriangle className="w-5 h-5" />
                      This loan is overdue! Immediate repayment is required to avoid liquidation.
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
                        selectedLoan.status === "OVERDUE"
                          ? "bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white"
                          : "bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white"
                      }`}
                      onClick={() => {
                        const isFullRepayment = parseFloat(repayAmount) >= selectedLoan.totalOwed - 0.001;
                        processRepayment(selectedLoan, repayAmount, isFullRepayment);
                      }}
                      disabled={
                        loading ||
                        !repayAmount ||
                        parseFloat(repayAmount) <= 0 ||
                        (!selectedLoan.canPartialRepay && parseFloat(repayAmount) < selectedLoan.totalOwed) ||
                        (balance && parseFloat(repayAmount) > parseFloat(balance.formatted)) ||
                        !isConnected
                      }
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          {selectedLoan.status === "OVERDUE" ? "Pay Now" : "Make Payment"}
                        </>
                      )}
                    </button>
                    <button
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                      onClick={() => {
                        setSelectedLoan(null);
                        setRepayAmount("");
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>

                  {!isConnected && (
                    <Alert variant="warning">
                      <AlertTriangle className="w-5 h-5" />
                      Please connect your wallet to make a payment
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepayDashboard;