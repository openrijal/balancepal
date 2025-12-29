<script setup lang="ts">
import { computed } from 'vue';
import { User, Receipt } from 'lucide-vue-next';

// Define strict types or use any for now if types are complex to share
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
  expenses: Expense[];
}>();

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="expenses.length === 0" class="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
      <Receipt class="mx-auto h-8 w-8 opacity-50 mb-2" />
      No expenses yet. Add one to get started!
    </div>

    <div v-else class="space-y-3">
        <div 
            v-for="expense in expenses" 
            :key="expense.id"
            class="bg-card flex items-center justify-between rounded-lg border p-4 shadow-sm transition-colors hover:bg-gray-50"
        >
            <div class="flex items-center gap-4">
                <!-- Date Box -->
                <div class="bg-muted flex h-12 w-12 flex-col items-center justify-center rounded-lg text-xs font-medium">
                    <span class="text-xs uppercase">{{ formatDate(expense.date).split(' ')[0] }}</span>
                    <span class="text-lg font-bold">{{ formatDate(expense.date).split(' ')[1] }}</span>
                </div>

                <div>
                    <h4 class="font-medium text-gray-900">{{ expense.description }}</h4>
                    <p class="text-muted-foreground text-xs">
                        Paid by <span class="font-medium text-gray-700">{{ expense.paidBy?.name || 'Unknown' }}</span>
                    </p>
                </div>
            </div>

            <div class="text-right">
                <span class="block font-bold text-gray-900">
                    {{ formatCurrency(expense.amount) }}
                </span>
                <!-- Maybe show "you borrowed" or "you lent" details later -->
            </div>
        </div>
    </div>
  </div>
</template>
