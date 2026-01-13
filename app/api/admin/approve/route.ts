import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    const table = type === 'deposit' ? 'deposits' : 'withdrawals'
    const status = action === 'approve' ? 'approved' : 'rejected'

    // Update the record
    const { data: record, error: updateError } = await supabaseAdmin
      .from(table)
      .update({
        status,
        admin_notes: adminNotes || null,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, users(email, full_name, balance)')
      .single()

    if (updateError || !record) {
      console.error('Approval update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update record' },
        { status: 500 }
      )
    }

    // If approving a deposit, update user balance
    if (type === 'deposit' && action === 'approve') {
      await supabaseAdmin
        .from('users')
        .update({
          balance: record.users.balance + record.amount,
          total_deposits: record.users.total_deposits + record.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.user_id)

      // Update transaction status
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'completed' })
        .eq('user_id', record.user_id)
        .eq('type', 'deposit')
        .eq('amount', record.amount)
        .eq('asset', record.asset)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    // If approving a withdrawal, mark as processing
    if (type === 'withdrawal' && action === 'approve') {
      await supabaseAdmin
        .from('users')
        .update({
          balance: record.users.balance - record.amount,
          total_withdrawals: record.users.total_withdrawals + record.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.user_id)

      // Update transaction status
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'processing' })
        .eq('user_id', record.user_id)
        .eq('type', 'withdrawal')
        .eq('amount', -record.amount)
        .eq('asset', record.asset)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    // If rejecting, update transaction status
    if (action === 'reject') {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('user_id', record.user_id)
        .eq('type', type as any)
        .eq(type === 'deposit' ? 'amount' : 'amount', type === 'deposit' ? record.amount : -record.amount)
        .eq('asset', record.asset)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    return NextResponse.json({
      success: true,
      message: `${type} ${action}d successfully`
    })
  } catch (error) {
    console.error('Approval API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
