// app.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, polygon, optimism, base, sepolia } from '@reown/appkit/networks';

import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import About from './pages/About.jsx';
import SupplyDashboard from "./pages/Lending.tsx";
import BorrowDashboard from "./pages/Borrowing.tsx";
import WithdrawDashboard from './pages/withdraw.jsx';
import RepayDashboard from './pages/repay.jsx';
import {config} from './config/wagmi.js';
// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-black text-white">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/supply" element={<SupplyDashboard />} />
              <Route path="/borrow" element={<BorrowDashboard />} />
              <Route path="/withdraw" element={<WithdrawDashboard />} />
              <Route path="/repay" element={<RepayDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;