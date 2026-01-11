import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseService } from '@/services/expenses';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(),
    query: {
      expenses: {
        findMany: vi.fn(),
      },
    },
    update: vi.fn(),
  },
}));

describe('ExpenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createExpense', () => {
    it('should create an expense with splits in a transaction', async () => {
      const mockGroupId = 'group-123';
      const mockUserId = 'user-123';
      const mockData = {
        amount: 100,
        description: 'Dinner',
        category: 'food' as const,
        splits: [
          { userId: 'user-123', amount: 50 },
          { userId: 'user-456', amount: 50 },
        ],
      };

      const mockExpense = {
        id: 'expense-123',
        groupId: mockGroupId,
        description: 'Dinner',
        amount: '100',
        currency: 'USD',
        paidByUserId: mockUserId,
        category: 'food',
        date: new Date(),
      };

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      };

      mockTx.returning.mockResolvedValueOnce([mockExpense]);

      (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await ExpenseService.createExpense(mockGroupId, mockUserId, mockData);

      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockExpense);
    });

    it('should use creator as paidBy when paidByUserId is not specified', async () => {
      const mockGroupId = 'group-123';
      const mockUserId = 'user-123';
      const mockData = {
        amount: 50,
        description: 'Coffee',
        splits: [{ userId: 'user-123', amount: 50 }],
      };

      const mockExpense = {
        id: 'expense-456',
        groupId: mockGroupId,
        description: 'Coffee',
        amount: '50',
        paidByUserId: mockUserId,
      };

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockExpense]),
      };

      (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await ExpenseService.createExpense(mockGroupId, mockUserId, mockData);

      expect(result.paidByUserId).toBe(mockUserId);
    });

    it('should use specified paidByUserId when provided', async () => {
      const mockGroupId = 'group-123';
      const mockCreatorId = 'user-123';
      const mockPayerId = 'user-456';
      const mockData = {
        amount: 75,
        description: 'Groceries',
        paidByUserId: mockPayerId,
        splits: [
          { userId: 'user-123', amount: 37.5 },
          { userId: 'user-456', amount: 37.5 },
        ],
      };

      const mockExpense = {
        id: 'expense-789',
        groupId: mockGroupId,
        description: 'Groceries',
        amount: '75',
        paidByUserId: mockPayerId,
      };

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockExpense]),
      };

      (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await ExpenseService.createExpense(mockGroupId, mockCreatorId, mockData);

      expect(result.paidByUserId).toBe(mockPayerId);
    });

    it('should throw error when expense creation returns empty array', async () => {
      const mockGroupId = 'group-123';
      const mockUserId = 'user-123';
      const mockData = {
        amount: 100,
        description: 'Test',
        splits: [],
      };

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await expect(ExpenseService.createExpense(mockGroupId, mockUserId, mockData)).rejects.toThrow(
        'Failed to create expense'
      );
    });

    it('should call insert only once when splits array is empty', async () => {
      const mockGroupId = 'group-123';
      const mockUserId = 'user-123';
      const mockData = {
        amount: 100,
        description: 'Personal expense',
        splits: [],
      };

      const mockExpense = {
        id: 'expense-123',
        groupId: mockGroupId,
        description: 'Personal expense',
        amount: '100',
      };

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockExpense]),
      };

      (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await ExpenseService.createExpense(mockGroupId, mockUserId, mockData);

      expect(mockTx.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGroupExpenses', () => {
    it('should fetch expenses for a group excluding deleted by default', async () => {
      const mockGroupId = 'group-123';
      const mockExpenses = [
        {
          id: 'expense-1',
          description: 'Lunch',
          amount: '25.00',
          paidBy: { name: 'John' },
          splits: [],
        },
        {
          id: 'expense-2',
          description: 'Dinner',
          amount: '50.00',
          paidBy: { name: 'Jane' },
          splits: [],
        },
      ];

      (db.query.expenses.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockExpenses);

      const result = await ExpenseService.getGroupExpenses(mockGroupId);

      expect(db.query.expenses.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockExpenses);
    });

    it('should include deleted expenses when includeDeleted is true', async () => {
      const mockGroupId = 'group-123';
      const mockExpenses = [
        { id: 'expense-1', deletedAt: null },
        { id: 'expense-2', deletedAt: new Date() },
      ];

      (db.query.expenses.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockExpenses);

      const result = await ExpenseService.getGroupExpenses(mockGroupId, true);

      expect(db.query.expenses.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('deleteExpense', () => {
    it('should soft delete an expense by setting deletedAt and deletedByUserId', async () => {
      const mockExpenseId = 'expense-123';
      const mockUserId = 'user-123';
      const mockDeletedExpense = {
        id: mockExpenseId,
        deletedAt: new Date(),
        deletedByUserId: mockUserId,
      };

      const mockChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockDeletedExpense]),
      };

      (db.update as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await ExpenseService.deleteExpense(mockExpenseId, mockUserId);

      expect(db.update).toHaveBeenCalled();
      expect(result).toEqual([mockDeletedExpense]);
      expect(result[0].deletedAt).toBeDefined();
      expect(result[0].deletedByUserId).toBe(mockUserId);
    });
  });
});
