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

  const { data: { session } } = await supabase.auth.getSession()

  // Protect admin routes - check if user is admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (request.nextUrl.pathname === '/admin/login') {
      if (session) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile?.role === 'admin') {
          // Admin user trying to access admin login, redirect to admin dashboard
          return NextResponse.redirect(new URL('/admin', request.url))
        } else {
          // Regular user trying to access admin login, redirect to regular dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
      // No session, allow access to admin login page
      return response
    }

    // For all other admin routes, check if user is logged in AND is admin
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
      // Not an admin, redirect to regular dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect dashboard routes (regular users)
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      // Not logged in, redirect to regular login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is admin trying to access regular dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role === 'admin') {
      // Admin trying to access regular dashboard, redirect to admin dashboard
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/register')) {
    if (session) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'admin') {
        // Admin user, redirect to admin dashboard
        return NextResponse.redirect(new URL('/admin', request.url))
      } else {
        // Regular user, redirect to regular dashboard
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
