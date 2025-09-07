import React, { useState, useEffect } from "react";
import { 
  DollarSign,
  Shield,
  Clock,
  TrendingUp,
  Wallet,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Eye,
  Star,
  Activity,
  Target,
  Zap,
  Award
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

const BorrowingDashboard = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  // Form states
  const [loanAmount, setLoanAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [collateralType, setCollateralType] = useState("ETH");
  const [duration, setDuration] = useState("30");
  const [interestRate, setInterestRate] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  
  // UI states
  const [activeTab, setActiveTab] = useState("request");
  const [showCalculator, setShowCalculator] = useState(false);

  // Mock data for user's loan history
  const [loanRequests, setLoanRequests] = useState([
    {
      id: 1,
      amount: "2.5 ETH",
      collateral: "4.0 ETH",
      collateralType: "ETH",
      duration: "30 days",
      interestRate: "6.8%",
      totalRepayment: "2.64 ETH",
      status: "ACTIVE",
      timestamp: "2024-01-10",
      lender: "0x742d...f44e",
      dueDate: "2024-02-09",
      progress: 65
    },
    {
      id: 2,
      amount: "1.2 ETH",
      collateral: "2.0 ETH",
      collateralType: "WBTC",
      duration: "15 days",
      interestRate: "5.2%",
      totalRepayment: "1.23 ETH",
      status: "REPAID",
      timestamp: "2024-01-05",
      lender: "0x932d...f55f",
      dueDate: "2024-01-20",
      progress: 100
    },
    {
      id: 3,
      amount: "0.8 ETH",
      collateral: "1.3 ETH",
      collateralType: "ETH",
      duration: "7 days",
      interestRate: "4.5%",
      totalRepayment: "0.81 ETH",
      status: "PENDING",
      timestamp: "2024-01-14",
      lender: "Matching...",
      dueDate: "2024-01-21",
      progress: 0
    }
  ]);

  // Market rates and suggestions
  const marketRates = {
    "7": { min: 4.2, avg: 5.1, max: 6.8 },
    "14": { min: 4.5, avg: 5.5, max: 7.2 },
    "30": { min: 5.8, avg: 6.8, max: 8.5 },
    "60": { min: 6.5, avg: 7.8, max: 9.2 },
    "90": { min: 7.2, avg: 8.5, max: 10.1 }
  };

  // User credit profile (mock data)
  const userProfile = {
    creditScore: 742,
    totalBorrowed: "15.7 ETH",
    repaymentRate: "94.2%",
    avgLoanSize: "1.8 ETH",
    preferredRate: "6.2%"
  };

  // Portfolio overview
  const portfolioData = {
    activeBorrows: "4.1 ETH",
    totalCollateral: "7.8 ETH",
    nextPayment: "0.67 ETH",
    creditUtilization: "52%",
    avgRate: "6.4%"
  };

  // Auto-calculate collateral requirement
  useEffect(() => {
    if (loanAmount && !collateralAmount) {
      const collateralRatio = 1.6; // 160% collateral ratio
      const calculatedCollateral = (parseFloat(loanAmount) * collateralRatio).toFixed(4);
      setCollateralAmount(calculatedCollateral);
    }
  }, [loanAmount]);

  // Suggest interest rate based on market conditions
  useEffect(() => {
    if (duration && !interestRate) {
      const rates = marketRates[duration];
      if (rates) {
        setInterestRate(rates.avg.toString());
      }
    }
  }, [duration]);

  const calculateTotalRepayment = () => {
    if (!loanAmount || !interestRate || !duration) return null;
    const principal = parseFloat(loanAmount);
    const rate = parseFloat(interestRate);
    const days = parseInt(duration);
    const interest = (principal * rate * days) / (365 * 100);
    return (principal + interest).toFixed(4);
  };

  const calculateCollateralRatio = () => {
    if (!loanAmount || !collateralAmount) return null;
    return ((parseFloat(collateralAmount) / parseFloat(loanAmount)) * 100).toFixed(0);
  };

  const getHealthScore = () => {
    const ratio = calculateCollateralRatio();
    if (!ratio) return null;
    if (ratio >= 200) return { score: "Excellent", color: "text-green-400" };
    if (ratio >= 170) return { score: "Good", color: "text-blue-400" };
    if (ratio >= 150) return { score: "Fair", color: "text-yellow-400" };
    return { score: "Risky", color: "text-red-400" };
  };

  const applyForLoan = async () => {
    if (!isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (!loanAmount || !collateralAmount || !duration || !interestRate) {
      setStatus("Please fill all required fields");
      return;
    }

    setLoading(true);
    setStatus("Creating loan request...");

    try {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newLoan = {
        id: Date.now(),
        amount: `${loanAmount} ETH`,
        collateral: `${collateralAmount} ${collateralType}`,
        collateralType: collateralType,
        duration: `${duration} days`,
        interestRate: `${interestRate}%`,
        totalRepayment: `${calculateTotalRepayment()} ETH`,
        status: "PENDING",
        timestamp: new Date().toLocaleDateString(),
        lender: "Matching...",
        dueDate: new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        progress: 0
      };

      setLoanRequests(prev => [newLoan, ...prev]);
      setStatus("Loan request submitted successfully! Matching with lenders...");
      
      // Reset form
      setLoanAmount("");
      setCollateralAmount("");
      setDuration("30");
      setInterestRate("");
      setLoanPurpose("");
      
      // Switch to loans tab
      setTimeout(() => setActiveTab("loans"), 1500);

    } catch (error) {
      setStatus("Error creating loan request: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-blue-400 bg-blue-400/20';
      case 'REPAID': return 'text-green-400 bg-green-400/20';
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/20';
      case 'OVERDUE': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <Activity className="w-4 h-4" />;
      case 'REPAID': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'OVERDUE': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900/50 flex flex-col items-center  text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-violet-400 mb-2">
                Borrow Dashboard
              </h1>
              <p className="text-xl text-gray-400">
                Access instant liquidity with crypto-backed loans
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

          {/* Portfolio Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Active Borrows</span>
                </div>
                <div className="text-xl font-bold">
                  {portfolioData.activeBorrows}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">
                    Total Collateral
                  </span>
                </div>
                <div className="text-xl font-bold">
                  {portfolioData.totalCollateral}
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
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">
                    Credit Utilization
                  </span>
                </div>
                <div className="text-xl font-bold text-purple-400">
                  {portfolioData.creditUtilization}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-400">Avg Rate</span>
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {portfolioData.avgRate}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-900/50 p-1 rounded-xl border border-violet-400/20">
          <button
            onClick={() => setActiveTab("request")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === "request"
                ? "bg-violet-400 text-black"
                : "text-gray-400 hover:text-violet-400"
            }`}
          >
            Request Loan
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === "loans"
                ? "bg-violet-400 text-black"
                : "text-gray-400 hover:text-violet-400"
            }`}
          >
            My Loans
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === "profile"
                ? "bg-violet-400 text-black"
                : "text-gray-400 hover:text-violet-400"
            }`}
          >
            Credit Profile
          </button>
        </div>

        {/* Status Alert */}
        {status && (
          <Alert
            variant={
              status.includes("success")
                ? "success"
                : status.includes("Error")
                ? "error"
                : "info"
            }
            className="mb-6"
          >
            <div className="flex items-center gap-2">
              {status.includes("success") && (
                <CheckCircle className="w-5 h-5" />
              )}
              {status.includes("Error") && (
                <AlertTriangle className="w-5 h-5" />
              )}
              {!status.includes("success") && !status.includes("Error") && (
                <Info className="w-5 h-5" />
              )}
              {status}
            </div>
          </Alert>
        )}

        {/* Request Loan Tab */}
        {activeTab === "request" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Loan Request Form */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900/50 border border-violet-400/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-violet-400" />
                    Create Loan Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Loan Amount */}
                    <div>
                      <label className="block text-white mb-3 font-medium">
                        Loan Amount (ETH) *
                      </label>
                      <input
                        type="number"
                        className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-violet-400 focus:outline-none transition-colors"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-gray-400 text-sm mt-2">
                        Minimum: 0.1 ETH
                      </p>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-white mb-3 font-medium">
                        Loan Duration *
                      </label>
                      <select
                        className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-violet-400 focus:outline-none transition-colors"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      >
                        <option value="7">7 Days</option>
                        <option value="14">14 Days</option>
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                      </select>
                      {duration && marketRates[duration] && (
                        <p className="text-gray-400 text-sm mt-2">
                          Market rates: {marketRates[duration].min}% -{" "}
                          {marketRates[duration].max}%
                        </p>
                      )}
                    </div>

                    {/* Collateral Amount */}
                    <div>
                      <label className="block text-white mb-3 font-medium">
                        Collateral Amount *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="flex-1 p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-violet-400 focus:outline-none transition-colors"
                          value={collateralAmount}
                          onChange={(e) => setCollateralAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        <select
                          className="px-4 py-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-violet-400 focus:outline-none"
                          value={collateralType}
                          onChange={(e) => setCollateralType(e.target.value)}
                        >
                          <option value="ETH">ETH</option>
                          <option value="WBTC">WBTC</option>
                          <option value="USDC">USDC</option>
                        </select>
                      </div>
                      {calculateCollateralRatio() && (
                        <p className="text-gray-400 text-sm mt-2">
                          Collateral ratio: {calculateCollateralRatio()}%
                          {getHealthScore() && (
                            <span className={`ml-2 ${getHealthScore().color}`}>
                              ({getHealthScore().score})
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <label className="block text-white mb-3 font-medium">
                        Offered Interest Rate (% APR) *
                      </label>
                      <input
                        type="number"
                        className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-violet-400 focus:outline-none transition-colors"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        placeholder="6.50"
                        min="0.1"
                        max="50"
                        step="0.1"
                      />
                      <p className="text-gray-400 text-sm mt-2">
                        Higher rates attract lenders faster
                      </p>
                    </div>

                    {/* Loan Purpose */}
                    <div className="md:col-span-2">
                      <label className="block text-white mb-3 font-medium">
                        Loan Purpose (Optional)
                      </label>
                      <select
                        className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-violet-400 focus:outline-none transition-colors"
                        value={loanPurpose}
                        onChange={(e) => setLoanPurpose(e.target.value)}
                      >
                        <option value="">Select purpose...</option>
                        <option value="DeFi Farming">DeFi Farming</option>
                        <option value="Arbitrage Trading">
                          Arbitrage Trading
                        </option>
                        <option value="Liquidity Mining">
                          Liquidity Mining
                        </option>
                        <option value="NFT Purchase">NFT Purchase</option>
                        <option value="Portfolio Leverage">
                          Portfolio Leverage
                        </option>
                        <option value="Short-term Liquidity">
                          Short-term Liquidity
                        </option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Loan Summary */}
                  {calculateTotalRepayment() && (
                    <div className="mt-6 p-6 bg-violet-900/20 border border-violet-400/30 rounded-xl">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Loan Summary
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Loan Amount:</span>
                          <div className="text-white font-semibold text-lg">
                            {loanAmount} ETH
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Interest Cost:</span>
                          <div className="text-orange-400 font-semibold text-lg">
                            {(calculateTotalRepayment() - loanAmount).toFixed(
                              4
                            )}{" "}
                            ETH
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">
                            Total Repayment:
                          </span>
                          <div className="text-green-400 font-semibold text-lg">
                            {calculateTotalRepayment()} ETH
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    className="w-full mt-6 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white px-6 py-4 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={applyForLoan}
                    disabled={
                      loading ||
                      !loanAmount ||
                      !collateralAmount ||
                      !duration ||
                      !interestRate ||
                      !isConnected
                    }
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Creating Request...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Request Loan
                      </>
                    )}
                  </button>

                  {!isConnected && (
                    <Alert variant="warning" className="mt-4">
                      <AlertTriangle className="w-5 h-5" />
                      Please connect your wallet to create a loan request
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Market Info Sidebar */}
            <div className="space-y-6">
              {/* Market Rates */}
              <Card className="bg-gray-900/50 border border-violet-400/20">
                <CardHeader>
                  <CardTitle className="text-violet-400 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Market Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(marketRates).map(([days, rates]) => (
                      <div
                        key={days}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-400">{days} days:</span>
                        <span className="text-white font-semibold">
                          {rates.avg}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-gray-900/50 border border-violet-400/20">
                <CardHeader>
                  <CardTitle className="text-violet-400 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Pro Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      <span className="text-gray-300">
                        Higher collateral ratios get better rates
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      <span className="text-gray-300">
                        Shorter terms typically have lower interest
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      <span className="text-gray-300">
                        Good credit history unlocks premium rates
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* My Loans Tab */}
        {activeTab === "loans" && (
          <div className="space-y-6">
            {loanRequests.length === 0 ? (
              <Card className="bg-gray-900/50 border border-violet-400/20">
                <CardContent className="p-12 text-center">
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    No loans yet
                  </h3>
                  <p className="text-gray-500">
                    Create your first loan request to get started
                  </p>
                  <button
                    onClick={() => setActiveTab("request")}
                    className="mt-4 bg-violet-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-violet-500 transition-colors"
                  >
                    Request Loan
                  </button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {loanRequests.map((loan) => (
                  <Card
                    key={loan.id}
                    className="bg-gray-900/50 border border-violet-400/20"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-white flex items-center gap-2">
                          <DollarSign className="w-6 h-6 text-violet-400" />
                          {loan.amount}
                        </CardTitle>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(
                            loan.status
                          )}`}
                        >
                          {getStatusIcon(loan.status)}
                          {loan.status}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-6">
                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">
                            Loan Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Amount:</span>
                              <span className="text-white font-semibold">
                                {loan.amount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Duration:</span>
                              <span className="text-white">
                                {loan.duration}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Rate:</span>
                              <span className="text-green-400">
                                {loan.interestRate}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">
                            Collateral
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Amount:</span>
                              <span className="text-white font-semibold">
                                {loan.collateral}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Due Date:</span>
                              <span className="text-white">{loan.dueDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Lender:</span>
                              <span className="text-white">{loan.lender}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">
                            Repayment
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total Due:</span>
                              <span className="text-white font-semibold">
                                {loan.totalRepayment}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Interest:</span>
                              <span className="text-green-400">
                                {loan.interest}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Requested On:
                              </span>
                              <span className="text-white">
                                {loan.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-gray-400 text-sm mb-2">
                            Progress
                          </h4>
                          <div className="w-full bg-gray-800 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full bg-violet-400 transition-all duration-500`}
                              style={{ width: `${loan.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-400 mt-2">
                            {loan.progress}% funded
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Credit Profile Tab */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-6 text-center">
                <Star className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white">
                  {userProfile.creditScore}
                </h3>
                <p className="text-gray-400 mt-2">Credit Score</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-10 h-10 text-green-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white">
                  {userProfile.totalBorrowed}
                </h3>
                <p className="text-gray-400 mt-2">Total Borrowed</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white">
                  {userProfile.repaymentRate}
                </h3>
                <p className="text-gray-400 mt-2">Repayment Rate</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-white">
                  {userProfile.avgLoanSize}
                </h3>
                <p className="text-gray-400 mt-2">Avg Loan Size</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default BorrowingDashboard;