import { db } from '@/db';
import { expenses, settlements, groupMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ExpenseService } from './expenses';
import { SettlementService } from './settlements';

export interface Debt {
    fromUserId: string;
    toUserId: string;
    amount: number;
    fromUser?: { id: string; name: string };
    toUser?: { id: string; name: string };
}

export class BalanceService {
    static async getGroupBalances(groupId: string): Promise<Debt[]> {
        // 1. Fetch all data
        const groupExpenses = await ExpenseService.getGroupExpenses(groupId);
        const groupSettlements = await SettlementService.getGroupSettlements(groupId);

        // Fetch members to map names later if needed
        const members = await db.query.groupMembers.findMany({
            where: eq(groupMembers.groupId, groupId),
            with: { user: true }
        });
        const userMap = new Map(members.map(m => [m.userId, m.user]));

        const balancePair: Record<string, number> = {};
        const getPairKey = (u1: string, u2: string) => u1 < u2 ? `${u1}:${u2}` : `${u2}:${u1}`;

        // Helper: get net flow FROM u1 TO u2. Positive = u1 owes u2.
        const addFlow = (u1: string, u2: string, amount: number) => {
            if (u1 === u2) return; // Verify: Self-debts should be ignored

            const key = getPairKey(u1, u2);
            if (!balancePair[key]) balancePair[key] = 0;

            if (u1 < u2) {
                // Key is u1:u2. Value represents u1 -> u2.
                balancePair[key] += amount;
            } else {
                // Key is u2:u1. Value represents u2 -> u1.
                // We are adding u1 -> u2, which is u2 <- u1 or -(u2->u1).
                balancePair[key] -= amount;
            }
        };

        // 3. Process Expenses with Flow Model
        for (const expense of groupExpenses) {
            const payerId = expense.paidByUserId;
            for (const split of expense.splits) {
                // Splitter (Debtor) owes Payer (Creditor)
                // Flow: Splitter owes Payer.
                addFlow(split.userId, payerId, parseFloat(split.amount as string));
            }
        }

        // 4. Process Settlements with Flow Model
        // Settlement: FromUser pays ToUser.
        // This reduces the amount FromUser owes ToUser.
        for (const settlement of groupSettlements) {
            // FromUser paid ToUser.
            // This is negative debt flow (repayment).
            addFlow(settlement.fromUserId, settlement.toUserId, -parseFloat(settlement.amount as string));
        }

        // 5. Convert back to Debt list
        const results: Debt[] = [];
        for (const [key, netAmount] of Object.entries(balancePair)) {
            const [u1, u2] = key.split(':');

            // netAmount > 0: u1 owes u2
            // netAmount < 0: u2 owes u1
            // Tolerance for floating point
            if (Math.abs(netAmount) < 0.01) continue;

            if (netAmount > 0) {
                results.push({
                    fromUserId: u1,
                    toUserId: u2,
                    amount: netAmount,
                    fromUser: userMap.get(u1),
                    toUser: userMap.get(u2)
                });
            } else {
                results.push({
                    fromUserId: u2,
                    toUserId: u1,
                    amount: Math.abs(netAmount),
                    fromUser: userMap.get(u2),
                    toUser: userMap.get(u1)
                });
            }
        }

        return results;
    }

    static async getGroupStats(groupId: string, userId: string) {
        const groupExpenses = await ExpenseService.getGroupExpenses(groupId);
        const balances = await this.getGroupBalances(groupId);

        const totalExpenses = groupExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount as string), 0);

        let userBalance = 0;
        for (const debt of balances) {
            if (debt.toUserId === userId) {
                // Someone owes me
                userBalance += debt.amount;
            } else if (debt.fromUserId === userId) {
                // I owe someone
                userBalance -= debt.amount;
            }
        }

        return {
            totalExpenses,
            userBalance
        };
    }
}
