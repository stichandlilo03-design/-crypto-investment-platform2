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
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get session
  const { data: { session } } = await supabase.auth.getSession()

  // ADMIN ROUTES
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (request.nextUrl.pathname === '/admin/login') {
      if (session) {
        // User is logged in, check if admin
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
      // No session, allow access to admin login
      return response
    }

    // Protect other admin routes
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
      // Not an admin, redirect to user dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // USER DASHBOARD ROUTES
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      // Not logged in, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is admin trying to access user dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role === 'admin') {
      // Admin user, redirect to admin dashboard
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // AUTH PAGES (Login/Register)
  if (request.nextUrl.pathname.startsWith('/login') || 
      request.nextUrl.pathname.startsWith('/register')) {
    if (session) {
      // User is logged in, check role
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
