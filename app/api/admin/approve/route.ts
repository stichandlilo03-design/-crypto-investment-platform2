import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    const { type, id, action, adminNotes } = await request.json()

    if (!type || !id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const table = type === 'deposit' ? 'deposits' : 'withdrawals'
    const status = action === 'approve' 
      ? (type === 'deposit' ? 'approved' : 'processing') 
      : 'rejected'

    // Update the transaction
    const { data: transaction, error: updateError } = await supabase
      .from(table)
      .update({
        status,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.user.id
      })
      .eq('id', id)
      .select(`
        *,
        users (
          email,
          full_name
        )
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    // If approving a deposit, update user balance
    if (type === 'deposit' && action === 'approve') {
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        user_id: transaction.user_id,
        amount: transaction.amount,
        asset: transaction.asset
      })

      if (balanceError) {
        console.error('Balance update error:', balanceError)
        // Continue anyway, but log the error
      }
    }

    // Send notification to user
    await supabase.from('notifications').insert({
      user_id: transaction.user_id,
      title: `Transaction ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      message: `Your ${type} of $${transaction.amount} ${transaction.asset} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      type: 'transaction',
      metadata: {
        transaction_id: id,
        transaction_type: type,
        amount: transaction.amount,
        asset: transaction.asset,
        action
      }
    })

    return NextResponse.json({
      success: true,
      message: `Transaction ${action}d successfully`,
      transaction
    })

  } catch (error) {
    console.error('Approve/Reject error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
