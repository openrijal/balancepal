<script setup lang="ts">
import { ref, computed } from 'vue';
import ExpenseList from './ExpenseList.vue';
import CreateExpenseDialog from './CreateExpenseDialog.vue';
import { useGroupsStore } from '@/stores/groupsStore';

const groupsStore = useGroupsStore();

interface Expense {
  id: string;
  description: string;
  amount: number | string;
  date: string;
  paidBy: {
    id: string;
    name: string;
  };
  splits: {
    userId: string;
    amount: number | string;
  }[];
}

const props = defineProps<{
  groupId: string;
  initialExpenses: Expense[];
  memberCount: number;
  currentUserId: string;
}>();

const expenses = ref<Expense[]>(props.initialExpenses);
const canAddExpense = computed(() => props.memberCount > 1);

async function refreshExpenses() {
    try {
        const res = await fetch(`/api/groups/${props.groupId}/expenses`);
        if (res.ok) {
            expenses.value = await res.json();
            // Refresh group stats via the shared Pinia store
            groupsStore.fetchGroupStats(props.groupId);
        }
    } catch (e) {
        console.error('Failed to refresh expenses', e);
    }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Expenses</h2>
        <div v-if="!canAddExpense" class="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Invite members to add expenses
        </div>
        <CreateExpenseDialog v-else :groupId="groupId" @expense-created="refreshExpenses" />
    </div>

    <ExpenseList :expenses="expenses" :current-user-id="currentUserId" />
  </div>
</template>
