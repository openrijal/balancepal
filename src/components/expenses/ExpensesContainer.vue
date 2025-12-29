<script setup lang="ts">
import { ref } from 'vue';
import ExpenseList from './ExpenseList.vue';
import CreateExpenseDialog from './CreateExpenseDialog.vue';

interface Expense {
  id: string;
  description: string;
  amount: number | string;
  date: string;
  paidBy: {
    name: string;
  };
}

const props = defineProps<{
  groupId: string;
  initialExpenses: Expense[];
}>();

const expenses = ref<Expense[]>(props.initialExpenses);

async function refreshExpenses() {
    try {
        const res = await fetch(`/api/groups/${props.groupId}/expenses`);
        if (res.ok) {
            expenses.value = await res.json();
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
        <CreateExpenseDialog :groupId="groupId" @expense-created="refreshExpenses" />
    </div>

    <ExpenseList :expenses="expenses" />
  </div>
</template>
