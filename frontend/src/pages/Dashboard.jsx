import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";

const MicroLoanDashboard = () => {
  // Random sample data
  const dashboardData = {
    totalLoans: "156",
    activeLoans: "42",
    totalValueLocked: "897.54",
    platformFees: "2.5",
  };

  const userMetrics = {
    borrowedAmount: "45.32",
    lentAmount: "123.45",
    totalCollateral: "89.67",
  };

  const loanHistory = [
    {
      id: "1",
      amount: "10.5",
      interest: "5",
      collateralAmount: "15.75",
      status: "FUNDED",
      isBorrower: true,
    },
    {
      id: "2",
      amount: "25.0",
      interest: "4.5",
      collateralAmount: "37.5",
      status: "REPAID",
      isBorrower: false,
    },
    {
      id: "3",
      amount: "15.75",
      interest: "6",
      collateralAmount: "23.62",
      status: "FUNDED",
      isBorrower: true,
    },
    {
      id: "4",
      amount: "8.25",
      interest: "5.5",
      collateralAmount: "12.37",
      status: "DEFAULTED",
      isBorrower: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      <h1 className="text-4xl font-bold text-violet-400 text-center mb-8">
        MicroLoan Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <Card className="bg-gray-800 border border-violet-400/20">
          <CardHeader>
            <CardTitle className="text-violet-400">Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {dashboardData.totalLoans}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-violet-400/20">
          <CardHeader>
            <CardTitle className="text-violet-400">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {dashboardData.activeLoans}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-violet-400/20">
          <CardHeader>
            <CardTitle className="text-violet-400">
              Total Value Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {dashboardData.totalValueLocked} ETH
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-violet-400/20">
          <CardHeader>
            <CardTitle className="text-violet-400">Platform Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {dashboardData.platformFees}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <Card className="bg-gray-800 border border-violet-400/20">
          <CardHeader>
            <CardTitle className="text-violet-400">
              My Borrowed Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {userMetrics.borrowedAmount} ETH
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-violet-400/20">
          <CardHeader>
            <CardTitle className="text-violet-400">My Lent Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {userMetrics.lentAmount} ETH
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-violet-400/20">
          <CardHeader>
            <CardTitle className="text-violet-400">
              My Total Collateral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {userMetrics.totalCollateral} ETH
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border border-violet-400/20 max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-violet-400">Loan History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-violet-400/20">
                  <th className="text-left p-2 text-violet-400">ID</th>
                  <th className="text-left p-2 text-violet-400">Amount</th>
                  <th className="text-left p-2 text-violet-400">Interest</th>
                  <th className="text-left p-2 text-violet-400">Collateral</th>
                  <th className="text-left p-2 text-violet-400">Status</th>
                  <th className="text-left p-2 text-violet-400">Role</th>
                </tr>
              </thead>
              <tbody>
                {loanHistory.map((loan) => (
                  <tr
                    key={loan.id}
                    className="border-b border-violet-400/10 hover:bg-gray-700/50"
                  >
                    <td className="p-2 text-white">{loan.id}</td>
                    <td className="p-2 text-white">{loan.amount} ETH</td>
                    <td className="p-2 text-white">{loan.interest}%</td>
                    <td className="p-2 text-white">
                      {loan.collateralAmount} ETH
                    </td>
                    <td className="p-2 text-white">{loan.status}</td>
                    <td className="p-2 text-white">
                      {loan.isBorrower ? "Borrower" : "Lender"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MicroLoanDashboard;
