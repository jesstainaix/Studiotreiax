import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Redirecionar usuários autenticados da página inicial para o dashboard
    if (req.nextUrl.pathname === '/' && req.nextauth.token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Redirecionar usuários não autenticados de páginas protegidas para login
    if (!req.nextauth.token && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    if (!req.nextauth.token && req.nextUrl.pathname.startsWith('/editor')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    if (!req.nextauth.token && req.nextUrl.pathname.startsWith('/projects')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    if (!req.nextauth.token && req.nextUrl.pathname.startsWith('/templates')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso a páginas públicas
        if (req.nextUrl.pathname === '/' || 
            req.nextUrl.pathname.startsWith('/auth/') ||
            req.nextUrl.pathname.startsWith('/api/auth/')) {
          return true
        }
        
        // Exigir autenticação para outras páginas
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}