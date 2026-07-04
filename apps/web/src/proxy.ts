import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup']

// Invite links must work for signed-out visitors too — the page itself
// guides them to log in/sign up (with a return path) instead of the proxy
// bouncing them away. Unlike PUBLIC_ROUTES, this does NOT redirect signed-in
// users elsewhere: an authenticated user must still be able to open the
// link to accept the invitation.
function isGuestAllowed(pathname: string) {
  return pathname.startsWith('/invite/')
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must use getUser(), not getSession(), per Supabase SSR docs
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.includes(pathname)

  if (!user && !isPublic && !isGuestAllowed(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  // `icon$` exempts the generated app icon (app/icon.tsx) — without it, the
  // favicon request gets redirected to /login and browsers show a broken icon.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon$).*)'],
}
