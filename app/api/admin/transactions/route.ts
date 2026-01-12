import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function isAdmin(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  return profile?.role === 'admin'
}

export async function GET() {
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

    // Get all transactions with user profiles
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
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
    const { transactionId, status, notes } = body

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status,
        admin_notes: notes,
        approved_by: session.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const transaction = data as any

    // Create notification for user
    let notificationMessage = ''
    if (status === 'approved') {
      notificationMessage = `Your ${transaction.type} request has been approved! ${notes || ''}`
    } else if (status === 'rejected') {
      notificationMessage = `Your ${transaction.type} request has been rejected. ${notes || ''}`
    }

    await supabase.from('notifications').insert({
      user_id: transaction.user_id,
      type: 'admin',
      title: `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: notificationMessage
    })

    // If approved deposit, update portfolio
    if (status === 'approved' && transaction.type === 'deposit') {
      // Check if portfolio entry exists
      const { data: existingPortfolio } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', transaction.user_id)
        .eq('asset_symbol', transaction.asset_symbol)
        .single()

      if (existingPortfolio) {
        // Update existing
        const newAmount = parseFloat(existingPortfolio.amount) + parseFloat(transaction.amount)
        const newInvested = parseFloat(existingPortfolio.total_invested) + parseFloat(transaction.total_value)
        
        await supabase
          .from('portfolios')
          .update({
            amount: newAmount,
            total_invested: newInvested,
            average_buy_price: newInvested / newAmount
          })
          .eq('id', existingPortfolio.id)
      } else {
        // Create new
        await supabase
          .from('portfolios')
          .insert({
            user_id: transaction.user_id,
            asset_symbol: transaction.asset_symbol,
            asset_name: getCoinName(transaction.asset_symbol),
            amount: transaction.amount,
            total_invested: transaction.total_value,
            average_buy_price: transaction.price_at_transaction
          })
      }

      // Send profit notification
      await supabase.from('notifications').insert({
        user_id: transaction.user_id,
        type: 'profit',
        title: 'Deposit Approved!',
        message: `${transaction.amount} ${transaction.asset_symbol} has been added to your portfolio.`
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getCoinName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    ADA: 'Cardano',
    SOL: 'Solana',
    USDT: 'Tether',
    BNB: 'Binance Coin'
  }
  return names[symbol] || symbol
}
