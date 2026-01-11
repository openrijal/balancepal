import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGroupsStore, type Group } from '@/stores/groupsStore';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('groupsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
    id: 'group-123',
    name: 'Test Group',
    description: 'A test group',
    imageUrl: null,
    createdBy: 'user-123',
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  describe('initial state', () => {
    it('should have empty groups array initially', () => {
      const store = useGroupsStore();
      expect(store.groups).toEqual([]);
    });

    it('should have null currentGroup initially', () => {
      const store = useGroupsStore();
      expect(store.currentGroup).toBeNull();
    });

    it('should have loading false initially', () => {
      const store = useGroupsStore();
      expect(store.loading).toBe(false);
    });

    it('should have null error initially', () => {
      const store = useGroupsStore();
      expect(store.error).toBeNull();
    });
  });

  describe('getters', () => {
    it('groupCount should return the number of groups', () => {
      const store = useGroupsStore();
      store.setGroups([createMockGroup({ id: 'g1' }), createMockGroup({ id: 'g2' })]);

      expect(store.groupCount).toBe(2);
    });

    it('hasGroups should return false when no groups', () => {
      const store = useGroupsStore();
      expect(store.hasGroups).toBe(false);
    });

    it('hasGroups should return true when groups exist', () => {
      const store = useGroupsStore();
      store.setGroups([createMockGroup()]);

      expect(store.hasGroups).toBe(true);
    });

    it('groupById should return group when found', () => {
      const store = useGroupsStore();
      const group = createMockGroup({ id: 'group-abc' });
      store.setGroups([group]);

      expect(store.groupById('group-abc')).toEqual(group);
    });

    it('groupById should return null when not found', () => {
      const store = useGroupsStore();
      store.setGroups([createMockGroup({ id: 'group-abc' })]);

      expect(store.groupById('nonexistent')).toBeNull();
    });
  });

  describe('actions', () => {
    describe('setGroups', () => {
      it('should replace groups array', () => {
        const store = useGroupsStore();
        const groups = [createMockGroup({ id: 'g1' }), createMockGroup({ id: 'g2' })];

        store.setGroups(groups);

        expect(store.groups).toEqual(groups);
      });
    });

    describe('setCurrentGroup', () => {
      it('should set current group', () => {
        const store = useGroupsStore();
        const group = createMockGroup();

        store.setCurrentGroup(group);

        expect(store.currentGroup).toEqual(group);
      });

      it('should handle null', () => {
        const store = useGroupsStore();
        store.setCurrentGroup(createMockGroup());

        store.setCurrentGroup(null);

        expect(store.currentGroup).toBeNull();
      });
    });

    describe('addGroup', () => {
      it('should add group to beginning of array', () => {
        const store = useGroupsStore();
        store.setGroups([createMockGroup({ id: 'g1', name: 'First' })]);

        const newGroup = createMockGroup({ id: 'g2', name: 'New' });
        store.addGroup(newGroup);

        expect(store.groups).toHaveLength(2);
        expect(store.groups[0].name).toBe('New');
      });
    });

    describe('updateGroup', () => {
      it('should update group in array', () => {
        const store = useGroupsStore();
        store.setGroups([createMockGroup({ id: 'g1', name: 'Original' })]);

        store.updateGroup('g1', { name: 'Updated' });

        expect(store.groups[0].name).toBe('Updated');
      });

      it('should update currentGroup if it matches', () => {
        const store = useGroupsStore();
        const group = createMockGroup({ id: 'g1', name: 'Original' });
        store.setGroups([group]);
        store.setCurrentGroup(group);

        store.updateGroup('g1', { name: 'Updated' });

        expect(store.currentGroup?.name).toBe('Updated');
      });

      it('should not update if group id not found', () => {
        const store = useGroupsStore();
        store.setGroups([createMockGroup({ id: 'g1', name: 'Original' })]);

        store.updateGroup('nonexistent', { name: 'Updated' });

        expect(store.groups[0].name).toBe('Original');
      });
    });

    describe('removeGroup', () => {
      it('should remove group from array', () => {
        const store = useGroupsStore();
        store.setGroups([createMockGroup({ id: 'g1' }), createMockGroup({ id: 'g2' })]);

        store.removeGroup('g1');

        expect(store.groups).toHaveLength(1);
        expect(store.groups[0].id).toBe('g2');
      });

      it('should clear currentGroup if it matches removed group', () => {
        const store = useGroupsStore();
        const group = createMockGroup({ id: 'g1' });
        store.setGroups([group]);
        store.setCurrentGroup(group);

        store.removeGroup('g1');

        expect(store.currentGroup).toBeNull();
      });
    });

    describe('setLoading', () => {
      it('should set loading state', () => {
        const store = useGroupsStore();

        store.setLoading(true);
        expect(store.loading).toBe(true);

        store.setLoading(false);
        expect(store.loading).toBe(false);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        const store = useGroupsStore();

        store.setError('Something went wrong');

        expect(store.error).toBe('Something went wrong');
      });
    });

    describe('clearGroups', () => {
      it('should clear all groups state', () => {
        const store = useGroupsStore();
        store.setGroups([createMockGroup()]);
        store.setCurrentGroup(createMockGroup());
        store.setError('Some error');

        store.clearGroups();

        expect(store.groups).toEqual([]);
        expect(store.currentGroup).toBeNull();
        expect(store.error).toBeNull();
      });
    });

    describe('fetchGroupStats', () => {
      it('should update currentGroup with stats on success', async () => {
        const store = useGroupsStore();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ totalExpenses: 500, userBalance: 100 }),
        });

        await store.fetchGroupStats('group-123');

        expect(store.currentGroup?.totalExpenses).toBe(500);
        expect(store.currentGroup?.userBalance).toBe(100);
      });

      it('should update existing currentGroup if ids match', async () => {
        const store = useGroupsStore();
        store.setCurrentGroup(createMockGroup({ id: 'group-123', name: 'My Group' }));

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ totalExpenses: 200, userBalance: -50 }),
        });

        await store.fetchGroupStats('group-123');

        expect(store.currentGroup?.name).toBe('My Group');
        expect(store.currentGroup?.totalExpenses).toBe(200);
      });

      it('should handle fetch error gracefully', async () => {
        const store = useGroupsStore();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await store.fetchGroupStats('group-123');

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('updateGroupDetails', () => {
      it('should update group and return success on API success', async () => {
        const store = useGroupsStore();
        store.setGroups([createMockGroup({ id: 'group-123', name: 'Original' })]);

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ id: 'group-123', name: 'Updated', description: 'New desc' }),
        });

        const result = await store.updateGroupDetails('group-123', {
          name: 'Updated',
          description: 'New desc',
        });

        expect(result.success).toBe(true);
        expect(store.groups[0].name).toBe('Updated');
      });

      it('should return error on API failure', async () => {
        const store = useGroupsStore();
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        });

        const result = await store.updateGroupDetails('group-123', { name: 'Test' });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unauthorized');
      });
    });

    describe('deleteGroupById', () => {
      it('should remove group and return success on API success', async () => {
        const store = useGroupsStore();
        store.setGroups([createMockGroup({ id: 'group-123' })]);

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        const result = await store.deleteGroupById('group-123');

        expect(result.success).toBe(true);
        expect(store.groups).toHaveLength(0);
      });

      it('should return error on API failure', async () => {
        const store = useGroupsStore();
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Cannot delete group with outstanding balances' }),
        });

        const result = await store.deleteGroupById('group-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Cannot delete group with outstanding balances');
      });
    });

    describe('removeMemberFromGroup', () => {
      it('should remove member from currentGroup on success', async () => {
        const store = useGroupsStore();
        store.setCurrentGroup({
          ...createMockGroup({ id: 'group-123' }),
          members: [
            { id: 'm1', userId: 'user-1', role: 'admin', joinedAt: new Date().toISOString() },
            { id: 'm2', userId: 'user-2', role: 'member', joinedAt: new Date().toISOString() },
          ],
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        const result = await store.removeMemberFromGroup('group-123', 'user-2');

        expect(result.success).toBe(true);
        expect(store.currentGroup?.members).toHaveLength(1);
        expect(store.currentGroup?.members?.[0].userId).toBe('user-1');
      });

      it('should return error on API failure', async () => {
        const store = useGroupsStore();
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Member has outstanding balance' }),
        });

        const result = await store.removeMemberFromGroup('group-123', 'user-2');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Member has outstanding balance');
      });
    });
  });
});
