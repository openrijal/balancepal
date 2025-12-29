import type { APIRoute } from 'astro';
import { ExpenseService } from '@/services/expenses';
import { GroupService } from '@/services/groups';
import { getUser } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies, params }) => {
    try {
        const { id: groupId } = params;
        if (!groupId) {
            return new Response(JSON.stringify({ error: 'Group ID is required' }), { status: 400 });
        }

        // 1. Authenticate
        const user = await getUser(cookies);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // 2. Verify Membership
        const group = await GroupService.getGroupDetails(groupId);
        if (!group) {
            return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404 });
        }

        const isMember = group.members.some(m => m.user.id === user.id);
        if (!isMember) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        // 3. Parse Body
        const body = await request.json();

        // Basic validation
        if (!body.description || !body.amount) {
            return new Response(JSON.stringify({ error: 'Description and amount are required' }), { status: 400 });
        }

        // 4. Create Expense
        // Default split: Equal split among all members if not provided? 
        // Or expect frontend to send splits?
        // Implementation plan said "Equal Split" logic.
        // Let's assume the frontend sends the splits for now to keep API flexible, 
        // OR the API calculates it if 'splits' is missing?
        // Let's implement robust handling: if splits missing, split equally among all members.

        let splits = body.splits;
        if (!splits || splits.length === 0) {
            const memberCount = group.members.length;
            const amount = parseFloat(body.amount);
            const splitAmount = parseFloat((amount / memberCount).toFixed(2));

            // Handle remainder (cents)
            // For now simple split.
            splits = group.members.map(m => ({
                userId: m.user.id,
                amount: splitAmount
            }));
        }

        const expense = await ExpenseService.createExpense(groupId, user.id, {
            description: body.description,
            amount: body.amount,
            paidByUserId: body.paidByUserId || user.id, // Support paying for others?
            category: body.category,
            splits
        });

        return new Response(JSON.stringify(expense), { status: 201 });

    } catch (error) {
        console.error('Error creating expense:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};

export const GET: APIRoute = async ({ cookies, params }) => {
    try {
        const { id: groupId } = params;
        if (!groupId) {
            return new Response(JSON.stringify({ error: 'Group ID is required' }), { status: 400 });
        }

        const user = await getUser(cookies);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Verify Membership
        // We could optimize this by not fetching full group details if we trust getGroupExpenses to be safe?
        // But for now, explicit check is safer.
        const group = await GroupService.getGroupDetails(groupId);
        if (!group) {
            return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404 });
        }

        const isMember = group.members.some(m => m.user.id === user.id);
        if (!isMember) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        const expenses = await ExpenseService.getGroupExpenses(groupId);

        return new Response(JSON.stringify(expenses), { status: 200 });

    } catch (error) {
        console.error('Error fetching expenses:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
