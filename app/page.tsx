'use client'

import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  Lock,
  ArrowRight,
  Star,
  Wallet,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Bank-Level Security",
      description: "Military-grade encryption and multi-factor authentication to protect your investments"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Real-Time Analytics",
      description: "Live market data and advanced charting tools for informed decision making"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Transactions",
      description: "Lightning-fast deposits, withdrawals, and trading with minimal fees"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Portfolio Tracking",
      description: "Comprehensive dashboard to monitor all your crypto investments in one place"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "24/7 Support",
      description: "Expert customer support team available around the clock to assist you"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Cold Storage",
      description: "95% of funds secured in offline cold storage for maximum protection"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Professional Trader",
      image: "SM",
      content: "Best crypto platform I've used. The interface is intuitive and the real-time analytics are incredibly accurate. My portfolio has grown 340% in 6 months!",
      rating: 5
    },
    {
      name: "Marcus Chen",
      role: "Investment Manager",
      image: "MC",
      content: "The security features give me peace of mind. I manage multiple client portfolios here and the admin tools are top-notch. Highly recommended!",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Crypto Enthusiast",
      image: "ER",
      content: "Started with just $500 and the platform's educational resources helped me understand the market. Now managing a diverse portfolio worth over $50k!",
      rating: 5
    }
  ]

  const stats = [
    { value: "$2.4B+", label: "Assets Under Management" },
    { value: "500K+", label: "Active Users" },
    { value: "180+", label: "Countries Supported" },
    { value: "99.9%", label: "Uptime Guarantee" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-display font-bold text-white">CryptoVault</span>
            </motion.div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a href="#features" className="text-sm lg:text-base text-gray-300 hover:text-white transition">Features</a>
              <a href="#testimonials" className="text-sm lg:text-base text-gray-300 hover:text-white transition">Testimonials</a>
              <a href="#about" className="text-sm lg:text-base text-gray-300 hover:text-white transition">About</a>
              <Link href="/login" className="text-sm lg:text-base text-gray-300 hover:text-white transition">Login</Link>
              <Link 
                href="/register"
                className="px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm lg:text-base font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-4 pb-4 space-y-3"
            >
              <a href="#features" className="block text-gray-300 hover:text-white transition py-2">Features</a>
              <a href="#testimonials" className="block text-gray-300 hover:text-white transition py-2">Testimonials</a>
              <a href="#about" className="block text-gray-300 hover:text-white transition py-2">About</a>
              <Link href="/login" className="block text-gray-300 hover:text-white transition py-2">Login</Link>
              <Link 
                href="/register"
                className="block text-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
              >
                Get Started
              </Link>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-1/2 -right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center md:text-left"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white mb-4 sm:mb-6 leading-tight">
                Invest in the
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                  Future of Finance
                </span>
              </h1>
              <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                Join over 500,000 investors building wealth with cryptocurrency. Secure, fast, and professional investment platform trusted worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-start">
                <Link href="/register" className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-base sm:text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center">
                  Start Investing Today
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl glass-effect text-white font-semibold text-base sm:text-lg hover:bg-white/10 transition-all">
                  Watch Demo
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-effect rounded-2xl sm:rounded-3xl p-4 sm:p-8 glow-effect">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs sm:text-sm font-medium">Portfolio Value</span>
                    <span className="text-green-400 text-xs sm:text-sm font-medium flex items-center">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      +24.5%
                    </span>
                  </div>
                  <div className="text-3xl sm:text-5xl font-bold text-white">$127,482.90</div>
                  
                  <div className="space-y-3 sm:space-y-4 pt-4">
                    {[
                      { name: 'Bitcoin', symbol: 'BTC', value: '$45,231', change: '+12.3%', color: 'from-orange-500 to-yellow-500' },
                      { name: 'Ethereum', symbol: 'ETH', value: '$38,492', change: '+8.7%', color: 'from-blue-500 to-purple-500' },
                      { name: 'Cardano', symbol: 'ADA', value: '$22,759', change: '+15.2%', color: 'from-green-500 to-emerald-500' }
                    ].map((coin, i) => (
                      <motion.div
                        key={coin.symbol}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${coin.color}`}></div>
                          <div>
                            <div className="font-semibold text-white text-sm sm:text-base">{coin.name}</div>
                            <div className="text-xs sm:text-sm text-gray-400">{coin.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white text-sm sm:text-base">{coin.value}</div>
                          <div className="text-xs sm:text-sm text-green-400">{coin.change}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Why Choose CryptoVault?
            </h2>
            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Industry-leading features designed for both beginners and professional traders
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-6 sm:p-8 rounded-2xl glass-effect hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 sm:py-20 px-4 sm:px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto">
              See what our clients say about their investment journey
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 sm:p-8 rounded-2xl glass-effect hover:bg-white/10 transition-all"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm mr-3 sm:mr-4">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 text-center glow-effect"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6">
              Ready to Start Your Crypto Journey?
            </h2>
            <p className="text-base sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of investors who are already building their wealth with CryptoVault
            </p>
            <Link 
              href="/register"
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-white text-purple-600 font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all"
            >
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-display font-bold text-white">CryptoVault</span>
              </div>
              <p className="text-sm sm:text-base text-gray-400">
                Professional cryptocurrency investment platform trusted by millions worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Compliance</a></li>
                <li><a href="#" className="hover:text-white transition">Licenses</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 sm:pt-8 border-t border-white/10 text-center text-xs sm:text-sm text-gray-400">
            <p>&copy; 2026 CryptoVault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
