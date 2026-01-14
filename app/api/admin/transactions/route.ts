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

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status') || 'pending'
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const page = parseInt(url.searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          phone
        )
      `, { count: 'exact' })

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + (data?.length || 0)
      }
    })
  } catch (error: any) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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
    const { transactionId, status, adminNotes } = body

    if (!transactionId || !status) {
      return NextResponse.json(
        { error: 'Transaction ID and status are required' },
        { status: 400 }
      )
    }

    // Get transaction details before update
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Update transaction
    const updateData: any = {
      status,
      admin_notes: adminNotes || null,
      approved_by: session.user.id,
      approved_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
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

    const transaction = data as any

    // Create notification for user
    let notificationMessage = ''
    let notificationTitle = ''
    
    if (status === 'approved') {
      notificationTitle = 'Transaction Approved!'
      notificationMessage = `Your ${transaction.type} of ${transaction.amount} ${transaction.asset} has been approved.`
      if (adminNotes) {
        notificationMessage += ` Notes: ${adminNotes}`
      }
    } else if (status === 'rejected') {
      notificationTitle = 'Transaction Rejected'
      notificationMessage = `Your ${transaction.type} of ${transaction.amount} ${transaction.asset} has been rejected.`
      if (adminNotes) {
        notificationMessage += ` Reason: ${adminNotes}`
      }
    }

    await supabase.from('notifications').insert({
      user_id: transaction.user_id,
      type: 'transaction',
      title: notificationTitle,
      message: notificationMessage,
      metadata: {
        transaction_id: transactionId,
        transaction_type: transaction.type,
        amount: transaction.amount,
        asset: transaction.asset,
        status: status
      }
    })

    // If approving a deposit, update portfolio
    if (status === 'approved' && transaction.type === 'deposit') {
      // Use the PostgreSQL function to process deposit
      const { data: result, error: depositError } = await supabase.rpc(
        'process_deposit_approval',
        {
          p_transaction_id: transactionId,
          p_admin_id: session.user.id
        }
      )

      if (depositError) {
        console.error('Deposit approval error:', depositError)
        // Continue anyway, transaction is already approved
      }

      // Send additional profit notification
      await supabase.from('notifications').insert({
        user_id: transaction.user_id,
        type: 'success',
        title: 'Deposit Successful!',
        message: `${transaction.amount} ${transaction.asset} has been added to your portfolio.`
      })
    }

    return NextResponse.json({
      success: true,
      message: `Transaction ${status} successfully`,
      data
    })
  } catch (error: any) {
    console.error('Transaction update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
