<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Receipt, RefreshCw } from 'lucide-vue-next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TransactionItem from '../expenses/TransactionItem.vue';

interface Props {
  friendId: string;
  friendName: string;
  currentUserId: string;
}

const props = defineProps<Props>();

const expenses = ref<any[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const hasMore = ref(true);
const limit = 10;

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
};

const categoryIcons: Record<string, string> = {
  food: '🍔',
  transport: '🚗',
  entertainment: '🎬',
  utilities: '💡',
  shopping: '🛍️',
  other: '📦',
};

const fetchExpenses = async (append = false) => {
  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }
  error.value = null;

  try {
    const offset = append ? expenses.value.length : 0;
    const res = await fetch(
      `/api/friends/${props.friendId}/expenses?limit=${limit}&offset=${offset}`,
      { credentials: 'include' }
    );
    if (!res.ok) throw new Error('Failed to fetch expenses');
    const data = await res.json();

    if (append) {
      expenses.value = [...expenses.value, ...data.expenses];
    } else {
      expenses.value = data.expenses;
    }

    hasMore.value = data.expenses.length === limit;
  } catch (e) {
    error.value = 'Failed to load expenses';
    console.error(e);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const loadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    fetchExpenses(true);
  }
};

onMounted(() => {
  fetchExpenses();
});
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <Receipt class="h-5 w-5 text-gray-500" />
          Shared Expenses
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :disabled="loading"
          @click="fetchExpenses(false)"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Loading State -->
      <div v-if="loading && expenses.length === 0" class="flex items-center justify-center py-8">
        <RefreshCw class="h-6 w-6 animate-spin text-gray-400" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="py-8 text-center">
        <p class="text-sm text-red-500">{{ error }}</p>
        <Button variant="outline" size="sm" class="mt-2" @click="fetchExpenses(false)"
          >Retry</Button
        >
      </div>

      <!-- Empty State -->
      <div v-else-if="expenses.length === 0" class="py-8 text-center">
        <Receipt class="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p class="text-gray-500">No shared expenses with {{ friendName }}</p>
      </div>

      <!-- Expenses List -->
      <div v-else class="space-y-4">
        <div
          class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 shadow-sm"
        >
          <TransactionItem
            v-for="expense in expenses"
            :key="expense.id"
            :transaction="{ ...expense, type: 'expense' }"
            :current-user-id="currentUserId"
          >
            <template #header>
              <div class="flex w-full items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ categoryIcons[expense.category] || '📦' }}</span>
                    <p class="truncate font-bold text-gray-900">{{ expense.description }}</p>
                  </div>
                  <div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span class="font-bold text-sky-600">
                      {{ expense.groupName }}
                    </span>
                    <span>•</span>
                    <span>{{ formatDate(expense.date) }}</span>
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-sm font-bold text-gray-900">
                    {{ formatCurrency(expense.amount) }}
                  </p>
                  <p class="mt-0.5 text-[10px] leading-none font-black text-gray-400 uppercase">
                    {{
                      expense.paidByUserId === currentUserId
                        ? 'You'
                        : expense.paidByName.split(' ')[0]
                    }}
                    paid
                  </p>
                </div>
              </div>
            </template>
          </TransactionItem>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMore" class="pt-2 text-center">
          <Button variant="ghost" :disabled="loadingMore" class="w-full" @click="loadMore">
            <RefreshCw v-if="loadingMore" class="mr-2 h-4 w-4 animate-spin" />
            <ChevronDown v-else class="mr-2 h-4 w-4" />
            {{ loadingMore ? 'Loading...' : 'Load more' }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
