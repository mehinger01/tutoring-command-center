import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  try {
    // Refresh session for all requests using @supabase/ssr pattern
    // This keeps the session cookie up-to-date
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Create a Supabase client with request/response cookies
    // This handles cookie-based session management
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value }) => {
              response.cookies.set(name, value, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365 * 100,
              });
            });
          },
        },
      }
    );

    // Call getUser to refresh the session
    // This triggers Supabase to refresh the session if needed
    await supabase.auth.getUser();

    // Protected route enforcement still happens in page/layout components
    // This middleware only handles cookie-based session refresh

    return response;
  } catch (err) {
    console.error('Middleware error:', err);
    // Continue even if session refresh fails
    // Page-level auth checks will handle authentication enforcement
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
