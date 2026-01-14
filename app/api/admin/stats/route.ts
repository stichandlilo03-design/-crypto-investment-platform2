import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get pending deposits from transactions table
    const { count: pendingDeposits } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'deposit')
      .eq('status', 'pending')

    // Get pending withdrawals from transactions table
    const { count: pendingWithdrawals } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'withdrawal')
      .eq('status', 'pending')

    // Get total approved deposits volume
    const { data: deposits } = await supabase
      .from('transactions')
      .select('amount, value_usd')
      .eq('type', 'deposit')
      .eq('status', 'approved')

    // Get total approved withdrawals volume
    const { data: withdrawals } = await supabase
      .from('transactions')
      .select('amount, value_usd')
      .eq('type', 'withdrawal')
      .eq('status', 'approved')

    const totalDeposits = deposits?.reduce((sum, deposit) => sum + (deposit.value_usd || deposit.amount || 0), 0) || 0
    const totalWithdrawals = withdrawals?.reduce((sum, withdrawal) => sum + (withdrawal.value_usd || withdrawal.amount || 0), 0) || 0

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalDeposits,
        totalWithdrawals,
        totalVolume: totalDeposits + totalWithdrawals,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0
      }
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
