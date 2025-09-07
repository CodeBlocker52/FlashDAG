import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  Zap,
  Wallet,
  Coins,
  TrendingUp,
  Globe,
  Users,
  Lock,
  Clock,
  DollarSign,
  CheckCircle,
  Star,
  Activity,
  Award
} from "lucide-react";
import GeometricWeb from "../components/GeometricWeb";
import { useAccount } from 'wagmi';

const Home = () => {
  const { address, isConnected } = useAccount();
  const [activeFeature, setActiveFeature] = useState(0);

  // Platform statistics
  const stats = [
    { icon: <Users className="w-6 h-6" />, value: "25,000+", label: "Active Users" },
    { icon: <DollarSign className="w-6 h-6" />, value: "$150M+", label: "Total Volume" },
    { icon: <Activity className="w-6 h-6" />, value: "45,000+", label: "Loans Processed" },
    { icon: <Award className="w-6 h-6" />, value: "99.7%", label: "Success Rate" }
  ];

  // Feature highlights with more compelling content
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Bank-Grade Security",
      description: "Multi-signature wallets, audited smart contracts, and decentralized architecture protect your assets 24/7."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Get approved and funded in under 5 minutes. No paperwork, no waiting - just instant access to liquidity."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global & Permissionless",
      description: "Access from anywhere in the world. No KYC required, no geographic restrictions, just connect your wallet."
    }
  ];

  // Benefits with enhanced descriptions
  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Competitive Rates",
      description: "Market-driven interest rates starting from 3.5% APR. Lenders earn up to 15% APY on their deposits."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Non-Custodial",
      description: "Your keys, your crypto. We never hold your funds - smart contracts handle everything automatically."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Build DeFi Credit",
      description: "Establish your on-chain reputation. Better credit scores unlock lower rates and higher loan limits."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Flexible Terms",
      description: "Choose loan durations from 7 days to 365 days. Early repayment discounts available."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section - Enhanced */}
      <section className="relative min-h-screen flex items-center">
        <GeometricWeb />

        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-scale-up">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-violet-400/10 border border-violet-400/20 rounded-full text-sm text-violet-300">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Live on Ethereum & Polygon
                </div>

                <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                  The Future of
                  <span className="text-violet-400 block">DeFi Lending</span>
                </h1>

                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                  Unlock instant liquidity with crypto-backed loans. No credit
                  checks, no banks, no waiting. Just connect, collateralize, and
                  access funds in minutes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/lending">
                  <button className="group bg-violet-400 text-black px-8 py-4 rounded-xl font-semibold hover:bg-violet-500 transition-all duration-300 flex items-center gap-3 transform hover:scale-105">
                    Start Lending
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>

                <Link to="/borrowing">
                  <button className="group border-2 border-violet-400 text-violet-400 px-8 py-4 rounded-xl font-semibold hover:bg-violet-400 hover:text-black transition-all duration-300 flex items-center gap-3">
                    Get a Loan
                    <Coins className="w-5 h-5" />
                  </button>
                </Link>
              </div>

              {/* Stats Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-violet-400/20">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center text-violet-400 mb-2">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="flex justify-center lg:justify-end animate-scale-up">
              <div className="relative">
                {/* Main Circle */}
                <div className="w-96 h-96 rounded-full bg-gradient-to-br from-violet-400/30 to-purple-600/20 flex items-center justify-center animate-pulse">
                  <div className="w-80 h-80 rounded-full bg-gradient-to-br from-violet-400/40 to-purple-600/30 flex items-center justify-center">
                    <div className="w-64 h-64 rounded-full bg-gradient-to-br from-violet-400/50 to-purple-600/40 flex items-center justify-center">
                      <Wallet size={80} className="text-violet-300" />
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-10 right-10 bg-green-400/20 p-3 rounded-xl backdrop-blur-sm border border-green-400/30 animate-bounce">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>

                <div
                  className="absolute bottom-10 left-10 bg-blue-400/20 p-3 rounded-xl backdrop-blur-sm border border-blue-400/30 animate-bounce"
                  style={{ animationDelay: "1s" }}
                >
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>

                <div
                  className="absolute top-1/2 right-0 bg-yellow-400/20 p-3 rounded-xl backdrop-blur-sm border border-yellow-400/30 animate-bounce"
                  style={{ animationDelay: "2s" }}
                >
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Redesigned */}
      <section className="py-24 bg-gradient-to-br from-gray-900/50 to-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-violet-400 mb-6">
              How FlashDAG Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Three simple steps to access instant crypto liquidity or start
              earning yield on your assets
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gray-900/50 border border-violet-400/20 rounded-2xl p-8 hover:border-violet-400/40 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="bg-violet-400/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-violet-400/30 transition-colors">
                  {React.cloneElement(feature.icon, {
                    className: "w-8 h-8 text-violet-400",
                  })}
                </div>

                <div className="absolute top-4 right-4 text-6xl font-bold text-violet-400/10">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose FlashDAG Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Why Choose <span className="text-violet-400">FlashDAG</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for the next generation of DeFi users who demand speed,
              security, and simplicity
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group flex items-start gap-6 p-6 rounded-2xl hover:bg-gray-900/30 transition-all duration-300"
              >
                <div className="bg-violet-400/20 p-3 rounded-xl group-hover:bg-violet-400/30 transition-colors">
                  {React.cloneElement(benefit.icon, {
                    className: "w-6 h-6 text-violet-400",
                  })}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-24 bg-gradient-to-br from-violet-900/10 to-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Trusted by <span className="text-violet-400">Thousands</span>
              </h2>
              <p className="text-xl text-gray-300">
                Join a community of DeFi pioneers who trust FlashDAG with their
                assets
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-gray-900/50 border border-green-400/20 rounded-2xl p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">$0</div>
                <div className="text-gray-300">Lost to Hacks</div>
                <div className="text-sm text-gray-400 mt-2">
                  Multi-audited smart contracts
                </div>
              </div>

              <div className="bg-gray-900/50 border border-blue-400/20 rounded-2xl p-6">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  24/7
                </div>
                <div className="text-gray-300">Uptime</div>
                <div className="text-sm text-gray-400 mt-2">
                  Decentralized infrastructure
                </div>
              </div>

              <div className="bg-gray-900/50 border border-yellow-400/20 rounded-2xl p-6">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  5★
                </div>
                <div className="text-gray-300">Community Rating</div>
                <div className="text-sm text-gray-400 mt-2">
                  Trusted by users worldwide
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Audited by CertiK</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Non-Custodial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Community Governed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-violet-600/10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl lg:text-6xl font-bold text-white">
              Ready to <span className="text-violet-400">Get Started</span>?
            </h2>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join the DeFi revolution. Start earning yield or access instant
              liquidity in just a few clicks.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Link to="/supply">
                <button className="group bg-violet-400 text-black px-10 py-5 rounded-xl text-lg font-semibold hover:bg-violet-500 transition-all duration-300 flex items-center gap-3 transform hover:scale-105">
                  <TrendingUp className="w-6 h-6" />
                  Start Earning Today
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <Link to="/borrowing">
                <button className="group border-2 border-violet-400 text-violet-400 px-10 py-5 rounded-xl text-lg font-semibold hover:bg-violet-400 hover:text-black transition-all duration-300 flex items-center gap-3 transform hover:scale-105">
                  <Coins className="w-6 h-6" />
                  Get Instant Loan
                </button>
              </Link>
            </div>

            {/* Connected Wallet CTA */}
            {isConnected && (
              <div className="mt-8 p-6 bg-green-400/10 border border-green-400/20 rounded-2xl">
                <div className="flex items-center justify-center gap-3 text-green-400 mb-3">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">Wallet Connected!</span>
                </div>
                <p className="text-gray-300 mb-4">
                  You're ready to start lending or borrowing. Choose your path:
                </p>
                <Link to="/dashboard">
                  <button className=" bg-green-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-green-500 transition-all transform hover:scale-105">
                    Go to Dashboard
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="border-t border-violet-400/20 py-12 bg-black">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-violet-400">FlashDAG</div>
              <div className="hidden md:block w-px h-6 bg-gray-600"></div>
              <div className="text-sm text-gray-400">
                Powering the future of DeFi
              </div>
            </div>

            <div className="flex items-center gap-8">
              <Link
                to="/about"
                className="text-gray-400 hover:text-violet-400 transition-colors"
              >
                About
              </Link>
              <Link
                to="/dashboard"
                className="text-gray-400 hover:text-violet-400 transition-colors"
              >
                Dashboard
              </Link>
              <a
                href="#"
                className="text-gray-400 hover:text-violet-400 transition-colors"
              >
                Docs
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-violet-400 transition-colors"
              >
                Security
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            © 2025 FlashDAG. Built with ❤️ for the DeFi community.
          </div>
        </div>
      </footer>

      {/* Enhanced Animations */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes scale-up {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-up {
          animation: scale-up 0.8s ease-out forwards;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }

        @keyframes bounce {
          0%,
          20%,
          53%,
          80%,
          100% {
            transform: translateY(0px);
          }
          40%,
          43% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce {
          animation: bounce 2s infinite;
        }

        @keyframes slide-up {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }

        /* Smooth transitions for interactive elements */
        .group:hover .group-hover\\:translate-x-1 {
          transform: translateX(0.25rem);
        }
      `}</style>
    </div>
  );
};

export default Home;