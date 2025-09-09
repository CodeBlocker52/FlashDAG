import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Shield,
  Clock,
  TrendingUp,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Activity,
  Target,
  Zap,
  Star,
  Award,
} from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import {
  useMicroLendingPlatform,
  useBDAGToken,
  useBorrowerStatus,
  useUserCollateralInfo,
  useNeedsApproval,
  calculateCollateralRatio,
  PLATFORM_CONSTANTS,
  LoanStatus,
  calculateLoanReturn,
  calculateTotalRepayment,
  formatLoanStatus,
} from "../hooks/useContracts";
import type {
  CreateLoanParams,
  TransformedLoan,
  UserCollateralInfo,
} from "../hooks/useContracts";

// Type definitions
interface ValidationError {
  field: string;
  message: string;
}

interface MarketRates {
  [key: number]: {
    min: number;
    avg: number;
    max: number;
  };
}

interface PortfolioData {
  activeBorrows: string;
  totalCollateral: string;
  nextPayment: string;
  creditUtilization: string;
  avgRate: string;
}

interface UserProfile {
  creditScore: number;
  totalBorrowed: string;
  repaymentRate: string;
  avgLoanSize: string;
  preferredRate: string;
}

// interface RecentEvent {
//   id: number;
//   type: string;
//   amount: string;
//   status: LoanStatus;
//   timestamp: number;
// }

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

const BorrowingDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: nativeBalance } = useBalance({ address });

  // Contract hooks
  const {
    // loanCounter,
    platformStats,
    requestLoan,
    repayLoan,
    cancelLoan,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    // hash,
    refetchAll,
  } = useMicroLendingPlatform();

  const {
    balance: bdagBalance,
    approve,
    isPending: tokenPending,
    isConfirming: tokenConfirming,
    isConfirmed: tokenConfirmed,
    error: tokenError,
  } = useBDAGToken();

  const borrowerStatus = useBorrowerStatus();

  const collateralInfo: UserCollateralInfo = useUserCollateralInfo();

  // Form states
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [collateralAmount, setCollateralAmount] = useState<string>("");
  const [collateralType, setCollateralType] = useState<string>("BDAG");
  const [duration, setDuration] = useState<string>("");
  const [interestRate, setInterestRate] = useState<string>("");
  const [loanPurpose, setLoanPurpose] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // UI states
  const [activeTab, setActiveTab] = useState<"request" | "loans" | "profile">(
    "request"
  );
  const [isApprovalStep, setIsApprovalStep] = useState<boolean>(false);

  // Check if approval is needed
  const needsApproval = useNeedsApproval(collateralAmount || "0");

  // Market rates (in production, these would be fetched from an API)
  const marketRates: MarketRates = {
    7: { min: 4.2, avg: 5.1, max: 6.8 },
    14: { min: 4.5, avg: 5.5, max: 7.2 },
    30: { min: 5.8, avg: 6.8, max: 8.5 },
    60: { min: 6.5, avg: 7.8, max: 9.2 },
    90: { min: 7.2, avg: 8.5, max: 10.1 },
  };

  // Validation function
  const validateLoanRequest = useCallback(
    (params: {
      amount: string;
      collateralAmount: string;
      duration: number;
      interestRate: number;
      purpose: string;
    }): ValidationError[] => {
      const errors: ValidationError[] = [];

      const amount = parseFloat(params.amount);
      const collateral = parseFloat(params.collateralAmount);

      if (!params.amount || amount <= 0) {
        errors.push({
          field: "amount",
          message: "Loan amount must be greater than 0",
        });
      }

      if (amount < parseFloat(PLATFORM_CONSTANTS.MIN_LOAN_AMOUNT)) {
        errors.push({
          field: "amount",
          message: `Minimum loan amount is ${PLATFORM_CONSTANTS.MIN_LOAN_AMOUNT} BDAG`,
        });
      }

      if (amount > parseFloat(PLATFORM_CONSTANTS.MAX_LOAN_AMOUNT)) {
        errors.push({
          field: "amount",
          message: `Maximum loan amount is ${PLATFORM_CONSTANTS.MAX_LOAN_AMOUNT} BDAG`,
        });
      }

      if (!params.collateralAmount || collateral <= 0) {
        errors.push({
          field: "collateral",
          message: "Collateral amount must be greater than 0",
        });
      }

      if (params.amount && params.collateralAmount) {
        const collateralRatio = (collateral / amount) * 100;
        const minRatio = PLATFORM_CONSTANTS.MIN_COLLATERAL_RATIO / 100;

        if (collateralRatio < minRatio) {
          errors.push({
            field: "collateral",
            message: `Minimum collateral ratio is ${minRatio}%`,
          });
        }
      }

      if (params.interestRate > PLATFORM_CONSTANTS.MAX_INTEREST_RATE / 100) {
        errors.push({
          field: "interestRate",
          message: `Maximum interest rate is ${
            PLATFORM_CONSTANTS.MAX_INTEREST_RATE / 100
          }%`,
        });
      }

      if (
        params.duration < PLATFORM_CONSTANTS.MIN_LOAN_DURATION ||
        params.duration > PLATFORM_CONSTANTS.MAX_LOAN_DURATION
      ) {
        errors.push({
          field: "duration",
          message: `Duration must be between ${PLATFORM_CONSTANTS.MIN_LOAN_DURATION} and ${PLATFORM_CONSTANTS.MAX_LOAN_DURATION} days`,
        });
      }

      return errors;
    },
    []
  );

  // Auto-calculate collateral requirement (120% minimum)
  useEffect(() => {
    if (loanAmount) {
      const minCollateralRatio =
        PLATFORM_CONSTANTS.MIN_COLLATERAL_RATIO / 10000;
      const calculatedCollateral = (
        parseFloat(loanAmount) * minCollateralRatio
      ).toFixed(4);
      setCollateralAmount(calculatedCollateral);
    }
  }, [loanAmount, collateralAmount]);

  // Suggest interest rate based on market conditions
  useEffect(() => {
    if (duration && !interestRate) {
      const rates = marketRates[parseInt(duration)];
      if (rates) {
        setInterestRate(rates.avg.toString());
      }
    }
  }, [duration, interestRate, marketRates]);

  // Validate form on changes
  useEffect(() => {
    if (loanAmount || collateralAmount || duration || interestRate) {
      const errors = validateLoanRequest({
        amount: loanAmount,
        collateralAmount,
        duration: parseInt(duration),
        interestRate: parseFloat(interestRate),
        purpose: loanPurpose,
      });
      setValidationErrors(errors);
    }
  }, [
    loanAmount,
    collateralAmount,
    duration,
    interestRate,
    loanPurpose,
    validateLoanRequest,
  ]);

  // Handle contract errors
  useEffect(() => {
    if (error) {
      setStatus(`Error: ${error.message || "Transaction failed"}`);
    }
    if (tokenError) {
      setStatus(
        `Token Error: ${tokenError.message || "Token operation failed"}`
      );
    }
  }, [error, tokenError]);

  // Handle successful transactions
  useEffect(() => {
    if (isConfirmed || tokenConfirmed) {
      if (isApprovalStep && tokenConfirmed) {
        setStatus("Approval confirmed! Now creating loan request...");
        setIsApprovalStep(false);
        // Automatically proceed to loan creation after approval
        createLoanRequest();
      } else if (isConfirmed) {
        setStatus("Loan request created successfully!");
        refetchAll();
        // Reset form after successful loan request
        resetForm();
        setTimeout(() => setActiveTab("loans"), 2000);
      }
    }
  }, [isConfirmed, tokenConfirmed, isApprovalStep, refetchAll]);

  const resetForm = () => {
    setLoanAmount("");
    setCollateralAmount("");
    setDuration("");
    setInterestRate("");
    setLoanPurpose("");
    setStatus("");
    setValidationErrors([]);
  };

  const getHealthScore = () => {
    const ratio = calculateCollateralRatio(loanAmount, collateralAmount);
    if (!ratio) return null;
    const ratioNum = parseFloat(ratio);
    if (ratioNum >= 200) return { score: "Excellent", color: "text-green-400" };
    if (ratioNum >= 170) return { score: "Good", color: "text-blue-400" };
    if (ratioNum >= 150) return { score: "Fair", color: "text-yellow-400" };
    return { score: "Risky", color: "text-red-400" };
  };

  const handleApproval = async (): Promise<void> => {
    if (!collateralAmount) {
      setStatus("Please enter collateral amount first");
      return;
    }

    if (!isConnected || !address) {
      setStatus("Please connect your wallet first");
      return;
    }

    // Check if user has sufficient balance
    if (
      nativeBalance?.value &&
      nativeBalance.value < BigInt(parseFloat(collateralAmount) * 10 ** 18)
    ) {
      setStatus("Insufficient BDAG balance for collateral");
      return;
    }

    setIsApprovalStep(true);
    setStatus("Approving BDAG tokens...");

    try {
      await approve(collateralAmount);
    } catch (err) {
      console.error("Approval failed:", err);
      setStatus(
        `Approval failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsApprovalStep(false);
    }
  };

  const createLoanRequest = async (): Promise<void> => {
    if (!isConnected || !address) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (validationErrors.length > 0) {
      setStatus(
        `Validation errors: ${validationErrors
          .map((e) => e.message)
          .join(", ")}`
      );
      return;
    }

    setStatus("Creating loan request...");

    try {
      const loanRequest: CreateLoanParams = {
        amount: loanAmount,
        interestRate: parseFloat(interestRate),
        duration: parseInt(duration),
        collateralAmount: collateralAmount,
        purpose: loanPurpose || "General Purpose",
      };

      await requestLoan(loanRequest);
    } catch (err) {
      console.error("Error creating loan request:", err);
      setStatus(
        `Error creating loan request: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const applyForLoan = async (): Promise<void> => {
    if (!isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (validationErrors.length > 0) {
      setStatus(
        `Validation errors: ${validationErrors
          .map((e) => e.message)
          .join(", ")}`
      );
      return;
    }

    // Check if approval is needed
    if (needsApproval) {
      await handleApproval();
    } else {
      await createLoanRequest();
    }
  };

  const handleRepayment = async (
    loanId: number,
    amount?: string
  ): Promise<void> => {
    try {
      setStatus("Processing repayment...");
      await repayLoan(loanId, amount);
    } catch (err) {
      console.error("Repayment failed:", err);
      setStatus(
        `Repayment failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleCancelLoan = async (loanId: number): Promise<void> => {
    try {
      setStatus("Cancelling loan...");
      await cancelLoan(loanId);
    } catch (err) {
      console.error("Cancellation failed:", err);
      setStatus(
        `Cancellation failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const getStatusColor = (loanStatus: LoanStatus): string => {
    switch (loanStatus) {
      case LoanStatus.FUNDED:
        return "text-blue-400 bg-blue-400/20";
      case LoanStatus.REPAID:
        return "text-green-400 bg-green-400/20";
      case LoanStatus.REQUESTED:
        return "text-yellow-400 bg-yellow-400/20";
      case LoanStatus.DEFAULTED:
        return "text-red-400 bg-red-400/20";
      case LoanStatus.CANCELLED:
        return "text-gray-400 bg-gray-400/20";
      case LoanStatus.LIQUIDATED:
        return "text-red-400 bg-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  const getStatusIcon = (loanStatus: LoanStatus): React.ReactElement => {
    switch (loanStatus) {
      case LoanStatus.FUNDED:
        return <Activity className="w-4 h-4" />;
      case LoanStatus.REPAID:
        return <CheckCircle className="w-4 h-4" />;
      case LoanStatus.REQUESTED:
        return <Clock className="w-4 h-4" />;
      case LoanStatus.DEFAULTED:
      case LoanStatus.LIQUIDATED:
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  // Portfolio data from contract
  const portfolioData: PortfolioData = {
    activeBorrows: borrowerStatus
      ? `${borrowerStatus.totalBorrowed}`
      : "0 BDAG",
    totalCollateral: collateralInfo
      ? `${collateralInfo.totalCollateralLocked}`
      : "0 BDAG",
    nextPayment: "0.00 BDAG", // This would need to be calculated from loan data
    creditUtilization: borrowerStatus
      ? `${Math.min(
          100,
          (parseFloat(borrowerStatus.totalBorrowed) / 1000) * 100
        ).toFixed(0)}%`
      : "0%",
    avgRate: "6.4%", // This would be calculated from active loans
  };

  // User profile data from contract
  const userProfile: UserProfile = {
    creditScore: borrowerStatus?.creditScore || 0,
    totalBorrowed: borrowerStatus?.totalBorrowed || "0",
    repaymentRate: borrowerStatus
      ? `${(
          (borrowerStatus.successfulLoans /
            Math.max(
              1,
              borrowerStatus.successfulLoans + borrowerStatus.defaultedLoans
            )) *
          100
        ).toFixed(1)}%`
      : "0%",
    avgLoanSize:
      borrowerStatus?.totalBorrowed && borrowerStatus?.successfulLoans
        ? `${(
            parseFloat(borrowerStatus.totalBorrowed) /
            Math.max(1, borrowerStatus.successfulLoans)
          ).toFixed(2)}`
        : "0",
    preferredRate: "6.2%",
  };

  // Mock loans data (in production, this would come from the contract)
  const mockLoans: TransformedLoan[] = [];

  return (
    <div className="min-h-screen bg-gray-900/50 flex flex-col items-center text-white">
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
                <div className="text-sm text-gray-400 mb-1">BDAG Balance</div>
                <div className="text-2xl font-bold text-white">
                  {nativeBalance
                    ? `${parseFloat(nativeBalance.formatted).toFixed(2)} ${
                        nativeBalance.symbol
                      }`
                    : "0.0000 BDAG"}
                </div>
                {borrowerStatus && (
                  <div className="text-sm text-gray-400 mt-1">
                    Credit Score: {borrowerStatus.creditScore}
                  </div>
                )}
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

          {/* User Status Alerts */}
          {borrowerStatus && !borrowerStatus.canBorrow && (
            <Alert variant="warning" className="mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {borrowerStatus.isBlacklisted
                  ? "Your account is currently restricted from borrowing."
                  : `You have reached the maximum of ${PLATFORM_CONSTANTS.MAX_LOANS_PER_USER} active loans.`}
              </div>
            </Alert>
          )}

          {borrowerStatus && borrowerStatus.creditScore < 600 && (
            <Alert variant="info" className="mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Your credit score is below 600. Consider improving your
                repayment history for better rates.
              </div>
            </Alert>
          )}
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
              status.includes("success") || status.includes("confirmed")
                ? "success"
                : status.includes("Error") || status.includes("failed")
                ? "error"
                : "info"
            }
            className="mb-6"
          >
            <div className="flex items-center gap-2">
              {(status.includes("success") || status.includes("confirmed")) && (
                <CheckCircle className="w-5 h-5" />
              )}
              {(status.includes("Error") || status.includes("failed")) && (
                <AlertTriangle className="w-5 h-5" />
              )}
              {!status.includes("success") &&
                !status.includes("Error") &&
                !status.includes("confirmed") &&
                !status.includes("failed") && <Info className="w-5 h-5" />}
              {status}
            </div>
          </Alert>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="error" className="mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <div>
                <strong>Validation Errors:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
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
                        Loan Amount (BDAG) *
                      </label>
                      <input
                        type="number"
                        className="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-violet-400 focus:outline-none transition-colors"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        placeholder="0.00"
                        min={PLATFORM_CONSTANTS.MIN_LOAN_AMOUNT}
                        max={PLATFORM_CONSTANTS.MAX_LOAN_AMOUNT}
                        step="0.01"
                      />
                      <p className="text-gray-400 text-sm mt-2">
                        Range: {PLATFORM_CONSTANTS.MIN_LOAN_AMOUNT} -{" "}
                        {PLATFORM_CONSTANTS.MAX_LOAN_AMOUNT} BDAG
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
                        <option value="">Select Duration</option>
                        <option value="7">7 Days</option>
                        <option value="14">14 Days</option>
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                      </select>
                      {duration && marketRates[parseInt(duration)] && (
                        <p className="text-gray-400 text-sm mt-2">
                          Market rates: {marketRates[parseInt(duration)].min}% -{" "}
                          {marketRates[parseInt(duration)].max}%
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
                          <option value="BDAG">BDAG</option>
                        </select>
                      </div>
                      {calculateCollateralRatio(
                        loanAmount,
                        collateralAmount
                      ) && (
                        <p className="text-gray-400 text-sm mt-2">
                          Collateral ratio:{" "}
                          {calculateCollateralRatio(
                            loanAmount,
                            collateralAmount
                          )}
                          %
                          {getHealthScore() && (
                            <span className={`ml-2 ${getHealthScore()?.color}`}>
                              ({getHealthScore()?.score})
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
                        max={PLATFORM_CONSTANTS.MAX_INTEREST_RATE / 100}
                        step="0.1"
                      />
                      <p className="text-gray-400 text-sm mt-2">
                        Maximum: {PLATFORM_CONSTANTS.MAX_INTEREST_RATE / 100}%
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
                  {loanAmount && interestRate && duration && (
                    <div className="mt-6 p-6 bg-violet-900/20 border border-violet-400/30 rounded-xl">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Loan Summary
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Loan Amount:</span>
                          <div className="text-white font-semibold text-lg">
                            {loanAmount} BDAG
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Interest Cost:</span>
                          <div className="text-orange-400 font-semibold text-lg">
                            {calculateLoanReturn(
                              loanAmount,
                              parseFloat(interestRate),
                              parseInt(duration)
                            ).toFixed(4)}{" "}
                            BDAG
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">
                            Total Repayment:
                          </span>
                          <div className="text-green-400 font-semibold text-lg">
                            {calculateTotalRepayment(
                              loanAmount,
                              parseFloat(interestRate),
                              parseInt(duration)
                            )}{" "}
                            BDAG
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
                      isPending ||
                      isConfirming ||
                      tokenPending ||
                      tokenConfirming ||
                      !loanAmount ||
                      !collateralAmount ||
                      !duration ||
                      !interestRate ||
                      !isConnected ||
                      validationErrors.length > 0 ||
                      (borrowerStatus && !borrowerStatus.canBorrow)
                    }
                  >
                    {isPending ||
                    isConfirming ||
                    tokenPending ||
                    tokenConfirming ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        {isApprovalStep
                          ? "Approving..."
                          : isConfirming
                          ? "Confirming..."
                          : "Processing..."}
                      </>
                    ) : needsApproval ? (
                      <>
                        <Shield className="w-5 h-5" />
                        Approve Collateral
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
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Please connect your wallet to create a loan request
                      </div>
                    </Alert>
                  )}

                  {nativeBalance?.value &&
                    nativeBalance?.value <
                      BigInt(parseFloat(collateralAmount || "0") * 10 ** 18) &&
                    collateralAmount && (
                      <Alert variant="error" className="mt-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Insufficient BDAG balance for collateral. You have{" "}
                          {bdagBalance} BDAG, need {collateralAmount} BDAG.
                        </div>
                      </Alert>
                    )}
                </CardContent>
              </Card>
            </div>

            {/* Market Info Sidebar */}
            <div className="space-y-6">
              {/* Platform Stats */}
              {platformStats && (
                <Card className="bg-gray-900/50 border border-violet-400/20">
                  <CardHeader>
                    <CardTitle className="text-violet-400 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Platform Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Loans:</span>
                        <span className="font-semibold text-white">
                          {platformStats?.totalLoans ? Number(platformStats.totalLoans) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Borrowed:</span>
                        <span className="font-semibold text-white">
                          {platformStats?.totalBorrowedAmount
                            ? (Number(platformStats.totalBorrowedAmount) / 10 ** 18).toFixed(2)
                            : "0.00"}{" "}
                          BDAG
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Collateral:</span>
                        <span className="font-semibold text-white">
                          {platformStats?.totalCollateralLocked
                            ? (Number(platformStats.totalCollateralLocked) / 10 ** 18).toFixed(2)
                            : "0.00"}{" "}
                          BDAG
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Utilization Rate:</span>
                        <span className="font-semibold text-white">
                          {platformStats?.utilizationRate
                            ? (Number(platformStats.utilizationRate) / 100).toFixed(1)
                            : "0.0"}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Emergency Status:</span>
                        <span
                          className={`font-semibold ${
                            platformStats.emergencyStatus
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {platformStats.emergencyStatus ? "Active" : "Normal"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Rates Info */}
              <Card className="bg-gray-900/50 border border-violet-400/20">
                <CardHeader>
                  <CardTitle className="text-violet-400 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Market Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {Object.entries(marketRates).map(([days, rates]) => (
                      <div key={days} className="flex justify-between">
                        <span className="text-gray-400">{days} days:</span>
                        <span className="text-white">
                          {rates.min}% - {rates.max}%
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
                    <Star className="w-5 h-5" />
                    Tips for Better Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Higher collateral ratios get better rates</li>
                    <li>• Shorter loan terms typically have lower rates</li>
                    <li>• Good repayment history improves creditworthiness</li>
                    <li>• Clear loan purposes can attract lenders</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* My Loans Tab */}
        {activeTab === "loans" && (
          <div>
            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Award className="w-6 h-6 text-violet-400" />
                  My Loan Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mockLoans && mockLoans.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="p-4 text-left text-gray-400">
                            Loan ID
                          </th>
                          <th className="p-4 text-left text-gray-400">
                            Amount
                          </th>
                          <th className="p-4 text-left text-gray-400">
                            Collateral
                          </th>
                          <th className="p-4 text-left text-gray-400">Rate</th>
                          <th className="p-4 text-left text-gray-400">
                            Duration
                          </th>
                          <th className="p-4 text-left text-gray-400">
                            Status
                          </th>
                          <th className="p-4 text-left text-gray-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockLoans.map((loan) => (
                          <tr
                            key={loan.id}
                            className="border-b border-gray-700 hover:bg-gray-800"
                          >
                            <td className="p-4">#{loan.id}</td>
                            <td className="p-4">
                              {loan.loanAmount.toFixed(2)} BDAG
                            </td>
                            <td className="p-4">
                              {loan.collateralAmount.toFixed(2)} BDAG
                            </td>
                            <td className="p-4">
                              {loan.interestRate.toFixed(1)}%
                            </td>
                            <td className="p-4">{loan.duration} days</td>
                            <td className="p-4">
                              <div
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  loan.status
                                )}`}
                              >
                                {getStatusIcon(loan.status)}
                                <span>{formatLoanStatus(loan.status)}</span>
                              </div>
                            </td>
                            <td className="p-4 space-x-2">
                              {loan.status === LoanStatus.FUNDED && (
                                <button
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                  onClick={() =>
                                    handleRepayment(
                                      loan.id,
                                      (loan.totalOwed - loan.repaidAmount)
                                        .toFixed(4)
                                        .toString()
                                    )
                                  }
                                  disabled={isPending || isConfirming}
                                >
                                  Repay
                                </button>
                              )}
                              {loan.status === LoanStatus.REQUESTED && (
                                <button
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                  onClick={() => handleCancelLoan(loan.id)}
                                  disabled={isPending || isConfirming}
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                      No loan requests found
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Create your first loan request to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Credit Profile Tab */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-400 mb-2">Credit Score</div>
                <div className="text-4xl font-bold text-white mb-1">
                  {userProfile.creditScore}
                </div>
                <div className="text-xs text-gray-500">out of 1000</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-400 mb-2">Total Borrowed</div>
                <div className="text-2xl font-bold text-white">
                  {userProfile.totalBorrowed} BDAG
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-400 mb-2">Repayment Rate</div>
                <div className="text-2xl font-bold text-green-400">
                  {userProfile.repaymentRate}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-400 mb-2">Avg Loan Size</div>
                <div className="text-2xl font-bold text-white">
                  {userProfile.avgLoanSize} BDAG
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-gray-400 mb-2">Preferred Rate</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {userProfile.preferredRate}
                </div>
              </CardContent>
            </Card>

            {/* Credit Score Breakdown */}
            <Card className="bg-gray-900/50 border border-violet-400/20 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-white">
                  Credit Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Payment History</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-400 h-2 rounded-full"
                          style={{ width: "85%" }}
                        ></div>
                      </div>
                      <span className="text-green-400 text-sm">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Loan Diversity</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                      <span className="text-blue-400 text-sm">60%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Collateral Management</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-400 h-2 rounded-full"
                          style={{ width: "75%" }}
                        ></div>
                      </div>
                      <span className="text-purple-400 text-sm">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Platform Activity</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: "45%" }}
                        ></div>
                      </div>
                      <span className="text-yellow-400 text-sm">45%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-gray-900/50 border border-violet-400/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Loans Created</span>
                    <span className="text-white">
                      {borrowerStatus?.successfulLoans || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Successful Repayments</span>
                    <span className="text-green-400">
                      {borrowerStatus?.successfulLoans || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Default Rate</span>
                    <span className="text-red-400">
                      {borrowerStatus
                        ? (
                            (borrowerStatus.defaultedLoans /
                              Math.max(
                                1,
                                borrowerStatus.successfulLoans +
                                  borrowerStatus.defaultedLoans
                              )) *
                            100
                          ).toFixed(1) + "%"
                        : "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Collateral Ratio</span>
                    <span className="text-blue-400">142%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowingDashboard;