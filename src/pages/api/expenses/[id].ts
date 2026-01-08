import type { APIRoute } from 'astro';
import { ExpenseService } from '@/services/expenses';

export const DELETE: APIRoute = async ({ params, locals }) => {
    const user = locals.user!;
    const { id } = params;

    if (!id) {
        return new Response(JSON.stringify({ error: 'Expense ID is required' }), { status: 400 });
    }

    try {
        const deleted = await ExpenseService.deleteExpense(id, user.id);

        if (!deleted || deleted.length === 0) {
            return new Response(JSON.stringify({ error: 'Expense not found or already deleted' }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, expense: deleted[0] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Failed to delete expense', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
