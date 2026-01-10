import type { APIRoute } from 'astro';
import { FriendsService } from '@/services/friends';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: APIRoute = async ({ params, locals }) => {
  const { id: friendId } = params;

  if (!friendId || !uuidRegex.test(friendId)) {
    return new Response(JSON.stringify({ error: 'Invalid friend ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // User is attached by middleware (401 already handled by middleware)
  const user = locals.user!;

  try {
    const friendDetails = await FriendsService.getFriendDetails(user.id, friendId);

    if (!friendDetails) {
      return new Response(JSON.stringify({ error: 'Friend not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(friendDetails), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Failed to fetch friend details', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
