import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';
import { getUser } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies, params }) => {
  try {
    const { id: groupId } = params;
    if (!groupId)
      return new Response(JSON.stringify({ error: 'Group ID is required' }), { status: 400 });

    const user = await getUser(cookies);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const group = await GroupService.getGroupDetails(groupId);
    if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404 });

    const isMember = group.members.some((m) => m.user.id === user.id);
    if (!isMember) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    const body = await request.json();
    if (!body.email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const invitation = await GroupService.createInvitation(groupId, user.id, body.email);

    // Construct link (assuming localhost or production URL)
    const baseUrl = new URL(request.url).origin;
    const link = `${baseUrl}/invites/${invitation.token}`;

    return new Response(
      JSON.stringify({
        token: invitation.token,
        link,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invitation:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
