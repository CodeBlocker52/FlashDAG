import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";

const Borrowing = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [account, setAccount] = useState("");

  const [loanAmount, setLoanAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [duration, setDuration] = useState("30");
  const [interestRate, setInterestRate] = useState("5");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [loanRequests, setLoanRequests] = useState([]);

  const calculateTotalRepayment = () => {
    if (!loanAmount || !interestRate || !duration) return null;
    const principal = parseFloat(loanAmount);
    const interest =
      (principal * parseFloat(interestRate) * parseInt(duration)) / (365 * 100);
    return (principal + interest).toFixed(4);
  };

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

  const applyForLoan = async () => {
    if (!isConnected) {
      setStatus("Please connect MetaMask!");
      return;
    }

    try {
      setLoading(true);
      setStatus("Processing transaction...");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newLoan = {
        id: Date.now(),
        amount: loanAmount,
        collateral: collateralAmount,
        duration: duration,
        interestRate: interestRate,
        totalRepayment: calculateTotalRepayment(),
        status: "PENDING",
        timestamp: new Date().toLocaleString(),
      };

      setLoanRequests((prev) => [newLoan, ...prev]);
      setStatus("Loan requested successfully!");

      setLoanAmount("");
      setCollateralAmount("");
      setDuration("30");
      setInterestRate("5");
    } catch (error) {
      setStatus("Error requesting loan: Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Borrowing</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Request Card */}
        <Card className="bg-gray-800 border border-violet-500">
          <CardHeader>
            <CardTitle className="text-white">Request a Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Loan Amount */}
              <div>
                <label className="block text-white mb-2">
                  Loan Amount (ETH)
                </label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  disabled={!isConnected}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Collateral */}
              <div>
                <label className="block text-white mb-2">
                  Collateral Amount (Any Equivalent)
                </label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  disabled={!isConnected}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-white mb-2">
                  Loan Duration (Days)
                </label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={duration}
                  onChange={(e) => {
                    const value = Math.max(2, parseInt(e.target.value) || 2);
                    setDuration(value.toString());
                  }}
                  disabled={!isConnected}
                  min="2"
                  max="365"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Minimum duration: 2 days
                </p>
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-white mb-2">
                  Interest Rate (% APR)
                </label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={interestRate}
                  onChange={(e) => {
                    const value = Math.max(2, parseFloat(e.target.value) || 2);
                    setInterestRate(value.toString());
                  }}
                  disabled={!isConnected}
                  min="2"
                  max="100"
                  step="0.1"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Minimum interest rate: 2% APR
                </p>
              </div>

              {/* NFT Details */}
              <div>
                <label className="block text-white mb-2">NFT Address</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  disabled={!isConnected}
                />
              </div>

              <div>
                <label className="block text-white mb-2">Token ID</label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  disabled={!isConnected}
                />
              </div>

              {/* Total Repayment Info */}
              {calculateTotalRepayment() && (
                <div className="p-3 bg-gray-700 rounded border border-violet-500">
                  <p className="text-white">
                    Total Repayment Amount: {calculateTotalRepayment()} ETH
                  </p>
                  <p className="text-gray-400 text-sm">
                    (Including{" "}
                    {(
                      (parseFloat(interestRate) * parseInt(duration)) /
                      365
                    ).toFixed(2)}
                    % interest for {duration} days)
                  </p>
                </div>
              )}

              {/* Actions */}
              {isConnected ? (
                <div className="space-y-4">
                  <p className="text-white">Connected Account: {account}</p>
                  <button
                    className="w-full bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    onClick={applyForLoan}
                    disabled={
                      loading ||
                      !loanAmount ||
                      !collateralAmount ||
                      !duration ||
                      !interestRate
                    }
                  >
                    {loading ? "Processing..." : "Request Loan"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="w-full bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  disabled={walletLoading}
                >
                  {walletLoading ? "Connecting..." : "Connect MetaMask"}
                </button>
              )}

              {/* Status Message */}
              {status && (
                <p className="text-white p-3 rounded bg-gray-700 border border-violet-500">
                  {status}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loan Requests Card */}
        <Card className="bg-gray-800 border border-violet-500">
          <CardHeader>
            <CardTitle className="text-white">My Loan Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loanRequests.length === 0 ? (
              <p className="text-gray-400">No loan requests yet</p>
            ) : (
              <div className="space-y-4">
                {loanRequests.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 bg-gray-700 rounded border border-violet-500"
                  >
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">Amount:</p>
                      <p className="text-white">{loan.amount} ETH</p>

                      <p className="text-gray-400">Collateral:</p>
                      <p className="text-white">{loan.collateral} ETH</p>

                      <p className="text-gray-400">Duration:</p>
                      <p className="text-white">{loan.duration} days</p>

                      <p className="text-gray-400">Interest Rate:</p>
                      <p className="text-white">{loan.interestRate}% APR</p>

                      <p className="text-gray-400">Total Repayment:</p>
                      <p className="text-white">{loan.totalRepayment} ETH</p>

                      <p className="text-gray-400">Status:</p>
                      <p className="text-white">{loan.status}</p>

                      <p className="text-gray-400">Requested:</p>
                      <p className="text-white">{loan.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Borrowing;
