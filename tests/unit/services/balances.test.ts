import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BalanceService } from '@/services/balances';
import { ExpenseService } from '@/services/expenses';
import { SettlementService } from '@/services/settlements';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    query: {
      groupMembers: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/services/expenses', () => ({
  ExpenseService: {
    getGroupExpenses: vi.fn(),
  },
}));

vi.mock('@/services/settlements', () => ({
  SettlementService: {
    getGroupSettlements: vi.fn(),
  },
}));

describe('BalanceService', () => {
  const mockGroupId = 'group-123';
  const mockUser1 = { id: 'user-1', name: 'Alice' };
  const mockUser2 = { id: 'user-2', name: 'Bob' };
  const mockUser3 = { id: 'user-3', name: 'Charlie' };

  beforeEach(() => {
    vi.clearAllMocks();

    (db.query.groupMembers.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { userId: mockUser1.id, user: mockUser1, role: 'admin' },
      { userId: mockUser2.id, user: mockUser2, role: 'member' },
      { userId: mockUser3.id, user: mockUser3, role: 'member' },
    ]);
  });

  describe('getGroupBalances', () => {
    it('should return empty array when no expenses or settlements exist', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await BalanceService.getGroupBalances(mockGroupId);

      expect(result).toEqual([]);
    });

    it('should calculate debt when one user pays for another', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'expense-1',
          paidByUserId: mockUser1.id,
          amount: '100',
          splits: [
            { userId: mockUser1.id, amount: '50' },
            { userId: mockUser2.id, amount: '50' },
          ],
        },
      ]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await BalanceService.getGroupBalances(mockGroupId);

      expect(result).toHaveLength(1);
      expect(result[0].fromUserId).toBe(mockUser2.id);
      expect(result[0].toUserId).toBe(mockUser1.id);
      expect(result[0].amount).toBe(50);
    });

    it('should reduce debt when settlement is recorded', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'expense-1',
          paidByUserId: mockUser1.id,
          amount: '100',
          splits: [
            { userId: mockUser1.id, amount: '50' },
            { userId: mockUser2.id, amount: '50' },
          ],
        },
      ]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'settlement-1',
          fromUserId: mockUser2.id,
          toUserId: mockUser1.id,
          amount: '30',
        },
      ]);

      const result = await BalanceService.getGroupBalances(mockGroupId);

      expect(result).toHaveLength(1);
      expect(result[0].fromUserId).toBe(mockUser2.id);
      expect(result[0].toUserId).toBe(mockUser1.id);
      expect(result[0].amount).toBe(20);
    });

    it('should return empty when debt is fully settled', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'expense-1',
          paidByUserId: mockUser1.id,
          amount: '100',
          splits: [
            { userId: mockUser1.id, amount: '50' },
            { userId: mockUser2.id, amount: '50' },
          ],
        },
      ]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'settlement-1',
          fromUserId: mockUser2.id,
          toUserId: mockUser1.id,
          amount: '50',
        },
      ]);

      const result = await BalanceService.getGroupBalances(mockGroupId);

      expect(result).toHaveLength(0);
    });

    it('should handle multiple expenses between same users', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'expense-1',
          paidByUserId: mockUser1.id,
          amount: '60',
          splits: [
            { userId: mockUser1.id, amount: '30' },
            { userId: mockUser2.id, amount: '30' },
          ],
        },
        {
          id: 'expense-2',
          paidByUserId: mockUser2.id,
          amount: '40',
          splits: [
            { userId: mockUser1.id, amount: '20' },
            { userId: mockUser2.id, amount: '20' },
          ],
        },
      ]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await BalanceService.getGroupBalances(mockGroupId);

      expect(result).toHaveLength(1);
      expect(result[0].fromUserId).toBe(mockUser2.id);
      expect(result[0].toUserId).toBe(mockUser1.id);
      expect(result[0].amount).toBe(10);
    });

    it('should ignore very small amounts (floating point tolerance)', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'expense-1',
          paidByUserId: mockUser1.id,
          amount: '100',
          splits: [
            { userId: mockUser1.id, amount: '50' },
            { userId: mockUser2.id, amount: '50' },
          ],
        },
      ]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'settlement-1',
          fromUserId: mockUser2.id,
          toUserId: mockUser1.id,
          amount: '49.995',
        },
      ]);

      const result = await BalanceService.getGroupBalances(mockGroupId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getGroupMemberBalances', () => {
    it('should return all members with their net balances', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'expense-1',
          paidByUserId: mockUser1.id,
          amount: '90',
          splits: [
            { userId: mockUser1.id, amount: '30' },
            { userId: mockUser2.id, amount: '30' },
            { userId: mockUser3.id, amount: '30' },
          ],
        },
      ]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await BalanceService.getGroupMemberBalances(mockGroupId);

      expect(result).toHaveLength(3);

      const aliceBalance = result.find((m) => m.userId === mockUser1.id);
      const bobBalance = result.find((m) => m.userId === mockUser2.id);
      const charlieBalance = result.find((m) => m.userId === mockUser3.id);

      expect(aliceBalance?.balance).toBe(60);
      expect(bobBalance?.balance).toBe(-30);
      expect(charlieBalance?.balance).toBe(-30);
    });
  });

  describe('getGroupStats', () => {
    it('should calculate total expenses and user balance', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'expense-1',
          paidByUserId: mockUser1.id,
          amount: '100',
          splits: [
            { userId: mockUser1.id, amount: '50' },
            { userId: mockUser2.id, amount: '50' },
          ],
        },
        {
          id: 'expense-2',
          paidByUserId: mockUser2.id,
          amount: '50',
          splits: [
            { userId: mockUser1.id, amount: '25' },
            { userId: mockUser2.id, amount: '25' },
          ],
        },
      ]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await BalanceService.getGroupStats(mockGroupId, mockUser1.id);

      expect(result.totalExpenses).toBe(150);
      expect(result.userBalance).toBe(25);
    });
  });

  describe('getMemberOutstandingBalance', () => {
    it('should return hasBalance true when member has outstanding debts', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'expense-1',
          paidByUserId: mockUser1.id,
          amount: '100',
          splits: [
            { userId: mockUser1.id, amount: '50' },
            { userId: mockUser2.id, amount: '50' },
          ],
        },
      ]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await BalanceService.getMemberOutstandingBalance(mockGroupId, mockUser2.id);

      expect(result.hasBalance).toBe(true);
      expect(result.balance).toBe(-50);
      expect(result.debts).toHaveLength(1);
    });

    it('should return hasBalance false when member has no debts', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await BalanceService.getMemberOutstandingBalance(mockGroupId, mockUser1.id);

      expect(result.hasBalance).toBe(false);
      expect(result.balance).toBe(0);
      expect(result.debts).toHaveLength(0);
    });
  });

  describe('hasOutstandingBalances', () => {
    it('should return true when there are outstanding debts in the group', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'expense-1',
          paidByUserId: mockUser1.id,
          amount: '100',
          splits: [
            { userId: mockUser1.id, amount: '50' },
            { userId: mockUser2.id, amount: '50' },
          ],
        },
      ]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await BalanceService.hasOutstandingBalances(mockGroupId);

      expect(result).toBe(true);
    });

    it('should return false when all debts are settled', async () => {
      (ExpenseService.getGroupExpenses as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (SettlementService.getGroupSettlements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await BalanceService.hasOutstandingBalances(mockGroupId);

      expect(result).toBe(false);
    });
  });
});
