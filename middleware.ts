import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware checking:', request.nextUrl.pathname)
  
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

  console.log('Session exists:', !!session, 'Path:', pathname)

  // Admin routes - ONLY check session, let the page handle role check
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      console.log('On admin login page')
      return response // Always allow access to login page
    }

    // For /admin route, just check if logged in
    if (!session) {
      console.log('No session, redirect to login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    console.log('Session exists, allowing access to admin')
    return response
  }

  // User dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      console.log('No session, redirect to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      console.log('Already logged in, redirect to dashboard')
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
