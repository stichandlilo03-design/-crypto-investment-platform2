'use client'

import { motion } from 'framer-motion'
import { 
  Wallet, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  Users, 
  Globe, 
  TrendingUp,
  Shield,
  Target,
  Heart,
  Zap,
  ArrowRight,
  Linkedin,
  Twitter
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  // ✅ EDITABLE TEAM DATA - Change images via URL
  const executiveTeam = [
    {
      name: "Michael Anderson",
      role: "Chief Executive Officer (CEO)",
      bio: "15+ years in blockchain technology and financial services. Former Goldman Sachs executive who pioneered digital asset management strategies.",
      email: "michael.anderson@cryptovault.com",
      phone: "+1 (555) 123-4567",
      image: "https://randomuser.me/api/portraits/men/32.jpg", // Replace with your image URL
      linkedin: "https://linkedin.com/in/michael-anderson",
      twitter: "https://twitter.com/m_anderson"
    },
    {
      name: "Sarah Mitchell",
      role: "Chief Technology Officer (CTO)",
      bio: "MIT Computer Science graduate with expertise in blockchain security and distributed systems. Previously led engineering at Coinbase.",
      email: "sarah.mitchell@cryptovault.com",
      phone: "+1 (555) 123-4568",
      image: "https://randomuser.me/api/portraits/women/44.jpg", // Replace with your image URL
      linkedin: "https://linkedin.com/in/sarah-mitchell",
      twitter: "https://twitter.com/s_mitchell"
    },
    {
      name: "David Chen",
      role: "Chief Financial Officer (CFO)",
      bio: "Former JP Morgan director with 20 years in institutional finance. Expert in cryptocurrency regulation and compliance.",
      email: "david.chen@cryptovault.com",
      phone: "+1 (555) 123-4569",
      image: "https://randomuser.me/api/portraits/men/46.jpg", // Replace with your image URL
      linkedin: "https://linkedin.com/in/david-chen",
      twitter: "https://twitter.com/d_chen"
    },
    {
      name: "Emily Rodriguez",
      role: "Chief Operating Officer (COO)",
      bio: "Scaled operations at multiple fintech startups. Harvard MBA with focus on emerging markets and digital transformation.",
      email: "emily.rodriguez@cryptovault.com",
      phone: "+1 (555) 123-4570",
      image: "https://randomuser.me/api/portraits/women/65.jpg", // Replace with your image URL
      linkedin: "https://linkedin.com/in/emily-rodriguez",
      twitter: "https://twitter.com/e_rodriguez"
    },
    {
      name: "James Wilson",
      role: "Chief Security Officer (CSO)",
      bio: "Cybersecurity expert with government and private sector experience. Designed security protocols for major crypto exchanges.",
      email: "james.wilson@cryptovault.com",
      phone: "+1 (555) 123-4571",
      image: "https://randomuser.me/api/portraits/men/52.jpg", // Replace with your image URL
      linkedin: "https://linkedin.com/in/james-wilson",
      twitter: "https://twitter.com/j_wilson"
    },
    {
      name: "Lisa Thompson",
      role: "Chief Marketing Officer (CMO)",
      bio: "Digital marketing pioneer with proven track record in crypto industry. Grew user base from 10K to 500K+ at previous company.",
      email: "lisa.thompson@cryptovault.com",
      phone: "+1 (555) 123-4572",
      image: "https://randomuser.me/api/portraits/women/68.jpg", // Replace with your image URL
      linkedin: "https://linkedin.com/in/lisa-thompson",
      twitter: "https://twitter.com/l_thompson"
    }
  ]

  const companyValues = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Security First",
      description: "Your assets are protected with military-grade encryption and multi-factor authentication"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Customer Focused",
      description: "24/7 support and dedicated account managers for all our investors"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Transparency",
      description: "Clear fees, real-time reporting, and honest communication always"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Innovation",
      description: "Cutting-edge technology and continuous platform improvements"
    }
  ]

  const milestones = [
    { year: "2016", event: "CryptoVault Founded", description: "Started with a vision to democratize crypto investing" },
    { year: "2017", event: "Series A Funding", description: "Raised $10M to expand operations globally" },
    { year: "2019", event: "100K Users", description: "Reached first major milestone of active investors" },
    { year: "2021", event: "Regulatory Approval", description: "Obtained licenses in 50+ countries" },
    { year: "2023", event: "$1B AUM", description: "Crossed billion-dollar assets under management" },
    { year: "2024", event: "500K+ Users", description: "Half a million investors trust CryptoVault" }
  ]

  const stats = [
    { value: "$2.4B+", label: "Assets Under Management" },
    { value: "500K+", label: "Active Users" },
    { value: "180+", label: "Countries Supported" },
    { value: "8", label: "Years of Excellence" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-display font-bold text-white">CryptoVault</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-300 hover:text-white transition">Home</Link>
              <Link href="/#features" className="text-gray-300 hover:text-white transition">Features</Link>
              <Link href="/about" className="text-white font-medium">About</Link>
              <Link 
                href="/register"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6">
              About <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">CryptoVault</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Since 2016, we've been on a mission to make cryptocurrency investing accessible, secure, and profitable for everyone.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4 sm:px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-display font-bold text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Founded in <strong className="text-white">2016</strong>, CryptoVault was born from a simple belief: cryptocurrency investing should be accessible to everyone, not just tech experts and Wall Street traders.
                </p>
                <p>
                  What started as a small team of blockchain enthusiasts has grown into a global platform trusted by over <strong className="text-white">500,000 investors</strong> across <strong className="text-white">180+ countries</strong>.
                </p>
                <p>
                  Today, we manage over <strong className="text-white">$2.4 billion</strong> in assets and continue to pioneer new ways to make crypto investing safer, simpler, and more profitable.
                </p>
                <p>
                  Our commitment to security, transparency, and customer service has made us one of the most trusted names in cryptocurrency investment.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Our Mission</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                To empower individuals worldwide to build wealth through cryptocurrency by providing the most secure, intuitive, and profitable investment platform.
              </p>
              
              <h3 className="text-2xl font-bold text-white mb-6">Our Vision</h3>
              <p className="text-gray-300 leading-relaxed">
                A world where everyone has equal access to financial opportunities, where cryptocurrency serves as a bridge to prosperity, and where investing is as easy as sending a text message.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-white text-center mb-12">Our Values</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-white text-center mb-12">Our Journey</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-effect rounded-2xl p-6"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {milestone.year}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{milestone.event}</h3>
                <p className="text-gray-400">{milestone.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Team */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-white mb-4">Meet Our Leadership Team</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Industry veterans and innovators committed to your success
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {executiveTeam.map((executive, index) => (
              <motion.div
                key={executive.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-effect rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-purple-500/20 transition-all group"
              >
                {/* Profile Image */}
                <div className="relative h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                  <img 
                    src={executive.image}
                    alt={executive.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                {/* Profile Info */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{executive.name}</h3>
                  <p className="text-purple-400 font-medium mb-4">{executive.role}</p>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">{executive.bio}</p>

                  {/* Contact Info */}
                  <div className="space-y-3 border-t border-white/10 pt-4">
                    <a 
                      href={`mailto:${executive.email}`}
                      className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors group/link"
                    >
                      <Mail className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                      <span className="text-sm">{executive.email}</span>
                    </a>
                    
                    <a 
                      href={`tel:${executive.phone}`}
                      className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors group/link"
                    >
                      <Phone className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                      <span className="text-sm">{executive.phone}</span>
                    </a>

                    {/* Social Links */}
                    <div className="flex items-center space-x-3 pt-2">
                      <a 
                        href={executive.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 transition-colors"
                      >
                        <Linkedin className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                      </a>
                      <a 
                        href={executive.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 transition-colors"
                      >
                        <Twitter className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-white mb-6">Get In Touch</h2>
            <p className="text-xl text-gray-300 mb-8">
              Have questions? Our team is here to help you succeed.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="glass-effect rounded-xl p-6">
                <Mail className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-2">Email Us</h3>
                <a href="mailto:support@cryptovault.com" className="text-gray-400 hover:text-purple-400 transition">
                  support@cryptovault.com
                </a>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <Phone className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-2">Call Us</h3>
                <a href="tel:+15551234567" className="text-gray-400 hover:text-purple-400 transition">
                  +1 (555) 123-4567
                </a>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <MapPin className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-2">Visit Us</h3>
                <p className="text-gray-400">
                  123 Crypto Street<br />
                  San Francisco, CA 94102
                </p>
              </div>
            </div>

            <Link 
              href="/register"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
            >
              Start Your Journey Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-white">CryptoVault</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; 2016 - 2024 CryptoVault. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
