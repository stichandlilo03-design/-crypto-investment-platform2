import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isAdmin(userId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    return profile?.role === 'admin'
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status') || 'pending'
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const page = parseInt(url.searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    console.log('Fetching transactions:', { type, status, limit, page })

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
      return NextResponse.json({ 
        success: false,
        error: error.message,
        data: []
      }, { status: 500 })
    }

    console.log('Transactions fetched:', data?.length || 0)

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + (data?.length || 0)
      }
    })
  } catch (error: any) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Internal server error',
      data: []
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
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
      approved_by: user.id,
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
