import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const url = req.nextUrl.clone()
  
  const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/register')
  const isAdminPage = url.pathname.startsWith('/admin')
  const isProtectedPage = url.pathname === '/dashboard' || 
                          url.pathname.startsWith('/canteens') || 
                          url.pathname.startsWith('/orders') || 
                          url.pathname.startsWith('/wallet') || 
                          url.pathname.startsWith('/recommendations') ||
                          url.pathname.startsWith('/settings')

  if (!token) {
    if (isProtectedPage || isAdminPage) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  } else {
    // If logged in and on auth page, redirect to dashboard
    if (isAuthPage) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    
    // If accessing admin page, check role
    if (isAdminPage && token.role !== 'ADMIN') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
