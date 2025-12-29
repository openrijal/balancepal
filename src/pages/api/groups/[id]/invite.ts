import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';
import { supabase } from '@/lib/supabase';

export const POST: APIRoute = async ({ request, cookies, params }) => {
    try {
        const { id: groupId } = params;

        if (!groupId) {
            return new Response(JSON.stringify({ error: 'Group ID required' }), { status: 400 });
        }

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
