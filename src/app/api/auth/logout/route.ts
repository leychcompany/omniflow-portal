import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { POST_LOGOUT_EXTERNAL_URL } from "@/lib/post-logout-redirect";

export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("redirect")?.trim();
  const redirectTo = param || POST_LOGOUT_EXTERNAL_URL;
  const target =
    redirectTo.startsWith("http://") || redirectTo.startsWith("https://")
      ? redirectTo
      : new URL(redirectTo, request.url).toString();

  const response = NextResponse.redirect(target);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  await supabase.auth.signOut();

  return response;
}
