import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Admin login - always allow
  if (pathname === '/admin/login') {
    return response
  }

  // Admin routes - SIMPLIFIED
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      // Check admin role with timeout
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // If error OR not admin, redirect
      if (error || !profile || profile.role !== 'admin') {
        console.error('Admin check failed:', error || 'Not admin role')
        // Sign out invalid user
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // Success - allow access
      return response
    } catch (err) {
      console.error('Middleware exception:', err)
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}
