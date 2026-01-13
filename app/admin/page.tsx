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
  MoreVertical,
  Check,
  X,
  ExternalLink
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Deposit {
  id: string
  user_id: string
  amount: number
  asset: string
  tx_hash: string | null
  payment_proof_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'processing'
  admin_notes: string | null
  created_at: string
  users: {
    email: string
    full_name: string | null
  }
}

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  asset: string
  wallet_address: string
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  admin_notes: string | null
  created_at: string
  users: {
    email: string
    full_name: string | null
  }
}

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAction, setSelectedAction] = useState<{
    type: 'deposit' | 'withdrawal'
    id: string
    userEmail: string
    amount: number
    asset: string
  } | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchPendingTransactions()
  }, [])

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true)
      
      const [depositsRes, withdrawalsRes] = await Promise.all([
        fetch('/api/deposit?status=pending'),
        fetch('/api/withdraw?status=pending')
      ])

      const depositsData = await depositsRes.json()
      const withdrawalsData = await withdrawalsRes.json()

      if (depositsData.deposits) setDeposits(depositsData.deposits)
      if (withdrawalsData.withdrawals) setWithdrawals(withdrawalsData.withdrawals)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (type: 'deposit' | 'withdrawal', id: string) => {
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': 'admin-user-id' // In real app, get from auth session
        },
        body: JSON.stringify({
          type,
          id,
          action: 'approve',
          adminNotes: adminNotes || null
        })
      })

      if (response.ok) {
        alert(`${type} approved successfully`)
        setSelectedAction(null)
        setAdminNotes('')
        fetchPendingTransactions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Approval error:', error)
      alert('Failed to approve. Please try again.')
    }
  }

  const handleReject = async (type: 'deposit' | 'withdrawal', id: string) => {
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': 'admin-user-id' // In real app, get from auth session
        },
        body: JSON.stringify({
          type,
          id,
          action: 'reject',
          adminNotes: adminNotes || null
        })
      })

      if (response.ok) {
        alert(`${type} rejected successfully`)
        setSelectedAction(null)
        setAdminNotes('')
        fetchPendingTransactions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Rejection error:', error)
      alert('Failed to reject. Please try again.')
    }
  }

  const stats = [
    { 
      label: 'Pending Deposits', 
      value: deposits.length.toString(), 
      change: '', 
      icon: <Clock className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      label: 'Pending Withdrawals', 
      value: withdrawals.length.toString(), 
      change: '', 
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'from-red-500 to-pink-500'
    },
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
    }
  ]

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const renderPendingTransactions = () => (
    <>
      {/* Pending Deposits */}
      <div className="glass-effect rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-yellow-400" />
          Pending Deposits ({deposits.length})
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p className="text-gray-400 mt-2">Loading...</p>
          </div>
        ) : deposits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No pending deposits</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Asset</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Proof</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Submitted</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-white font-medium">
                          {deposit.users.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-400">{deposit.users.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white font-bold">
                        ${deposit.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">{deposit.amount} {deposit.asset}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                        {deposit.asset}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {deposit.payment_proof_url ? (
                        <a
                          href={deposit.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-purple-400 hover:text-purple-300"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">View Proof</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No proof</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {formatTimeAgo(deposit.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAction({
                              type: 'deposit',
                              id: deposit.id,
                              userEmail: deposit.users.email,
                              amount: deposit.amount,
                              asset: deposit.asset
                            })
                          }}
                          className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-all flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Review</span>
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Withdrawals */}
      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center">
          <AlertCircle className="w-6 h-6 mr-2 text-red-400" />
          Pending Withdrawals ({withdrawals.length})
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p className="text-gray-400 mt-2">Loading...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No pending withdrawals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Asset</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Wallet</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Submitted</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-white font-medium">
                          {withdrawal.users.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-400">{withdrawal.users.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white font-bold">
                        ${withdrawal.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">{withdrawal.amount} {withdrawal.asset}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                        {withdrawal.asset}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-400 text-sm font-mono max-w-[200px] truncate">
                        {withdrawal.wallet_address}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {formatTimeAgo(withdrawal.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAction({
                              type: 'withdrawal',
                              id: withdrawal.id,
                              userEmail: withdrawal.users.email,
                              amount: withdrawal.amount,
                              asset: withdrawal.asset
                            })
                          }}
                          className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-all flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Review</span>
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )

  // Keep the rest of your existing admin page code, but replace the main content area
  // with this conditional rendering:

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f]">
      {/* Keep your sidebar code as is */}

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header - keep as is */}

        {/* Stats Grid - updated with pending counts */}
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
                {stat.change && (
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Main content area - show pending transactions */}
        {selectedTab === 'dashboard' && renderPendingTransactions()}

        {/* Add other tabs rendering as needed */}
      </main>

      {/* Approval Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              Review {selectedAction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </h3>
            
            <div className="space-y-4 my-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">User</label>
                <div className="text-white font-medium">{selectedAction.userEmail}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount</label>
                  <div className="text-white font-bold">${selectedAction.amount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">{selectedAction.amount} {selectedAction.asset}</div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    selectedAction.type === 'deposit' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedAction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="Add notes about this transaction..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedAction(null)
                  setAdminNotes('')
                }}
                className="px-4 py-2 rounded-xl glass-effect hover:bg-white/10 text-white transition-all"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleReject(selectedAction.type, selectedAction.id)}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Reject</span>
              </button>
              
              <button
                onClick={() => handleApprove(selectedAction.type, selectedAction.id)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-all flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Approve</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
