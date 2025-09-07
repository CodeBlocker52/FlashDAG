import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Activity,
  Wallet,
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
  Calculator,
  Target,
  Award,
  Zap,
  Star
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

const WithdrawDashboard = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  
  // UI states
  const [activeTab, setActiveTab] = useState("positions");
  const [showDetails, setShowDetails] = useState({});

  // Mock lending positions data
  const [lendingPositions, setLendingPositions] = useState([
    {
      id: 1,
      borrower: "0x742d...f44e",
      principalAmount: 2.5,
      interestEarned: 0.14,
      totalValue: 2.64,
      interestRate: 6.8,
      startDate: "2024-01-10",
      maturityDate: "2024-02-09",
      daysRemaining: 15,
      status: "ACTIVE",
      collateral: "4.0 ETH",
      collateralType: "ETH",
      riskLevel: "Low",
      canWithdrawEarly: false,
      earlyWithdrawPenalty: 0.05
    },
    {
      id: 2,
      borrower: "0x932d...f55f",
      principalAmount: 1.8,
      interestEarned: 0.065,
      totalValue: 1.865,
      interestRate: 5.2,
      startDate: "2024-01-05",
      maturityDate: "2024-01-20",
      daysRemaining: -2,
      status: "MATURED",
      collateral: "2.88 WBTC",
      collateralType: "WBTC",
      riskLevel: "Low",
      canWithdrawEarly: false,
      earlyWithdrawPenalty: 0
    },
    {
      id: 3,
      borrower: "0x542d...f66e",
      principalAmount: 5.0,
      interestEarned: 0.42,
      totalValue: 5.42,
      interestRate: 7.5,
      startDate: "2024-01-13",
      maturityDate: "2024-03-13",
      daysRemaining: 45,
      status: "ACTIVE",
      collateral: "8.5 ETH",
      collateralType: "ETH",
      riskLevel: "Medium",
      canWithdrawEarly: true,
      earlyWithdrawPenalty: 0.15
    },
    {
      id: 4,
      borrower: "0x123d...f77g",
      principalAmount: 0.8,
      interestEarned: 0.007,
      totalValue: 0.807,
      interestRate: 4.5,
      startDate: "2024-01-12",
      maturityDate: "2024-01-19",
      daysRemaining: -5,
      status: "MATURED",
      collateral: "1.28 ETH",
      collateralType: "ETH",
      riskLevel: "Low",
      canWithdrawEarly: false,
      earlyWithdrawPenalty: 0
    }
  ]);

  // Withdrawal history
  const [withdrawHistory] = useState([
    {
      id: 1,
      amount: 1.25,
      type: "Principal + Interest",
      timestamp: "2024-01-08",
      txHash: "0xabc123...",
      status: "COMPLETED"
    },
    {
      id: 2,
      amount: 0.85,
      type: "Interest Only",
      timestamp: "2024-01-05",
      txHash: "0xdef456...",
      status: "COMPLETED"
    },
    {
      id: 3,
      amount: 3.2,
      type: "Early Withdrawal",
      timestamp: "2024-01-03",
      txHash: "0xghi789...",
      status: "COMPLETED"
    }
  ]);

  // Portfolio summary
  const portfolioData = {
    totalSupplied: "12.45 ETH",
    availableToWithdraw: "2.672 ETH",
    totalEarnings: "1.87 ETH",
    pendingInterest: "0.632 ETH",
    activePositions: 2,
    maturedPositions: 2
  };

  const processWithdraw = async (position, amount) => {
    if (!isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus("Please enter a valid withdrawal amount");
      return;
    }

    const maxWithdrawable = position.status === "MATURED" 
      ? position.totalValue 
      : position.canWithdrawEarly 
        ? position.principalAmount - position.earlyWithdrawPenalty
        : 0;

    if (parseFloat(amount) > maxWithdrawable) {
      setStatus(`Maximum withdrawable amount is ${maxWithdrawable.toFixed(4)} ETH`);
      return;
    }

    setLoading(true);
    setStatus("Processing withdrawal...");

    try {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update the position
      setLendingPositions(prev => 
        prev.map(pos => 
          pos.id === position.id 
            ? { 
                ...pos, 
                totalValue: pos.totalValue - parseFloat(amount),
                principalAmount: Math.max(0, pos.principalAmount - parseFloat(amount)),
                status: pos.totalValue - parseFloat(amount) <= 0.001 ? "WITHDRAWN" : pos.status
              }
            : pos
        )
      );

      setStatus(`Successfully withdrew ${amount} ETH from position`);
      setSelectedPosition(null);
      setWithdrawAmount("");
      
      setTimeout(() => setActiveTab("history"), 1500);

    } catch (error) {
      setStatus("Error processing withdrawal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-blue-400 bg-blue-400/20';
      case 'MATURED': return 'text-green-400 bg-green-400/20';
      case 'WITHDRAWN': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <Activity className="w-4 h-4" />;
      case 'MATURED': return <CheckCircle className="w-4 h-4" />;
      case 'WITHDRAWN': return <ArrowDown className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const toggleDetails = (id) => {
    setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateMaxWithdraw = (position) => {
    if (position.status === "MATURED") {
      return position.totalValue;
    }
    if (position.canWithdrawEarly) {
      return Math.max(0, position.principalAmount - position.earlyWithdrawPenalty);
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-900/50 flex flex-col items-center text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-violet-400 mb-2">
                Withdraw Dashboard
              </h1>
              <p className="text-xl text-gray-400">
                Manage your lending positions and withdraw earnings
              </p>
            </div>

            {isConnected && (
              <div className="mt-4 lg:mt-0 bg-gray-900/50 border border-violet-400/20 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">Your Balance</div>
                <div className="text-2xl font-bold text-white">
                  {balance
                    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
                    : "0.0000 ETH"}
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
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
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDown className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Available</span>
                </div>
                <div className="text-xl font-bold text-green-400">
                  {portfolioData.availableToWithdraw}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-400">Total Earnings</span>
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {portfolioData.totalEarnings}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-gray-400">Pending Interest</span>
                </div>
                <div className="text-xl font-bold text-orange-400">
                  {portfolioData.pendingInterest}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Active</span>
                </div>
                <div className="text-xl font-bold text-blue-400">
                  {portfolioData.activePositions}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Matured</span>
                </div>
                <div className="text-xl font-bold text-green-400">
                  {portfolioData.maturedPositions}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-900/50 p-1 rounded-xl border border-violet-400/20">
          <button
            onClick={() => setActiveTab("positions")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === "positions"
                ? "bg-violet-400 text-black"
                : "text-gray-400 hover:text-violet-400"
            }`}
          >
            My Positions
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === "history"
                ? "bg-violet-400 text-black"
                : "text-gray-400 hover:text-violet-400"
            }`}
          >
            Withdrawal History
          </button>
        </div>

        {/* Status Alert */}
        {status && (
          <Alert
            variant={
              status.includes("Successfully")
                ? "success"
                : status.includes("Error")
                ? "error"
                : "info"
            }
            className="mb-6"
          >
            <div className="flex items-center gap-2">
              {status.includes("Successfully") && <CheckCircle className="w-5 h-5" />}
              {status.includes("Error") && <AlertTriangle className="w-5 h-5" />}
              {!status.includes("Successfully") && !status.includes("Error") && <Info className="w-5 h-5" />}
              {status}
            </div>
          </Alert>
        )}

        {/* My Positions Tab */}
        {activeTab === "positions" && (
          <div className="space-y-6">
            {lendingPositions.length === 0 ? (
              <Card className="bg-gray-900/50 border border-violet-400/20">
                <CardContent className="p-12 text-center">
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    No lending positions yet
                  </h3>
                  <p className="text-gray-500">
                    Start supplying liquidity to earn yield
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {lendingPositions.map((position) => (
                  <Card
                    key={position.id}
                    className="bg-gray-900/50 border border-violet-400/20"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-white flex items-center gap-2">
                          <DollarSign className="w-6 h-6 text-violet-400" />
                          {position.totalValue.toFixed(4)} ETH
                        </CardTitle>
                        <div className="flex gap-2">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(position.riskLevel)}`}>
                            {position.riskLevel} Risk
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(position.status)}`}
                          >
                            {getStatusIcon(position.status)}
                            {position.status}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-6">
                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">Position Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Principal:</span>
                              <span className="text-white font-semibold">
                                {position.principalAmount.toFixed(4)} ETH
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Interest:</span>
                              <span className="text-green-400 font-semibold">
                                {position.interestEarned.toFixed(4)} ETH
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Rate:</span>
                              <span className="text-yellow-400">
                                {position.interestRate}% APR
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">Timeline</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Start Date:</span>
                              <span className="text-white">{position.startDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Maturity:</span>
                              <span className="text-white">{position.maturityDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Days Left:</span>
                              <span className={`${position.daysRemaining < 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                {position.daysRemaining < 0 ? 'Matured' : position.daysRemaining}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">Collateral</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Amount:</span>
                              <span className="text-white font-semibold">
                                {position.collateral}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Borrower:</span>
                              <span className="text-white">{position.borrower}</span>
                            </div>
                            {position.canWithdrawEarly && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Early Penalty:</span>
                                <span className="text-red-400">
                                  {position.earlyWithdrawPenalty.toFixed(4)} ETH
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">Actions</h4>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-gray-400">Max Withdraw:</span>
                              <div className="text-white font-semibold">
                                {calculateMaxWithdraw(position).toFixed(4)} ETH
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedPosition(position)}
                              disabled={calculateMaxWithdraw(position) === 0}
                              className="w-full bg-violet-500 hover:bg-violet-600 disabled:bg-gray-600 disabled:text-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Withdraw
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Toggle Details */}
                      <button
                        onClick={() => toggleDetails(position.id)}
                        className="w-full mt-4 py-2 text-sm text-violet-400 hover:text-violet-300 flex items-center justify-center gap-2"
                      >
                        {showDetails[position.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showDetails[position.id] ? "Hide Details" : "Show Details"}
                      </button>

                      {/* Detailed View */}
                      {showDetails[position.id] && (
                        <div className="mt-4 pt-4 border-t border-gray-700 grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="text-violet-400 font-medium mb-2">Earnings Breakdown</h5>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Daily Interest:</span>
                                <span className="text-green-400">
                                  {((position.principalAmount * position.interestRate / 100) / 365).toFixed(6)} ETH
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Projected Total:</span>
                                <span className="text-yellow-400">
                                  {(position.principalAmount * position.interestRate / 100 * (position.daysRemaining + (new Date(position.maturityDate) - new Date(position.startDate)) / (24 * 60 * 60 * 1000)) / 365).toFixed(4)} ETH
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h5 className="text-violet-400 font-medium mb-2">Risk Assessment</h5>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Collateral Ratio:</span>
                                <span className="text-blue-400">160%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Liquidation Risk:</span>
                                <span className={getRiskColor(position.riskLevel)}>
                                  {position.riskLevel}
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

        {/* Withdrawal History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {withdrawHistory.length === 0 ? (
              <Card className="bg-gray-900/50 border border-violet-400/20">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    No withdrawal history
                  </h3>
                  <p className="text-gray-500">
                    Your withdrawal transactions will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              withdrawHistory.map((withdrawal) => (
                <Card key={withdrawal.id} className="bg-gray-900/50 border border-violet-400/20">
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <ArrowDown className="w-5 h-5 text-green-400" />
                          <span className="text-xl font-semibold text-white">
                            {withdrawal.amount.toFixed(4)} ETH
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-400/20 text-green-400">
                            {withdrawal.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                          <div>Type: {withdrawal.type}</div>
                          <div>Date: {withdrawal.timestamp}</div>
                          <div className="font-mono">Tx: {withdrawal.txHash}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Transaction Hash</div>
                        <button className="text-violet-400 hover:text-violet-300 text-sm">
                          View on Explorer
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Withdrawal Modal */}
        {selectedPosition && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border border-violet-400/30 w-full max-w-lg">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white flex items-center gap-3">
                  <ArrowDown className="w-6 h-6 text-violet-400" />
                  Withdraw from Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Position Summary */}
                  <div className="bg-violet-900/20 border border-violet-400/30 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-3">Position Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Total Value:</span>
                        <div className="text-white font-semibold">
                          {selectedPosition.totalValue.toFixed(4)} ETH
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Max Withdraw:</span>
                        <div className="text-green-400 font-semibold">
                          {calculateMaxWithdraw(selectedPosition).toFixed(4)} ETH
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Withdrawal Amount Input */}
                  <div>
                    <label className="block text-white mb-3 font-medium">
                      Withdrawal Amount (ETH) *
                    </label>
                    <input
                      type="number"
                      className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-violet-400 focus:outline-none transition-colors"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      max={calculateMaxWithdraw(selectedPosition)}
                      step="0.0001"
                    />
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-gray-400">
                        Available: {calculateMaxWithdraw(selectedPosition).toFixed(4)} ETH
                      </span>
                      <button
                        onClick={() => setWithdrawAmount(calculateMaxWithdraw(selectedPosition).toString())}
                        className="text-violet-400 hover:text-violet-300"
                      >
                        Use Max
                      </button>
                    </div>
                  </div>

                  {/* Early Withdrawal Warning */}
                  {selectedPosition.canWithdrawEarly && selectedPosition.status === "ACTIVE" && (
                    <Alert variant="warning">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                          <div className="font-medium">Early Withdrawal Penalty</div>
                          <div className="text-sm mt-1">
                            Withdrawing before maturity incurs a penalty of {selectedPosition.earlyWithdrawPenalty.toFixed(4)} ETH
                          </div>
                        </div>
                      </div>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      className="flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                      onClick={() => processWithdraw(selectedPosition, withdrawAmount)}
                      disabled={
                        loading ||
                        !withdrawAmount ||
                        parseFloat(withdrawAmount) <= 0 ||
                        parseFloat(withdrawAmount) > calculateMaxWithdraw(selectedPosition) ||
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
                          <ArrowDown className="w-5 h-5" />
                          Withdraw
                        </>
                      )}
                    </button>
                    <button
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                      onClick={() => {
                        setSelectedPosition(null);
                        setWithdrawAmount("");
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>

                  {!isConnected && (
                    <Alert variant="warning">
                      <AlertTriangle className="w-5 h-5" />
                      Please connect your wallet to withdraw funds
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

export default WithdrawDashboard;