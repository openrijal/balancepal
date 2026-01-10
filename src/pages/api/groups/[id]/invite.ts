import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';

export const POST: APIRoute = async ({ request, params, locals }) => {
  try {
    const { id: groupId } = params;

    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID required' }), { status: 400 });
    }

    // User is attached by middleware (401 already handled by middleware)
    const user = locals.user!;

    const body = await request.json();

    if (!body.email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const invitation = await GroupService.createInvitation(groupId, user.id, body.email);

    return new Response(JSON.stringify(invitation), { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
