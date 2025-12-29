import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';
import { supabase } from '@/lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const accessToken = cookies.get('sb-access-token')?.value;
        const refreshToken = cookies.get('sb-refresh-token')?.value;

        if (!accessToken || !refreshToken) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

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

export const GET: APIRoute = async ({ cookies }) => {
    try {
        const accessToken = cookies.get('sb-access-token')?.value;

        if (!accessToken) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const groups = await GroupService.getUserGroups(user.id);

        return new Response(JSON.stringify(groups), { status: 200 });

    } catch (error) {
        console.error('Error fetching groups:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
