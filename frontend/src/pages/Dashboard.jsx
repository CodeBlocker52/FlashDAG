import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data with more realistic values
  const dashboardData = {
    totalLoans: "2,847",
    activeLoans: "423",
    totalValueLocked: "12,456.82",
    averageAPR: "8.7",
    totalBorrowers: "1,234",
    totalLenders: "856",
    platformRevenue: "45.23"
  };

  const userMetrics = {
    totalBorrowed: "127.45",
    activeBorrowedAmount: "45.32",
    totalLent: "589.67",
    activeLentAmount: "234.12",
    totalCollateral: "198.75",
    creditScore: "742",
    successfulLoans: "23"
  };

  const recentLoans = [
    {
      id: "LOAN-2847",
      amount: "25.5",
      interest: "7.2",
      duration: "30 days",
      collateralAmount: "38.25",
      collateralType: "BDAG",
      status: "ACTIVE",
      role: "Borrower",
      dueDate: "2024-02-15",
      progress: 65
    },
    {
      id: "LOAN-2846",
      amount: "50.0",
      interest: "6.8",
      duration: "45 days",
      collateralAmount: "75.0",
      collateralType: "BTC",
      status: "REPAID",
      role: "Lender",
      dueDate: "2024-01-28",
      progress: 100
    },
    {
      id: "LOAN-2845",
      amount: "12.75",
      interest: "9.1",
      duration: "14 days",
      collateralAmount: "19.12",
      collateralType: "BDAG",
      status: "PENDING",
      role: "Borrower",
      dueDate: "2024-02-08",
      progress: 0
    },
    {
      id: "LOAN-2844",
      amount: "100.0",
      interest: "5.9",
      duration: "60 days",
      collateralAmount: "150.0",
      collateralType: "BDAG",
      status: "DEFAULTED",
      role: "Lender",
      dueDate: "2024-01-20",
      progress: 45
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'REPAID': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'PENDING': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'DEFAULTED': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-blue-400';
      case 'REPAID': return 'text-green-400';
      case 'PENDING': return 'text-yellow-400';
      case 'DEFAULTED': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-violet-400">
          FlashDAG Dashboard
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Monitor your lending and borrowing activities, track performance, and manage your DeFi portfolio
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center space-x-4 border-b border-violet-400/20">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${
            activeTab === 'overview' 
              ? 'border-violet-400 text-violet-400' 
              : 'border-transparent text-gray-400 hover:text-violet-400'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${
            activeTab === 'loans' 
              ? 'border-violet-400 text-violet-400' 
              : 'border-transparent text-gray-400 hover:text-violet-400'
          }`}
        >
          My Loans
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${
            activeTab === 'analytics' 
              ? 'border-violet-400 text-violet-400' 
              : 'border-transparent text-gray-400 hover:text-violet-400'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Platform Overview Metrics */}
      {activeTab === 'overview' && (
        <>
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-300">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <Card className="bg-gray-900/50 border border-violet-400/20 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-violet-400 text-sm font-medium">Total Loans</CardTitle>
                  <Activity className="w-4 h-4 text-violet-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{dashboardData.totalLoans}</div>
                  <div className="flex items-center text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12.5% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border border-violet-400/20 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-violet-400 text-sm font-medium">Active Loans</CardTitle>
                  <Clock className="w-4 h-4 text-violet-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{dashboardData.activeLoans}</div>
                  <div className="flex items-center text-sm text-blue-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +8.2% from last week
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border border-violet-400/20 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-violet-400 text-sm font-medium">Total Value Locked</CardTitle>
                  <DollarSign className="w-4 h-4 text-violet-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{dashboardData.totalValueLocked} BDAG</div>
                  <div className="flex items-center text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +24.1% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border border-violet-400/20 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-violet-400 text-sm font-medium">Average APR</CardTitle>
                  <Shield className="w-4 h-4 text-violet-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{dashboardData.averageAPR}%</div>
                  <div className="flex items-center text-sm text-red-400">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    -1.3% from last month
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* User Personal Metrics */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-300">Your Portfolio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <Card className="bg-gradient-to-br from-violet-900/20 to-violet-800/10 border border-violet-400/30">
                <CardHeader>
                  <CardTitle className="text-violet-300 text-sm">Total Borrowed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{userMetrics.totalBorrowed} BDAG</div>
                  <div className="text-sm text-gray-400">Active: {userMetrics.activeBorrowedAmount} BDAG</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-400/30">
                <CardHeader>
                  <CardTitle className="text-green-300 text-sm">Total Lent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{userMetrics.totalLent} BDAG</div>
                  <div className="text-sm text-gray-400">Active: {userMetrics.activeLentAmount} BDAG</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-blue-300 text-sm">Total Collateral</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{userMetrics.totalCollateral} BDAG</div>
                  <div className="text-sm text-gray-400">Locked & Available</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-400/30">
                <CardHeader>
                  <CardTitle className="text-yellow-300 text-sm">Credit Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{userMetrics.creditScore}</div>
                  <div className="text-sm text-gray-400">{userMetrics.successfulLoans} successful loans</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Loan History */}
      {activeTab === 'loans' && (
        <Card className="bg-gray-900/50 border border-violet-400/20 backdrop-blur-sm max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle className="text-violet-400 text-xl">Recent Loan Activity</CardTitle>
            <p className="text-gray-400">Track your borrowing and lending history</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-violet-400/20">
                    <th className="text-left p-3 text-violet-400 font-medium">Loan ID</th>
                    <th className="text-left p-3 text-violet-400 font-medium">Amount</th>
                    <th className="text-left p-3 text-violet-400 font-medium">Interest</th>
                    <th className="text-left p-3 text-violet-400 font-medium">Duration</th>
                    <th className="text-left p-3 text-violet-400 font-medium">Collateral</th>
                    <th className="text-left p-3 text-violet-400 font-medium">Status</th>
                    <th className="text-left p-3 text-violet-400 font-medium">Role</th>
                    <th className="text-left p-3 text-violet-400 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      className="border-b border-violet-400/10 hover:bg-violet-900/10 transition-colors duration-200"
                    >
                      <td className="p-3 text-white font-mono text-sm">{loan.id}</td>
                      <td className="p-3 text-white font-semibold">{loan.amount} BDAG</td>
                      <td className="p-3 text-white">{loan.interest}%</td>
                      <td className="p-3 text-gray-300">{loan.duration}</td>
                      <td className="p-3 text-white">
                        {loan.collateralAmount} {loan.collateralType}
                      </td>
                      <td className="p-3">
                        <div className={`flex items-center gap-2 ${getStatusColor(loan.status)}`}>
                          {getStatusIcon(loan.status)}
                          <span className="font-medium">{loan.status}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          loan.role === 'Borrower' 
                            ? 'bg-violet-400/20 text-violet-300' 
                            : 'bg-green-400/20 text-green-300'
                        }`}>
                          {loan.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              loan.progress === 100 ? 'bg-green-400' : 
                              loan.progress > 0 ? 'bg-blue-400' : 'bg-gray-500'
                            }`}
                            style={{ width: `${loan.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{loan.progress}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-300">Performance Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardHeader>
                <CardTitle className="text-violet-400">Lending Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Returns</span>
                  <span className="text-green-400 font-bold">+47.23 BDAG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average APY</span>
                  <span className="text-white font-bold">12.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-green-400 font-bold">94.2%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardHeader>
                <CardTitle className="text-violet-400">Borrowing Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Interest Paid</span>
                  <span className="text-red-400 font-bold">-8.47 BDAG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Rate</span>
                  <span className="text-white font-bold">7.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">On-time Payments</span>
                  <span className="text-green-400 font-bold">96.7%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-violet-400/20">
              <CardHeader>
                <CardTitle className="text-violet-400">Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Collateral Ratio</span>
                  <span className="text-blue-400 font-bold">167%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Liquidation Risk</span>
                  <span className="text-green-400 font-bold">Low</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Portfolio Diversity</span>
                  <span className="text-yellow-400 font-bold">Medium</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;