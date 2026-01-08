/**
 * Astro Middleware - Handle authentication for protected routes
 * Attaches user to locals for all requests
 */
import { defineMiddleware } from 'astro:middleware';
import { getUser } from '@/lib/auth';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/groups',
  '/expenses',
  '/balances',
  '/profile',
  '/notifications',
  '/friends',
  '/activity',
  '/invites',
];

// API routes that require authentication
const protectedApiRoutes = [
  '/api/dashboard',
  '/api/groups',
  '/api/expenses',
  '/api/friends',
  '/api/sidebar',
];

// Routes only for unauthenticated users
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect, locals } = context;
  const pathname = url.pathname;

  // Get current user and attach to locals (available to all pages/APIs)
  const user = await getUser(cookies);
  locals.user = user;

  // Check route types
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  const isProtectedApiRoute = protectedApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Handle protected API routes - return 401 JSON instead of redirect
  if (isProtectedApiRoute && !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Redirect unauthenticated users from protected page routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirect', pathname);
    return redirect(loginUrl.toString());
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    return redirect('/dashboard');
  }

  return next();
});
