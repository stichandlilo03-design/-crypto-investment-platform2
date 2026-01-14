import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get pending deposits
    const { count: pendingDeposits } = await supabase
      .from('deposits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get pending withdrawals
    const { count: pendingWithdrawals } = await supabase
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get total deposit volume
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount, status')
      .eq('status', 'approved')

    // Get total withdrawal volume
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount, status')
      .eq('status', 'completed')

    const totalDepositVolume = deposits?.reduce((sum, deposit) => sum + (deposit.amount || 0), 0) || 0
    const totalWithdrawalVolume = withdrawals?.reduce((sum, withdrawal) => sum + (withdrawal.amount || 0), 0) || 0

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalDepositVolume,
        totalWithdrawalVolume,
        totalVolume: totalDepositVolume + totalWithdrawalVolume
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
