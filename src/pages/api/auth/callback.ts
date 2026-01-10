import { type APIRoute } from 'astro';
import { createSupabaseServerClient } from '@/lib/auth';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    console.log('[Callback] Cookie Header:', request.headers.get('cookie'));
    const supabase = createSupabaseServerClient(cookies);
    console.log('[Callback] Exchanging code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Callback] Error exchanging code for session:', error);
      return redirect(`/login?error=${error.message}`);
    }

    if (data.session) {
      console.log('[Callback] Session established, redirecting to:', next);
      return redirect(next);
    } else {
      console.warn('[Callback] No session returned despite no error');
      return redirect('/login?error=no_session');
    }
  }

  // Return the user to an error page with some instructions
  console.log('[Callback] No code found in URL');
  return redirect('/login?error=auth_callback_error');
};
