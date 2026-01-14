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

  // Admin routes
  if (pathname.startsWith('/admin')) {
    // Allow access to admin login page without redirect loop
    if (pathname === '/admin/login') {
      // If already logged in, check role and redirect appropriately
      if (session) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          // If profile fetch fails, let them stay on login to see the error
          if (error) {
            console.error('Middleware profile fetch error at /admin/login:', error)
            return response
          }

          if (profile?.role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
          } else {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        } catch (err) {
          console.error('Middleware error at /admin/login:', err)
          return response
        }
      }
      return response
    }

    // Protect other admin routes
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // If profile fetch fails, redirect to login
      if (error) {
        console.error('Middleware profile fetch error at /admin:', error)
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // If not admin, redirect to dashboard
      if (profile?.role !== 'admin') {
        console.log('User is not admin, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // User is admin, allow access
      console.log('Admin access granted for:', session.user.email)
    } catch (err) {
      console.error('Middleware error at /admin:', err)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // User dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // If profile fetch fails, let them access dashboard anyway
      if (error) {
        console.error('Middleware profile fetch error at /dashboard:', error)
        return response
      }

      // If admin, redirect to admin panel
      if (profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    } catch (err) {
      console.error('Middleware error at /dashboard:', err)
      return response
    }
  }

  // Auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        // If profile fetch fails, redirect to dashboard
        if (error) {
          console.error('Middleware profile fetch error at auth page:', error)
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        if (profile?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (err) {
        console.error('Middleware error at auth page:', err)
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
