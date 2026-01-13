// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { type, id, action, adminNotes } = await request.json()
    const adminId = request.headers.get('x-admin-id') || 'admin'

    if (!type || !id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (type === 'deposit') {
      const status = action === 'approve' ? 'approved' : 'rejected'
      
      const { data: deposit, error } = await supabaseAdmin
        .from('deposits')
        .update({
          status,
          admin_notes: adminNotes || null,
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error || !deposit) {
        return NextResponse.json(
          { error: 'Failed to update deposit' },
          { status: 500 }
        )
      }

      if (action === 'approve') {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('balance, total_deposits')
          .eq('id', deposit.user_id)
          .single()

        if (user) {
          await supabaseAdmin
            .from('users')
            .update({
              balance: (user.balance || 0) + deposit.amount,
              total_deposits: (user.total_deposits || 0) + deposit.amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', deposit.user_id)
        }
      }

      const transactionStatus = action === 'approve' ? 'completed' : 'failed'
      await supabaseAdmin
        .from('transactions')
        .update({ status: transactionStatus })
        .eq('user_id', deposit.user_id)
        .eq('type', 'deposit')
        .eq('amount', deposit.amount)
        .eq('asset', deposit.asset)
        .order('created_at', { ascending: false })
        .limit(1)

    } else if (type === 'withdrawal') {
      const status = action === 'approve' ? 'processing' : 'rejected'
      
      const { data: withdrawal, error } = await supabaseAdmin
        .from('withdrawals')
        .update({
          status,
          admin_notes: adminNotes || null,
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error || !withdrawal) {
        return NextResponse.json(
          { error: 'Failed to update withdrawal' },
          { status: 500 }
        )
      }

      if (action === 'approve') {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('balance, total_withdrawals')
          .eq('id', withdrawal.user_id)
          .single()

        if (user) {
          await supabaseAdmin
            .from('users')
            .update({
              balance: (user.balance || 0) - withdrawal.amount,
              total_withdrawals: (user.total_withdrawals || 0) + withdrawal.amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', withdrawal.user_id)
        }
      }

      const transactionStatus = action === 'approve' ? 'processing' : 'failed'
      await supabaseAdmin
        .from('transactions')
        .update({ status: transactionStatus })
        .eq('user_id', withdrawal.user_id)
        .eq('type', 'withdrawal')
        .eq('amount', -withdrawal.amount)
        .eq('asset', withdrawal.asset)
        .order('created_at', { ascending: false })
        .limit(1)

    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      )
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
