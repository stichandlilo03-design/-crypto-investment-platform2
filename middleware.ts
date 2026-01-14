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

  console.log('Session exists:', !!session, 'User:', session?.user?.email, 'Path:', pathname)

  // Admin routes - ONLY check session, let the page handle role check
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      console.log('✅ On admin login page - ALLOWING')
      return response
    }

    // For /admin route, just check if logged in
    if (!session) {
      console.log('❌ No session on /admin, redirecting to /admin/login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    console.log('✅ Session exists, ALLOWING access to /admin')
    return response
  }

  // User dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      console.log('❌ No session on /dashboard, redirect to /login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    console.log('✅ Session exists, ALLOWING access to /dashboard')
    return response
  }

  // Auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      console.log('⚠️ Already logged in on auth page, redirect to /dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  console.log('✅ Default - ALLOWING')
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
