import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'

async function isAdmin(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  return profile?.role === 'admin'
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdmin(supabase, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { id, action, adminNotes } = body

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Transaction ID and action are required' },
        { status: 400 }
      )
    }

    // Get transaction to determine its type
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const status = action === 'approve' 
      ? 'approved' 
      : 'rejected'

    // Update transaction
    const updateData: any = {
      status,
      admin_notes: adminNotes || null,
      approved_by: session.user.id,
      approved_at: new Date().toISOString()
    }

    const { data: updatedTransaction, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create notification for user
    let notificationMessage = ''
    let notificationTitle = ''
    
    if (action === 'approve') {
      notificationTitle = 'Transaction Approved!'
      notificationMessage = `Your ${transaction.type} of ${transaction.amount} ${transaction.asset} has been approved.`
    } else {
      notificationTitle = 'Transaction Rejected'
      notificationMessage = `Your ${transaction.type} of ${transaction.amount} ${transaction.asset} has been rejected.`
    }
    
    if (adminNotes) {
      notificationMessage += ` ${adminNotes}`
    }

    await supabase.from('notifications').insert({
      user_id: transaction.user_id,
      type: 'transaction',
      title: notificationTitle,
      message: notificationMessage,
      metadata: {
        transaction_id: id,
        transaction_type: transaction.type,
        amount: transaction.amount,
        asset: transaction.asset,
        action
      }
    })

    // If approving a deposit, update portfolio
    if (action === 'approve' && transaction.type === 'deposit') {
      // Use the PostgreSQL function to process deposit
      const { data: result, error: depositError } = await supabase.rpc(
        'process_deposit_approval',
        {
          p_transaction_id: id,
          p_admin_id: session.user.id
        }
      )

      if (depositError) {
        console.error('Deposit approval error:', depositError)
        // Continue anyway, transaction is already approved
      }

      // Send additional success notification
      await supabase.from('notifications').insert({
        user_id: transaction.user_id,
        type: 'success',
        title: 'Deposit Successful!',
        message: `${transaction.amount} ${transaction.asset} has been added to your portfolio.`
      })
    }

    return NextResponse.json({
      success: true,
      message: `Transaction ${action}d successfully`,
      transaction: updatedTransaction
    })
  } catch (error: any) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
