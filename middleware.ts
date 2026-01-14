import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for admin login page
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

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

  // Admin routes
  if (pathname.startsWith('/admin')) {
    try {
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('[MIDDLEWARE] Session error:', sessionError)
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      if (!session?.user) {
        console.log('[MIDDLEWARE] No session found')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      console.log('[MIDDLEWARE] User logged in:', session.user.email)

      // Get profile with timeout
      const profilePromise = supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      )

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any

      if (profileError) {
        console.error('[MIDDLEWARE] Profile fetch error:', profileError.message)
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      if (!profile) {
        console.error('[MIDDLEWARE] No profile found for user:', session.user.email)
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      console.log('[MIDDLEWARE] Profile role:', profile.role)

      if (profile.role !== 'admin') {
        console.error('[MIDDLEWARE] User is not admin:', session.user.email, 'Role:', profile.role)
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      console.log('[MIDDLEWARE] ✅ Admin access granted:', session.user.email)
      return response

    } catch (error: any) {
      console.error('[MIDDLEWARE] Exception:', error.message)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Auth pages
  if (pathname === '/login' || pathname === '/register') {
    const { data: { session } } = await supabase.auth.getSession()
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
