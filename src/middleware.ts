import { type NextRequest, NextResponse } from 'next/server';

// Define protected route patterns
const protectedRoutes = ['/dashboard'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the request is for a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For protected routes, check if user is authenticated
  try {
    // Note: This is a server middleware, so we need to work with headers
    // We'll let the protected page/component handle actual auth verification
    // This middleware just ensures session refresh
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  } catch (err) {
    console.error('Middleware error:', err);
    // On error, let the page handle the auth check
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match all paths except:
    // - api routes
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
