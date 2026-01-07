<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Receipt, RefreshCw, ChevronDown } from 'lucide-vue-next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SharedExpense } from '@/types';

interface Props {
  friendId: string;
  friendName: string;
  currentUserId: string;
}

const props = defineProps<Props>();

const expenses = ref<SharedExpense[]>([]);
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
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="fetchExpenses(false)" :disabled="loading">
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
      <div v-else-if="error" class="text-center py-8">
        <p class="text-sm text-red-500">{{ error }}</p>
        <Button variant="outline" size="sm" class="mt-2" @click="fetchExpenses(false)">Retry</Button>
      </div>

      <!-- Empty State -->
      <div v-else-if="expenses.length === 0" class="text-center py-8">
        <Receipt class="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p class="text-gray-500">No shared expenses with {{ friendName }}</p>
      </div>

      <!-- Expenses List -->
      <div v-else class="space-y-3">
        <div
          v-for="expense in expenses"
          :key="expense.id"
          class="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ categoryIcons[expense.category] || '📦' }}</span>
                <p class="font-medium text-gray-900 truncate">{{ expense.description }}</p>
              </div>
              <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <a :href="`/groups/${expense.groupId}`" class="hover:text-primary-600">
                  {{ expense.groupName }}
                </a>
                <span>•</span>
                <span>{{ formatDate(expense.date) }}</span>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold text-gray-900">{{ formatCurrency(expense.amount) }}</p>
              <p class="text-xs text-gray-500">
                {{ expense.paidByUserId === currentUserId ? 'You' : expense.paidByName }} paid
              </p>
            </div>
          </div>

          <!-- Split details -->
          <div
            v-if="expense.userSplit || expense.friendSplit"
            class="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500"
          >
            <span v-if="expense.userSplit">Your share: {{ formatCurrency(expense.userSplit) }}</span>
            <span v-if="expense.friendSplit">{{ friendName }}'s share: {{ formatCurrency(expense.friendSplit) }}</span>
          </div>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMore" class="text-center pt-2">
          <Button variant="ghost" @click="loadMore" :disabled="loadingMore" class="w-full">
            <RefreshCw v-if="loadingMore" class="h-4 w-4 mr-2 animate-spin" />
            <ChevronDown v-else class="h-4 w-4 mr-2" />
            {{ loadingMore ? 'Loading...' : 'Load more' }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
