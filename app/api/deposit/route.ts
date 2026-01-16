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

    const body = await request.json()
    
    // ✅ CORRECT: Separate USD and crypto amounts
    const { 
      usd_amount,           // The USD being deposited
      crypto_amount,        // The calculated crypto amount
      asset, 
      paymentProof, 
      payment_method, 
      wallet_address 
    } = body
    
    console.log('📥 DEPOSIT API RECEIVED:', {
      usd_amount,
      crypto_amount,
      asset,
      payment_method
    })
    
    // Validation
    if (!usd_amount || !crypto_amount || !asset) {
      return NextResponse.json({ 
        error: 'Missing required fields: usd_amount, crypto_amount, or asset' 
      }, { status: 400 })
    }

    const usdValue = parseFloat(usd_amount)
    const cryptoValue = parseFloat(crypto_amount)

    if (isNaN(usdValue) || usdValue <= 0) {
      return NextResponse.json({ 
        error: 'Invalid USD amount' 
      }, { status: 400 })
    }

    if (isNaN(cryptoValue) || cryptoValue <= 0) {
      return NextResponse.json({ 
        error: 'Invalid crypto amount' 
      }, { status: 400 })
    }

    console.log('✅ VALIDATED AMOUNTS:', {
      usd: usdValue,
      crypto: cryptoValue,
      pricePerCoin: usdValue / cryptoValue
    })

    // ✅ INSERT WITH CORRECT VALUES
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: session.user.id,
        type: 'deposit',
        amount: cryptoValue,        // ✅ Crypto amount (e.g., 0.00238 BTC)
        asset: asset,
        value_usd: usdValue,        // ✅ USD amount (e.g., $100)
        status: 'pending',
        payment_proof_url: paymentProof || null,
        wallet_address: wallet_address || null,
        payment_method: payment_method || null
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Deposit creation error:', error)
      return NextResponse.json({ 
        error: 'Failed to create deposit: ' + error.message 
      }, { status: 500 })
    }

    console.log('✅ TRANSACTION CREATED:', data)

    // Create notification
    await supabase.from('notifications').insert({
      user_id: session.user.id,
      type: 'deposit',
      title: 'Deposit Request Submitted',
      message: `Your deposit of $${usdValue.toFixed(2)} (${cryptoValue.toFixed(8)} ${asset}) is pending approval.`
    })

    return NextResponse.json({
      success: true,
      id: data.id,
      message: 'Deposit request submitted successfully. Waiting for admin approval.',
      data: {
        usd_amount: usdValue,
        crypto_amount: cryptoValue,
        asset: asset
      }
    })

  } catch (error: any) {
    console.error('❌ Deposit API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 })
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
      return NextResponse.json({ 
        error: 'Failed to fetch deposits' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      deposits: data 
    })

  } catch (error: any) {
    console.error('Deposits GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
