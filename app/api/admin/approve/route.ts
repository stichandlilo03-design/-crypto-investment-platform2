import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type TableName = keyof Database['public']['Tables']
type Deposit = Database['public']['Tables']['deposits']['Row']
type Withdrawal = Database['public']['Tables']['withdrawals']['Row']
type User = Database['public']['Tables']['users']['Row']

export async function POST(request: NextRequest) {
  try {
    const { type, id, action, adminNotes } = await request.json()
    const adminId = request.headers.get('x-admin-id') // In real app, get from auth session

    if (!type || !id || !action || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const status = action === 'approve' ? 'approved' : 'rejected'

    if (type === 'deposit') {
      // Update deposit record
      const { data: deposit, error: depositError } = await supabaseAdmin
        .from('deposits')
        .update({
          status,
          admin_notes: adminNotes || null,
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single()

      if (depositError || !deposit) {
        console.error('Deposit approval error:', depositError)
        return NextResponse.json(
          { error: 'Failed to update deposit' },
          { status: 500 }
        )
      }

      // Get user data
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', deposit.user_id)
        .single()

      // If approving a deposit, update user balance
      if (action === 'approve' && user) {
        await supabaseAdmin
          .from('users')
          .update({
            balance: (user.balance || 0) + deposit.amount,
            total_deposits: (user.total_deposits || 0) + deposit.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', deposit.user_id)

        // Update transaction status
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'completed' })
          .eq('user_id', deposit.user_id)
          .eq('type', 'deposit')
          .eq('amount', deposit.amount)
          .eq('asset', deposit.asset)
          .order('created_at', { ascending: false })
          .limit(1)
      }

      // If rejecting, update transaction status
      if (action === 'reject') {
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'failed' })
          .eq('user_id', deposit.user_id)
          .eq('type', 'deposit')
          .eq('amount', deposit.amount)
          .eq('asset', deposit.asset)
          .order('created_at', { ascending: false })
          .limit(1)
      }

      return NextResponse.json({
        success: true,
        message: `Deposit ${action}d successfully`
      })
    } else {
      // Update withdrawal record
      const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
        .from('withdrawals')
        .update({
          status: action === 'approve' ? 'processing' : 'rejected',
          admin_notes: adminNotes || null,
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single()

      if (withdrawalError || !withdrawal) {
        console.error('Withdrawal approval error:', withdrawalError)
        return NextResponse.json(
          { error: 'Failed to update withdrawal' },
          { status: 500 }
        )
      }

      // Get user data
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', withdrawal.user_id)
        .single()

      // If approving a withdrawal, update user balance and mark as processing
      if (action === 'approve' && user) {
        await supabaseAdmin
          .from('users')
          .update({
            balance: (user.balance || 0) - withdrawal.amount,
            total_withdrawals: (user.total_withdrawals || 0) + withdrawal.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', withdrawal.user_id)

        // Update transaction status
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'processing' })
          .eq('user_id', withdrawal.user_id)
          .eq('type', 'withdrawal')
          .eq('amount', -withdrawal.amount)
          .eq('asset', withdrawal.asset)
          .order('created_at', { ascending: false })
          .limit(1)
      }

      // If rejecting, update transaction status
      if (action === 'reject') {
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'failed' })
          .eq('user_id', withdrawal.user_id)
          .eq('type', 'withdrawal')
          .eq('amount', -withdrawal.amount)
          .eq('asset', withdrawal.asset)
          .order('created_at', { ascending: false })
          .limit(1)
      }

      return NextResponse.json({
        success: true,
        message: `Withdrawal ${action}d successfully`
      })
    }
  } catch (error) {
    console.error('Approval API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
