// REPLACE app/api/admin/transactions/route.ts WITH THIS TO SEE THE ACTUAL ERROR:

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TRANSACTION API CALLED ===')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Service key exists:', !!serviceKey)
    
    if (!supabaseUrl || !serviceKey) {
      console.error('MISSING ENV VARS!')
      return NextResponse.json({ 
        success: false,
        error: 'Server configuration error - missing environment variables',
        data: []
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    
    // Check auth header
    const authHeader = request.headers.get('authorization')
    console.log('Auth header exists:', !!authHeader)
    
    if (!authHeader) {
      return NextResponse.json({ 
        success: false,
        error: 'No authorization header',
        data: []
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    console.log('User found:', !!user)
    console.log('User error:', userError)
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized: ' + (userError?.message || 'No user'),
        data: []
      }, { status: 401 })
    }

    // Check if admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    console.log('Profile found:', !!profile)
    console.log('Profile error:', profileError)
    console.log('User role:', profile?.role)
    
    if (profileError) {
      return NextResponse.json({ 
        success: false,
        error: 'Profile error: ' + profileError.message,
        data: []
      }, { status: 500 })
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Not admin',
        data: []
      }, { status: 403 })
    }

    // Fetch transactions
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    
    console.log('Fetching transactions with status:', status)
    
    let query = supabase
      .from('transactions')
      .select(`
        *,
        profiles!transactions_user_id_fkey (
          email,
          full_name,
          phone
        )
      `)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    query = query
      .order('created_at', { ascending: false })
      .limit(50)

    const { data, error } = await query
    
    console.log('Query result - data count:', data?.length)
    console.log('Query error:', error)
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: 'Database error: ' + error.message,
        data: []
      }, { status: 500 })
    }

    console.log('SUCCESS - returning', data?.length, 'transactions')

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('=== FATAL ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json({ 
      success: false,
      error: 'Fatal error: ' + error.message,
      data: []
    }, { status: 500 })
  }
}
