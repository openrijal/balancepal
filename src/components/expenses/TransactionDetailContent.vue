<script setup lang="ts">
import { computed } from 'vue';
import {
  Receipt,
  Utensils,
  Car,
  Gamepad2,
  Lightbulb,
  ShoppingBag,
  Camera,
  Calendar,
  User,
  Pencil,
  MessageSquare,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

interface Expense {
  id: string;
  type: 'expense' | 'settlement';
  description: string;
  amount: number | string;
  date: string;
  category?: string;
  groupName?: string;
  paidBy?: {
    id: string;
    name: string;
  };
  fromUser?: { id: string; name: string };
  toUser?: { id: string; name: string };
  splits?: {
    userId: string;
    user: { id: string; name: string };
    amount: number | string;
  }[];
  notes?: string;
  receiptUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

const props = defineProps<{
  transaction: Expense;
  currentUserId: string;
}>();

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
};

const formatDateLong = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const getCategoryIcon = (category?: string) => {
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

const isExpense = computed(() => props.transaction.type === 'expense');

// Fake chart data for now, matching the reference image style
const chartData = [
  { month: 'November', amount: 0, height: 1 },
  { month: 'December', amount: 43.09, height: 100 },
  { month: 'January', amount: 0, height: 1 },
];
</script>

<template>
  <div class="animate-in fade-in slide-in-from-top-2 space-y-8 bg-gray-50/50 p-6 duration-300">
    <div class="flex flex-col gap-8 md:flex-row">
      <!-- Left Column: Basic Info & Receipt -->
      <div class="flex-1 space-y-6">
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <component :is="getCategoryIcon(transaction.category)" class="h-8 w-8 text-gray-400" />
          </div>

          <div class="space-y-1">
            <h3 class="text-xl leading-tight font-bold text-gray-900">
              {{ transaction.description }}
            </h3>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(transaction.amount) }}</p>
            <div class="space-y-0.5 text-xs text-gray-500">
              <p>
                Added by {{ transaction.paidBy?.name || 'Unknown' }} on
                {{ formatDateLong(transaction.date) }}
              </p>
              <p v-if="transaction.updatedAt">
                Last updated on {{ formatDateLong(transaction.updatedAt) }}
              </p>
            </div>

            <div class="pt-2">
              <Button
                variant="outline"
                size="sm"
                class="h-7 border-none bg-orange-500 px-3 text-[10px] font-bold tracking-wider text-white uppercase hover:bg-orange-600"
              >
                Edit expense
              </Button>
            </div>
          </div>
        </div>

        <!-- Receipt -->
        <div v-if="transaction.receiptUrl || true" class="space-y-2">
          <div
            class="flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 uppercase"
          >
            <Camera class="h-3 w-3" />
            Receipt
          </div>
          <div v-if="transaction.receiptUrl" class="group relative inline-block cursor-pointer">
            <img
              :src="transaction.receiptUrl"
              alt="Receipt"
              class="h-32 rounded-lg border shadow-sm transition-transform hover:scale-105"
            />
          </div>
          <div
            v-else
            class="flex h-32 w-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white/50"
          >
            <p class="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-400">
              <Camera class="h-4 w-4 opacity-50" />
              No receipt attached
            </p>
          </div>
        </div>
      </div>

      <!-- Right Column: Splits & Chart -->
      <div class="flex-1 space-y-8">
        <!-- Splits -->
        <div class="space-y-4">
          <div
            v-for="split in transaction.splits"
            :key="split.userId"
            class="flex items-center gap-3"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-100 text-xs font-bold text-gray-500 shadow-sm"
            >
              {{ split.user?.name?.charAt(0) || '?' }}
            </div>
            <p class="text-sm font-medium text-gray-700">
              <span class="font-bold text-gray-900">{{
                split.userId === currentUserId ? 'You' : split.user?.name || 'Unknown'
              }}</span>
              <template v-if="transaction.paidBy?.id === split.userId">
                paid {{ formatCurrency(transaction.amount) }} and owes
                {{ formatCurrency(split.amount) }}
              </template>
              <template v-else> owes {{ formatCurrency(split.amount) }} </template>
            </p>
          </div>
        </div>

        <!-- Category Chart -->
        <div v-if="isExpense" class="space-y-4">
          <div class="space-y-1">
            <p class="text-[11px] font-black tracking-widest text-gray-900 uppercase">
              Spending by category
            </p>
            <p class="text-xs text-gray-600">
              {{ transaction.groupName || 'BalancePal' }} :: {{ transaction.category || 'General' }}
            </p>
          </div>

          <div class="space-y-3">
            <div v-for="item in chartData" :key="item.month" class="flex items-center gap-4">
              <span class="w-16 text-[11px] font-medium text-gray-500">{{ item.month }}</span>
              <div class="flex h-3 flex-1 items-center overflow-hidden rounded-full bg-gray-100">
                <div
                  class="h-full rounded-full border-r border-yellow-300 bg-yellow-200 transition-all duration-500"
                  :style="{ width: `${item.height}%` }"
                ></div>
              </div>
              <span class="w-12 text-right text-[11px] font-bold text-gray-700">{{
                formatCurrency(item.amount)
              }}</span>
            </div>
          </div>
          <button class="text-[11px] font-bold text-sky-500 hover:underline">
            View more charts
          </button>
        </div>
      </div>
    </div>

    <!-- Notes & Comments -->
    <div class="space-y-4 border-t border-gray-100 pt-4">
      <div
        class="flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 uppercase"
      >
        <MessageSquare class="h-3 w-3" />
        Notes and comments
      </div>

      <div class="max-w-lg space-y-3">
        <textarea
          placeholder="Add a comment"
          class="min-h-[80px] w-full rounded-lg border border-gray-200 p-3 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        ></textarea>
        <Button class="h-8 bg-orange-500 px-4 text-xs font-bold text-white hover:bg-orange-600"
          >Post</Button
        >
      </div>
    </div>
  </div>
</template>
