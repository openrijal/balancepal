import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';
import { ExpenseService } from '@/services/expenses';
import { SettlementService } from '@/services/settlements';

interface ActivityItem {
    id: string;
    type: 'expense' | 'settlement';
    description: string;
    amount: number;
    date: string;
    groupName: string;
    user: {
        name: string;
    };
    recipient?: {
        name: string;
    };
}

export const GET: APIRoute = async ({ locals }) => {
    // User is attached by middleware (401 already handled by middleware)
    const user = locals.user!;

    try {
        // Get all user's groups
        const groups = await GroupService.getUserGroups(user.id);

        const activities: ActivityItem[] = [];

        // Fetch recent expenses and settlements from each group
        for (const group of groups.slice(0, 5)) { // Limit to 5 groups for performance
            const [expenses, settlements] = await Promise.all([
                ExpenseService.getGroupExpenses(group.id),
                SettlementService.getGroupSettlements(group.id),
            ]);

            // Add expenses to activities
            for (const expense of expenses.slice(0, 5)) {
                activities.push({
                    id: expense.id,
                    type: 'expense',
                    description: expense.description,
                    amount: parseFloat(expense.amount),
                    date: expense.date.toISOString(),
                    groupName: group.name,
                    user: {
                        name: expense.paidBy?.name || 'Unknown',
                    },
                });
            }

            // Add settlements to activities
            for (const settlement of settlements.slice(0, 5)) {
                activities.push({
                    id: settlement.id,
                    type: 'settlement',
                    description: `Payment to ${settlement.toUser?.name || 'Unknown'}`,
                    amount: parseFloat(settlement.amount),
                    date: settlement.date.toISOString(),
                    groupName: group.name,
                    user: {
                        name: settlement.fromUser?.name || 'Unknown',
                    },
                    recipient: {
                        name: settlement.toUser?.name || 'Unknown',
                    },
                });
            }
        }

        // Sort by date descending and limit to 10 items
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return new Response(JSON.stringify(activities.slice(0, 10)), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Failed to fetch recent activity', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
