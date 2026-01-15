import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
      console.error('No authorization header')
      return NextResponse.json({ 
        success: false,
        error: 'No authorization header',
        data: []
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User error:', userError)
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        data: []
      }, { status: 401 })
    }

    if (!(await isAdmin(user.id))) {
      console.error('Not admin:', user.id)
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden - Admin only',
        data: []
      }, { status: 403 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    console.log('Fetching transactions with filters:', { type, status, limit })

    // Build query
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

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Apply ordering and limit
    query = query
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false,
        error: error.message,
        data: []
      }, { status: 500 })
    }

    console.log('Successfully fetched transactions:', data?.length || 0)

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Internal server error',
      data: []
    }, { status: 500 })
  }
}
