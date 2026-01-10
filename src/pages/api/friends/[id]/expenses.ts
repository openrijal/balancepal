import type { APIRoute } from 'astro';
import { FriendsService } from '@/services/friends';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: APIRoute = async ({ params, url, locals }) => {
  const { id: friendId } = params;
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  if (!friendId || !uuidRegex.test(friendId)) {
    return new Response(JSON.stringify({ error: 'Invalid friend ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // User is attached by middleware (401 already handled by middleware)
  const user = locals.user!;

  try {
    const expenses = await FriendsService.getSharedExpenses(user.id, friendId, limit, offset);

    return new Response(JSON.stringify({ expenses }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Failed to fetch shared expenses', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
