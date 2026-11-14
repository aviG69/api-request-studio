import { auth } from '@/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnAuth = req.nextUrl.pathname.startsWith('/auth')
  const isOnDashboard = req.nextUrl.pathname.startsWith('/w/')
  const isOnSettings = req.nextUrl.pathname.startsWith('/settings')

  if (isOnAuth) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/w/', req.nextUrl))
    }
    return
  }

  if (isOnDashboard || isOnSettings) {
    if (!isLoggedIn) {
      const callbackUrl = req.nextUrl.pathname + req.nextUrl.search
      return Response.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.nextUrl))
    }
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}