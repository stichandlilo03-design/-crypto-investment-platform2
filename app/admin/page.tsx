'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  DollarSign,
  TrendingUp,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Settings,
  Bell,
  LogOut,
  Wallet,
  BarChart3,
  FileText,
  Clock,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState('dashboard')

  const stats = [
    { 
      label: 'Total Users', 
      value: '52,483', 
      change: '+12.5%', 
      icon: <Users className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Total Volume', 
      value: '$2.4M', 
      change: '+18.2%', 
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500'
    },
    { 
      label: 'Active Investments', 
      value: '18,234', 
      change: '+8.7%', 
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Pending Transactions', 
      value: '234', 
      change: '-5.3%', 
      icon: <Clock className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500'
    }
  ]

  const recentUsers = [
    { id: 1, name: 'Sarah Mitchell', email: 'sarah.m@email.com', joined: '2 hours ago', status: 'active', balance: '$12,450' },
    { id: 2, name: 'Marcus Chen', email: 'marcus.c@email.com', joined: '5 hours ago', status: 'active', balance: '$8,920' },
    { id: 3, name: 'Elena Rodriguez', email: 'elena.r@email.com', joined: '1 day ago', status: 'pending', balance: '$0' },
    { id: 4, name: 'James Wilson', email: 'james.w@email.com', joined: '2 days ago', status: 'active', balance: '$25,100' },
    { id: 5, name: 'Aisha Patel', email: 'aisha.p@email.com', joined: '3 days ago', status: 'suspended', balance: '$5,340' }
  ]

  const recentTransactions = [
    { 
      id: 'TXN001', 
      user: 'Sarah Mitchell', 
      type: 'deposit', 
      amount: '+$5,000', 
      asset: 'BTC',
      status: 'completed',
      time: '10 mins ago'
    },
    { 
      id: 'TXN002', 
      user: 'Marcus Chen', 
      type: 'withdrawal', 
      amount: '-$2,500', 
      asset: 'ETH',
      status: 'pending',
      time: '25 mins ago'
    },
    { 
      id: 'TXN003', 
      user: 'Elena Rodriguez', 
      type: 'trade', 
      amount: '$10,000', 
      asset: 'ADA',
      status: 'completed',
      time: '1 hour ago'
    },
    { 
      id: 'TXN004', 
      user: 'James Wilson', 
      type: 'deposit', 
      amount: '+$15,000', 
      asset: 'SOL',
      status: 'failed',
      time: '2 hours ago'
    },
    { 
      id: 'TXN005', 
      user: 'Aisha Patel', 
      type: 'withdrawal', 
      amount: '-$3,200', 
      asset: 'BTC',
      status: 'pending',
      time: '3 hours ago'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 glass-effect border-r border-white/10 p-6 z-40">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-display font-bold text-white block">Admin Panel</span>
            <span className="text-xs text-gray-400">CryptoVault</span>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setSelectedTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'dashboard' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setSelectedTab('users')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'users' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Users</span>
          </button>
          <button
            onClick={() => setSelectedTab('transactions')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'transactions' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Transactions</span>
          </button>
          <button
            onClick={() => setSelectedTab('reports')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'reports' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Reports</span>
          </button>
          <button
            onClick={() => setSelectedTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              selectedTab === 'settings' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Link
            href="/"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage users, transactions, and platform settings</p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="px-4 py-2.5 rounded-xl glass-effect hover:bg-white/10 text-white transition-all flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export Data</span>
            </button>
            
            <button className="p-2.5 rounded-xl glass-effect hover:bg-white/10 transition-all relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer">
              <span className="text-white font-bold">AD</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl glass-effect hover:bg-white/5 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  {stat.icon}
                </div>
                <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Users */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">Recent Users</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="search"
                      placeholder="Search users..."
                      className="w-48 pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <button className="p-2 rounded-xl glass-effect hover:bg-white/10 transition-all">
                    <Filter className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Joined</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Balance</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-all"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-white font-medium">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-400 text-sm">{user.joined}</td>
                        <td className="py-4 px-4 text-white font-medium">{user.balance}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="p-2 rounded-lg hover:bg-white/10 transition-all">
                              <Eye className="w-4 h-4 text-gray-400" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-white/10 transition-all">
                              <Edit className="w-4 h-4 text-gray-400" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-white/10 transition-all">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <span className="text-sm text-gray-400">Showing 5 of 52,483 users</span>
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 rounded-lg glass-effect hover:bg-white/10 text-white text-sm transition-all">
                    Previous
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm transition-all">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="glass-effect rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-display font-bold text-white mb-6">Recent Transactions</h2>
              
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">{tx.user}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{tx.type} • {tx.asset}</span>
                      <span className={`font-semibold ${
                        tx.type === 'deposit' ? 'text-green-400' :
                        tx.type === 'withdrawal' ? 'text-red-400' :
                        'text-blue-400'
                      }`}>
                        {tx.amount}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{tx.time}</div>
                  </motion.div>
                ))}
              </div>

              <button className="w-full mt-4 py-2.5 rounded-xl glass-effect hover:bg-white/10 text-white text-sm font-medium transition-all">
                View All Transactions
              </button>
            </div>

            {/* System Status */}
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="text-xl font-display font-bold text-white mb-6">System Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">API Status</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Database</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Payment Gateway</span>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">Degraded</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Security</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Secure</span>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 py-2.5 rounded-xl glass-effect hover:bg-white/10 text-white text-sm font-medium transition-all">
                View Detailed Report
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
