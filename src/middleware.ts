import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/forgot-password",
    "/set-password",
    "/auth/reset-password",
  ];
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    publicRoutes.some((route) => pathname.startsWith(route));

  // Define admin routes that require admin role
  const adminRoutes = ["/admin"];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Define protected routes that require authentication
  const protectedRoutes = [
    "/home",
    "/ai-assistant",
    "/training",
    "/rfq",
    "/support",
    "/manuals",
    "/news",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Skip auth check for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Early return for public routes - allow access without auth check
  // This prevents issues if Supabase client fails to initialize
  if (isPublicRoute) {
    // We still need to check if authenticated user is trying to access login/forgot-password
    // But if Supabase fails, we'll allow access anyway
    try {
      const response = NextResponse.next({
        request: {
          headers: req.headers,
        },
      });

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return req.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              req.cookies.set({
                name,
                value,
                ...options,
              });
              response.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove(name: string, options: CookieOptions) {
              req.cookies.set({
                name,
                value: "",
                ...options,
              });
              response.cookies.set({
                name,
                value: "",
                ...options,
              });
            },
          },
        }
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If authenticated and trying to access login/forgot-password, redirect to portal
      if (
        session &&
        (pathname === "/login" || pathname === "/forgot-password")
      ) {
        return NextResponse.redirect(new URL("/home", req.url));
      }

      return response;
    } catch (error) {
      // If Supabase fails, allow access to public routes anyway
      console.error("Middleware error for public route:", error);
      return NextResponse.next();
    }
  }

  // Create Supabase client for server-side session check
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  let supabase;
  let isAuthenticated = false;
  let userRole: string | null = null;

  try {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            req.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            req.cookies.set({
              name,
              value: "",
              ...options,
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    isAuthenticated = !!session;

    // Get user role if authenticated
    if (isAuthenticated && session?.user) {
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        userRole = userData?.role || null;
      } catch (error) {
        // Ignore errors - role check will fail gracefully
        console.error("Error fetching user role:", error);
      }
    }
  } catch (error) {
    // If Supabase fails, log error but continue
    // Unauthenticated users will be redirected to login for protected routes
    console.error("Middleware error:", error);
  }

  // Redirect root to home if authenticated, otherwise to login
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/home", req.url));
    } else {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // If user is authenticated and trying to access public auth routes, redirect to home
  if (
    isAuthenticated &&
    (pathname === "/login" || pathname === "/forgot-password")
  ) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is not authenticated and trying to access admin routes, redirect to login
  if (!isAuthenticated && isAdminRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated but not admin and trying to access admin routes, redirect to portal
  if (isAuthenticated && isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
