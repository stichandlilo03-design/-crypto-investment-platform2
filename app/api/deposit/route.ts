import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, asset, paymentProof, txHash, payment_method, wallet_address } = await request.json()
    
    if (!amount || !asset) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert directly into transactions table
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: session.user.id,
        type: 'deposit',
        amount: parseFloat(amount),
        asset: asset,
        value_usd: parseFloat(amount),
        status: 'pending',
        payment_proof_url: paymentProof || null,
        wallet_address: wallet_address || null,
        payment_method: payment_method || null
      })
      .select()
      .single()

    if (error) {
      console.error('Deposit creation error:', error)
      return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: session.user.id,
      type: 'deposit',
      title: 'Deposit Request Submitted',
      message: `Your deposit of ${amount} ${asset} is pending approval.`
    })

    return NextResponse.json({
      success: true,
      id: data.id,
      message: 'Deposit request submitted successfully. Waiting for admin approval.'
    })
  } catch (error: any) {
    console.error('Deposit API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('type', 'deposit')
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching deposits:', error)
      return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deposits: data })
  } catch (error: any) {
    console.error('Deposits GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
