import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Not logged in → send to login
  if (!user && (path.startsWith('/dashboard') || path === '/onboarding')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Logged in but hitting /onboarding → check if already done
  if (user && path === '/onboarding') {
    const { data: profile } = await supabase
      .from('users')
      .select('fname, phone')
      .eq('id', user.id)
      .single()

    if (profile?.fname && profile?.phone) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Logged in, hitting dashboard → check onboarding complete
  if (user && path.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('users')
      .select('fname, phone')
      .eq('id', user.id)
      .single()

    if (!profile?.fname || !profile?.phone) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding'],
}