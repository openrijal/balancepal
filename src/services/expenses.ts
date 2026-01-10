import { db } from '@/db';
import { expenses, expenseSplits, groupMembers, profiles } from '@/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';

export interface CreateExpenseData {
  amount: number;
  description: string;
  paidByUserId?: string; // Defaults to creator if not specified
  category?: 'food' | 'transport' | 'entertainment' | 'utilities' | 'shopping' | 'other';
  splits: {
    userId: string;
    amount: number;
  }[];
}

export class ExpenseService {
  static async createExpense(groupId: string, creatorUserId: string, data: CreateExpenseData) {
    return await db.transaction(async (tx) => {
      const paidBy = data.paidByUserId || creatorUserId;

      // 1. Create the expense record
      const [newExpense] = await tx
        .insert(expenses)
        .values({
          groupId,
          description: data.description,
          amount: data.amount.toString(), // Drizzle expects string for decimal/numeric
          currency: 'USD',
          paidByUserId: paidBy,
          category: data.category || 'other',
          date: new Date(),
        })
        .returning();

      if (!newExpense) {
        throw new Error('Failed to create expense');
      }

      // 2. Create split records
      if (data.splits.length > 0) {
        await tx.insert(expenseSplits).values(
          data.splits.map((split) => ({
            expenseId: newExpense.id,
            userId: split.userId,
            amount: split.amount.toString(),
            paid: split.userId === paidBy, // If payer is in split, it's technically "paid" or we can handle logic elsewhere. Schema says default false.
            // Actually, for "paid", it usually tracks if the debt is settled.
            // If I paid for myself, I don't owe anyone.
            // Use default false for now, settlement logic handles "paid" status usually via settlements table or updating this.
            // Let's keep it simple: false.
          }))
        );
      }

      return newExpense;
    });
  }

  static async getGroupExpenses(groupId: string, includeDeleted = false) {
    // Fetch expenses with the payer's profile information
    const whereClause = includeDeleted
      ? eq(expenses.groupId, groupId)
      : and(eq(expenses.groupId, groupId), isNull(expenses.deletedAt));

    return await db.query.expenses.findMany({
      where: whereClause,
      with: {
        paidBy: true, // Relation to profile
        splits: {
          with: {
            user: true, // Relation to profile for split user
          },
        },
      },
      orderBy: [desc(expenses.date)],
    });
  }

  static async deleteExpense(expenseId: string, userId: string) {
    return await db
      .update(expenses)
      .set({
        deletedAt: new Date(),
        deletedByUserId: userId,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();
  }
}
