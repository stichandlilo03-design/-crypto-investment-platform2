import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, asset, paymentProof, txHash } = await request.json()

    if (!userId || !amount || !asset) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create deposit record
    const depositId = uuidv4()
    const { error } = await supabaseAdmin
      .from('deposits')
      .insert({
        id: depositId,
        user_id: userId,
        amount,
        asset,
        tx_hash: txHash || null,
        payment_proof_url: paymentProof || null,
        status: 'pending'
      })

    if (error) {
      console.error('Deposit creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create deposit' },
        { status: 500 }
      )
    }

    // Create transaction record
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount,
        asset,
        description: `Deposit ${amount} ${asset}`,
        status: 'pending'
      })

    return NextResponse.json({
      success: true,
      depositId,
      message: 'Deposit request submitted successfully. Waiting for admin approval.'
    })
  } catch (error) {
    console.error('Deposit API error:', error)
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
      .from('deposits')
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
      console.error('Error fetching deposits:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deposits' },
        { status: 500 }
      )
    }

    return NextResponse.json({ deposits: data })
  } catch (error) {
    console.error('Deposits GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
