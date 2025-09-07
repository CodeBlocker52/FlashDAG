// About.jsx
import React from "react";
import { 
  DollarSign, 
  Shield, 
  Clock, 
  Globe, 
  Users, 
  TrendingUp,
  Lock,
  Zap,
  Award,
  Target,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const features = [
    {
      icon: <DollarSign className="text-violet-400 w-8 h-8" />,
      title: "Competitive Rates",
      description: "Market-driven interest rates that benefit both borrowers and lenders through direct peer-to-peer connections."
    },
    {
      icon: <Shield className="text-violet-400 w-8 h-8" />,
      title: "Smart Contract Security",
      description: "Battle-tested smart contracts audited by leading security firms ensure your assets are always protected."
    },
    {
      icon: <Clock className="text-violet-400 w-8 h-8" />,
      title: "Instant Execution",
      description: "Automated loan processing and instant settlements powered by blockchain technology."
    },
    {
      icon: <Globe className="text-violet-400 w-8 h-8" />,
      title: "Global Access",
      description: "Borderless financial services accessible to anyone with an internet connection and crypto wallet."
    },
    {
      icon: <Lock className="text-violet-400 w-8 h-8" />,
      title: "Non-Custodial",
      description: "You maintain full control of your assets. We never hold or control your funds."
    },
    {
      icon: <TrendingUp className="text-violet-400 w-8 h-8" />,
      title: "Credit Building",
      description: "Build your DeFi credit score through successful loan repayments and unlock better terms."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Users", icon: <Users className="w-6 h-6" /> },
    { number: "$50M+", label: "Total Volume", icon: <DollarSign className="w-6 h-6" /> },
    { number: "99.2%", label: "Uptime", icon: <Zap className="w-6 h-6" /> },
    { number: "15,000+", label: "Loans Processed", icon: <Award className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-violet-900/20 to-black py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-violet-400 mb-6">
              About FlashDAG
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Revolutionizing decentralized finance through secure, transparent, and accessible microloans
            </p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              FlashDAG is pioneering the future of peer-to-peer lending by eliminating traditional banking intermediaries 
              and creating a trustless, efficient ecosystem where anyone can borrow or lend cryptocurrency with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-3">
                <div className="flex justify-center text-violet-400 mb-2">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-white">{stat.number}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-violet-400 mb-6">Our Mission</h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                To democratize access to financial services by creating a transparent, secure, and efficient 
                decentralized lending platform that serves users worldwide.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-violet-400/20 p-2 rounded-lg mt-1">
                    <Target className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Financial Inclusion</h3>
                    <p className="text-gray-400">
                      Breaking down barriers to financial services for underserved populations globally.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-violet-400/20 p-2 rounded-lg mt-1">
                    <Shield className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Trustless Security</h3>
                    <p className="text-gray-400">
                      Eliminating the need for trust through transparent, auditable smart contracts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-violet-400/20 p-2 rounded-lg mt-1">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Community Driven</h3>
                    <p className="text-gray-400">
                      Building a platform governed by and for the community of users.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-900/20 to-transparent p-8 rounded-2xl border border-violet-400/20">
                <h3 className="text-2xl font-bold text-white mb-4">Why Choose FlashDAG?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">No credit checks or lengthy applications</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Transparent and predictable terms</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">24/7 availability and instant processing</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Lower fees than traditional lending</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gray-900/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-violet-400 mb-6">How FlashDAG Works</h2>
              <p className="text-xl text-gray-300">
                Our platform leverages cutting-edge blockchain technology to create a seamless lending experience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-black/50 border border-violet-400/20 rounded-xl p-8 text-center">
                <div className="bg-violet-400/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-violet-400">1</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Connect & Collateralize</h3>
                <p className="text-gray-400">
                  Connect your wallet and stake cryptocurrency as collateral. Our smart contracts automatically 
                  secure your assets while maintaining transparency.
                </p>
              </div>

              <div className="bg-black/50 border border-violet-400/20 rounded-xl p-8 text-center">
                <div className="bg-violet-400/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-violet-400">2</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Match & Fund</h3>
                <p className="text-gray-400">
                  Get matched with lenders automatically based on risk profiles and preferences. 
                  Loans are funded instantly upon agreement.
                </p>
              </div>

              <div className="bg-black/50 border border-violet-400/20 rounded-xl p-8 text-center">
                <div className="bg-violet-400/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-violet-400">3</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Repay & Build Credit</h3>
                <p className="text-gray-400">
                  Repay your loan according to terms. Build your DeFi credit score and unlock 
                  better rates for future borrowing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-violet-400 mb-6">Platform Features</h2>
              <p className="text-xl text-gray-300">
                Built with security, efficiency, and user experience at the forefront
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-gray-900/50 border border-violet-400/20 rounded-xl p-6 hover:border-violet-400/40 transition-colors duration-300">
                  <div className="bg-violet-400/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-violet-900/20 to-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold text-violet-400">Ready to Get Started?</h2>
            <p className="text-xl text-gray-300">
              Join thousands of users who are already benefiting from decentralized lending
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/lending">
                <button className="bg-violet-400 text-black px-8 py-4 rounded-lg font-semibold hover:bg-violet-500 transition-colors duration-200 flex items-center gap-2">
                  Start Lending <ArrowRight size={20} />
                </button>
              </Link>
              <Link to="/borrowing">
                <button className="border border-violet-400 text-violet-400 px-8 py-4 rounded-lg font-semibold hover:bg-violet-400 hover:text-black transition-colors duration-200">
                  Start Borrowing
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;