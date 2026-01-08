/**
 * Groups Store - Manages expense groups
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface GroupMember {
  id: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  // Populated from profiles
  name?: string;
  email?: string;
  profilePictureUrl?: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdBy: string;
  createdAt: string;
  members?: GroupMember[];
  memberCount?: number;
  totalExpenses?: number;
  userBalance?: number;
}

export const useGroupsStore = defineStore('groups', () => {
  // State
  const groups = ref<Group[]>([]);
  const currentGroup = ref<Group | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const groupCount = computed(() => groups.value.length);
  const hasGroups = computed(() => groups.value.length > 0);
  const groupById = computed(() => {
    return (id: string) => groups.value.find((g) => g.id === id) ?? null;
  });

  // Actions
  function setGroups(newGroups: Group[]) {
    groups.value = newGroups;
  }

  function setCurrentGroup(group: Group | null) {
    currentGroup.value = group;
  }

  function addGroup(group: Group) {
    groups.value.unshift(group);
  }

  function updateGroup(id: string, updates: Partial<Group>) {
    const index = groups.value.findIndex((g) => g.id === id);
    if (index !== -1) {
      groups.value[index] = { ...groups.value[index], ...updates };
    }
    if (currentGroup.value?.id === id) {
      currentGroup.value = { ...currentGroup.value, ...updates };
    }
  }

  function removeGroup(id: string) {
    groups.value = groups.value.filter((g) => g.id !== id);
    if (currentGroup.value?.id === id) {
      currentGroup.value = null;
    }
  }

  function setLoading(isLoading: boolean) {
    loading.value = isLoading;
  }

  function setError(newError: string | null) {
    error.value = newError;
  }

  async function fetchGroupStats(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/stats`);
      if (res.ok) {
        const data = await res.json();

        // Initialize currentGroup if not set or if it's a different group
        if (!currentGroup.value || currentGroup.value.id !== groupId) {
          currentGroup.value = {
            id: groupId,
            name: '',
            description: null,
            imageUrl: null,
            createdBy: '',
            createdAt: '',
            totalExpenses: data.totalExpenses,
            userBalance: data.userBalance,
          };
        } else {
          // Update existing currentGroup
          currentGroup.value = {
            ...currentGroup.value,
            totalExpenses: data.totalExpenses,
            userBalance: data.userBalance,
          };
        }

        // Also update in groups array if present
        updateGroup(groupId, {
          totalExpenses: data.totalExpenses,
          userBalance: data.userBalance,
        });
      }
    } catch (e) {
      console.error('Failed to fetch group stats', e);
    }
  }

  function clearGroups() {
    groups.value = [];
    currentGroup.value = null;
    error.value = null;
  }

  async function updateGroupDetails(groupId: string, data: { name: string; description?: string }) {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update group');
      }

      const updated = await res.json();
      updateGroup(groupId, updated);
      return { success: true, data: updated };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }

  async function deleteGroupById(groupId: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete group');
      }

      removeGroup(groupId);
      return { success: true };
    } catch (e: any) {
      setError(e.message);
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }

  async function removeMemberFromGroup(groupId: string, userId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove member');
      }

      // Update local state - remove member from currentGroup
      if (currentGroup.value?.id === groupId && currentGroup.value.members) {
        currentGroup.value = {
          ...currentGroup.value,
          members: currentGroup.value.members.filter(m => m.userId !== userId),
        };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  return {
    // State
    groups,
    currentGroup,
    loading,
    error,
    // Getters
    groupCount,
    hasGroups,
    groupById,
    // Actions
    setGroups,
    setCurrentGroup,
    addGroup,
    updateGroup,
    removeGroup,
    setLoading,
    setError,
    fetchGroupStats,
    clearGroups,
    updateGroupDetails,
    deleteGroupById,
    removeMemberFromGroup,
  };
});
