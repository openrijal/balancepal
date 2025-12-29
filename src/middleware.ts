/**
 * Astro Middleware - Handle authentication for protected routes
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
];

// Routes only for unauthenticated users
const authRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
];

export const onRequest = defineMiddleware(async ({ cookies, url, redirect }, next) => {
    const pathname = url.pathname;

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    // Check if route is auth-only
    const isAuthRoute = authRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    // Get current user
    const user = await getUser(cookies);

    // Redirect unauthenticated users from protected routes
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
