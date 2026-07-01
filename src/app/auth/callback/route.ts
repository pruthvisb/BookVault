import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow
  // implemented by the SSR package. It exchanges an auth code for the user's session.
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error("Auth callback code exchange error:", error);
      return NextResponse.redirect(
        new URL(`/?error=auth-callback-failed&details=${encodeURIComponent(error.message)}`, request.url)
      );
    }
  }

  // Return the user to home with a generic error if no code is present
  return NextResponse.redirect(new URL("/?error=auth-callback-missing", request.url));
}
