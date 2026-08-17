import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, allow all requests through — auth is optional in MVP
  // In production, check for session cookie and redirect to /login if missing
  
  // Skip auth for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for NextAuth session token
  const sessionToken = request.cookies.get('next-auth.session-token')?.value

  // Allow access to login page without session
  if (request.nextUrl.pathname === '/login') {
    if (sessionToken) {
      // Already logged in, redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // For MVP: allow all routes without auth check
  // Uncomment below for production auth enforcement:
  // if (!sessionToken) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
