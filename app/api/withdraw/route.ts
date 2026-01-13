// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, asset, walletAddress } = await request.json()

    if (!userId || !amount || !asset || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    const withdrawalId = crypto.randomUUID()
    const { error } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        id: withdrawalId,
        user_id: userId,
        amount,
        asset,
        wallet_address: walletAddress,
        status: 'pending'
      })

    if (error) {
      console.error('Withdrawal creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from('transactions')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        type: 'withdrawal',
        amount: -amount,
        asset,
        description: `Withdrawal ${amount} ${asset} to ${walletAddress.substring(0, 8)}...`,
        status: 'pending'
      })

    return NextResponse.json({
      success: true,
      withdrawalId,
      message: 'Withdrawal request submitted successfully. Waiting for admin approval.'
    })
  } catch (error) {
    console.error('Withdrawal API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      )
    }

    return NextResponse.json({ withdrawals: data })
  } catch (error) {
    console.error('Withdrawals GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
