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

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // 1. Handle Admin Routes
  if (pathname.startsWith('/admin')) {
    // Allow admin login page for everyone
    if (pathname === '/admin/login') {
      if (session) {
        // Check if logged in user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile?.role === 'admin') {
          // Admin user, redirect to admin dashboard
          return NextResponse.redirect(new URL('/admin', request.url))
        } else {
          // Regular user, redirect to user dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
      // No session, allow access
      return response
    }

    // For all other admin routes, check authentication and role
    if (!session) {
      // Not logged in, redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      // Not an admin, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 2. Handle User Dashboard Routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      // Not logged in, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role === 'admin') {
      // Admin user, redirect to admin
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // 3. Handle Auth Pages (Login/Register)
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'admin') {
        // Admin user, redirect to admin
        return NextResponse.redirect(new URL('/admin', request.url))
      } else {
        // Regular user, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
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
