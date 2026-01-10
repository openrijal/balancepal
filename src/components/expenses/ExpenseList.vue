<script setup lang="ts">
import { computed } from 'vue';
import { Receipt, Utensils, Car, Gamepad2, Lightbulb, ShoppingBag } from 'lucide-vue-next';
import TransactionItem from './TransactionItem.vue';

interface Expense {
  id: string;
  description: string;
  amount: number | string;
  date: string;
  category: string;
  paidBy: {
    id: string;
    name: string;
  };
  splits: {
    userId: string;
    user: { id: string; name: string };
    amount: number | string;
  }[];
  updatedAt?: string;
  receiptUrl?: string;
}

const props = defineProps<{
  expenses: Expense[];
  currentUserId: string;
}>();

const formatMonthYear = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.getDate(),
  };
};

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'food':
      return Utensils;
    case 'transport':
      return Car;
    case 'entertainment':
      return Gamepad2;
    case 'utilities':
      return Lightbulb;
    case 'shopping':
      return ShoppingBag;
    default:
      return Receipt;
  }
};

// Group expenses by Month Year
const groupedExpenses = computed(() => {
  const groups: Record<string, Expense[]> = {};

  props.expenses.forEach((expense) => {
    const key = formatMonthYear(expense.date);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(expense);
  });

  return Object.entries(groups).map(([monthYear, items]) => ({
    monthYear,
    items,
  }));
});

// Calculate what current user owes or is owed for an expense
const getExpenseContext = (expense: Expense) => {
  const isPayer = expense.paidBy.id === props.currentUserId;
  const userSplit = expense.splits.find((s) => s.userId === props.currentUserId);
  const userAmount = userSplit ? Number(userSplit.amount) : 0;

  if (isPayer) {
    const othersOwe = Number(expense.amount) - userAmount;
    if (othersOwe > 0) {
      return {
        label: `you lent`,
        amount: formatCurrency(othersOwe),
        class: 'text-emerald-600',
      };
    }
    return {
      label: 'you paid',
      amount: formatCurrency(expense.amount),
      class: 'text-gray-500',
    };
  } else {
    if (userAmount > 0) {
      return {
        label: `${expense.paidBy.name.split(' ')[0]} lent you`,
        amount: formatCurrency(userAmount),
        class: 'text-orange-600',
      };
    }
    return {
      label: 'not involved',
      amount: '',
      class: 'text-gray-400',
    };
  }
};
</script>

<template>
  <div class="space-y-8">
    <div
      v-if="expenses.length === 0"
      class="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm"
    >
      <Receipt class="mx-auto mb-2 h-8 w-8 opacity-50" />
      No expenses yet. Add one to get started!
    </div>

    <div v-for="group in groupedExpenses" v-else :key="group.monthYear" class="space-y-4">
      <h3
        class="border-b border-gray-100 px-1 pb-2 text-xs font-bold tracking-wider text-gray-400 uppercase"
      >
        {{ group.monthYear }}
      </h3>

      <div class="divide-y divide-gray-50 overflow-hidden rounded-xl border bg-white shadow-sm">
        <TransactionItem
          v-for="expense in group.items"
          :key="expense.id"
          :transaction="{ ...expense, type: 'expense' }"
          :current-user-id="currentUserId"
        >
          <template #header>
            <div class="flex w-full items-center justify-between">
              <div class="flex items-center gap-4">
                <!-- Date Box -->
                <div class="flex w-10 flex-col items-center justify-center text-center">
                  <span class="text-[10px] font-bold text-gray-400">{{
                    formatDate(expense.date).month
                  }}</span>
                  <span class="text-xl leading-none font-medium text-gray-600">{{
                    formatDate(expense.date).day
                  }}</span>
                </div>

                <!-- Icon -->
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent bg-gray-50 text-gray-400 transition-all group-hover:border-gray-100 group-hover:bg-white group-hover:shadow-sm"
                >
                  <component :is="getCategoryIcon(expense.category)" class="h-5 w-5" />
                </div>

                <div>
                  <h4 class="leading-tight font-medium text-gray-900">{{ expense.description }}</h4>
                  <p class="text-xs text-gray-500">
                    <span v-if="expense.paidBy.id === currentUserId">You</span>
                    <span v-else>{{ expense.paidBy.name }}</span>
                    paid
                    <span class="font-semibold text-gray-700">{{
                      formatCurrency(expense.amount)
                    }}</span>
                  </p>
                </div>
              </div>

              <div class="text-right">
                <template v-if="getExpenseContext(expense).amount">
                  <p
                    class="text-[10px] leading-tight font-bold tracking-tight text-gray-400 uppercase"
                  >
                    {{ getExpenseContext(expense).label }}
                  </p>
                  <p :class="['text-sm font-bold', getExpenseContext(expense).class]">
                    {{ getExpenseContext(expense).amount }}
                  </p>
                </template>
                <template v-else>
                  <p class="text-xs text-gray-300 italic">not involved</p>
                </template>
              </div>
            </div>
          </template>
        </TransactionItem>
      </div>
    </div>
  </div>
</template>
