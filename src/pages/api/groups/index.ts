import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // User is attached by middleware (401 already handled by middleware)
    const user = locals.user!;

    const body = await request.json();

    // Basic validation
    if (!body.name) {
      return new Response(JSON.stringify({ error: 'Group name is required' }), { status: 400 });
    }

    const group = await GroupService.createGroup(user.id, {
      name: body.name,
      description: body.description,
      currency: body.currency,
    });

    return new Response(JSON.stringify(group), { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    // User is attached by middleware (401 already handled by middleware)
    const user = locals.user!;

    const groups = await GroupService.getUserGroups(user.id);

    return new Response(JSON.stringify(groups), { status: 200 });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
