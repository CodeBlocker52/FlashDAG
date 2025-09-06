import React, { useState } from "react";
import { Clock, Wallet, User, TrendingUp } from "lucide-react";

// Custom Card Components
const Card = ({ className, children, onClick }) => (
  <div
    className={`rounded-lg shadow-lg overflow-hidden ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className }) => (
  <div className={`p-4 pt-0 ${className}`}>{children}</div>
);

// Custom Alert Component
const Alert = ({ children, className }) => (
  <div className={`p-4 rounded-lg ${className}`}>{children}</div>
);

const LendingDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [account, setAccount] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);

  // Mock borrow requests data
  const borrowRequests = [
    {
      id: 1,
      borrower: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      loanAmount: 2,
      collateralAmount: 3,
      duration: 30,
      interestRate: 5,
      timestamp: "2024-01-10",
    },
    {
      id: 2,
      borrower: "0x932d35Cc6634C0532925a3b844Bc454e4438f55f",
      loanAmount: 1.5,
      collateralAmount: 2.25,
      duration: 15,
      interestRate: 4,
      timestamp: "2024-01-11",
    },
    {
      id: 3,
      borrower: "0x542d35Cc6634C0532925a3b844Bc454e4438f66e",
      loanAmount: 5,
      collateralAmount: 7.5,
      duration: 45,
      interestRate: 6,
      timestamp: "2024-01-11",
    },
  ];

  const connectWallet = async () => {
    setWalletLoading(true);
    try {
      if (typeof window.ethereum === "undefined") {
        setStatus("Please install MetaMask to continue");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) throw new Error("No accounts found");

      setIsConnected(true);
      setAccount(accounts[0]);
      setStatus("Wallet connected successfully");
    } catch (error) {
      if (error.code === 4001) {
        setStatus("Please approve the MetaMask connection");
      } else {
        setStatus("Failed to connect wallet: " + error.message);
      }
    } finally {
      setWalletLoading(false);
    }
  };

  const approveLoan = async (request) => {
    if (!isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    setProcessing(true);
    setStatus("Processing loan approval...");

    try {
      const transactionParams = {
        from: account,
        to: request.borrower,
        value: (request.loanAmount * 1e18).toString(16),
        gas: "21000",
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParams],
      });

      setStatus(`Loan approved! Transaction hash: ${txHash}`);
      setSelectedRequest(null);
    } catch (error) {
      if (error.code === 4001) {
        setStatus("Transaction rejected by user");
      } else {
        setStatus("Error approving loan: " + error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotalRepayment = (amount, rate, duration) => {
    const interest = (amount * rate * duration) / (365 * 100);
    return (amount + interest).toFixed(4);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Lending Dashboard</h1>
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={walletLoading}
            >
              {walletLoading ? "Connecting..." : "Connect MetaMask"}
            </button>
          ) : (
            <div className="text-white bg-gray-800 px-4 py-2 rounded border border-violet-500">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}
        </header>

        {/* Status Alert */}
        {status && (
          <Alert className="mb-6 bg-gray-800 text-white border border-violet-500">
            {status}
          </Alert>
        )}

        {/* Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {borrowRequests.map((request) => (
            <Card
              key={request.id}
              className={`bg-gray-800 border ${
                selectedRequest?.id === request.id
                  ? "border-violet-500"
                  : "border-gray-700"
              } cursor-pointer hover:border-violet-400 transition-colors`}
              onClick={() => setSelectedRequest(request)}
            >
              <CardHeader>
                <CardTitle className="text-white flex justify-between items-center">
                  <span>{request.loanAmount} ETH</span>
                  <span className="text-sm text-gray-400">
                    {request.timestamp}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-300">
                    <User className="w-4 h-4 mr-2" />
                    <span>
                      Borrower: {request.borrower.slice(0, 6)}...
                      {request.borrower.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Wallet className="w-4 h-4 mr-2" />
                    <span>Collateral: {request.collateralAmount} ETH</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Duration: {request.duration} days</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <span>Interest: {request.interestRate}% APR</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-violet-400">
                      Total Repayment:{" "}
                      {calculateTotalRepayment(
                        request.loanAmount,
                        request.interestRate,
                        request.duration
                      )}{" "}
                      ETH
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loan Approval Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="bg-gray-800 border border-violet-500 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">
                  Approve Loan Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-300">
                  <p>Loan Amount: {selectedRequest.loanAmount} ETH</p>
                  <p>Collateral: {selectedRequest.collateralAmount} ETH</p>
                  <p>Duration: {selectedRequest.duration} days</p>
                  <p>Interest Rate: {selectedRequest.interestRate}% APR</p>
                  <p>
                    Total Repayment:{" "}
                    {calculateTotalRepayment(
                      selectedRequest.loanAmount,
                      selectedRequest.interestRate,
                      selectedRequest.duration
                    )}{" "}
                    ETH
                  </p>
                  <div className="flex gap-4 mt-6">
                    <button
                      className="flex-1 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      onClick={() => approveLoan(selectedRequest)}
                      disabled={processing || !isConnected}
                    >
                      {processing ? "Processing..." : "Approve & Send ETH"}
                    </button>
                    <button
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                      onClick={() => setSelectedRequest(null)}
                      disabled={processing}
                    >
                      Cancel
                    </button>
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

export default LendingDashboard;
