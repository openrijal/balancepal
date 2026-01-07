<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-vue-next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FriendBalance, FriendBalanceBreakdown } from '@/types';

interface Props {
  friendId: string;
  friendName: string;
  initialBalance?: FriendBalance;
}

const props = defineProps<Props>();

const balance = ref<FriendBalance | null>(props.initialBalance || null);
const loading = ref(!props.initialBalance);
const error = ref<string | null>(null);

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));
};

const balanceStatus = computed(() => {
  if (!balance.value) return 'neutral';
  if (balance.value.netBalance > 0.01) return 'positive';
  if (balance.value.netBalance < -0.01) return 'negative';
  return 'neutral';
});

const balanceText = computed(() => {
  if (!balance.value) return 'Loading...';
  if (balanceStatus.value === 'positive') {
    return `${props.friendName} owes you`;
  }
  if (balanceStatus.value === 'negative') {
    return `You owe ${props.friendName}`;
  }
  return 'All settled up';
});

const fetchBalance = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`/api/friends/${props.friendId}/balance`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch balance');
    balance.value = await res.json();
  } catch (e) {
    error.value = 'Failed to load balance';
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!props.initialBalance) {
    fetchBalance();
  }
});
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium text-gray-500">Balance</CardTitle>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="fetchBalance" :disabled="loading">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Loading State -->
      <div v-if="loading && !balance" class="flex items-center justify-center py-4">
        <RefreshCw class="h-6 w-6 animate-spin text-gray-400" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-4">
        <p class="text-sm text-red-500">{{ error }}</p>
        <Button variant="outline" size="sm" class="mt-2" @click="fetchBalance">Retry</Button>
      </div>

      <!-- Content -->
      <div v-else-if="balance" class="space-y-4">
        <!-- Main Balance -->
        <div class="text-center">
          <div
            class="text-3xl font-bold"
            :class="{
              'text-green-600': balanceStatus === 'positive',
              'text-red-600': balanceStatus === 'negative',
              'text-gray-600': balanceStatus === 'neutral',
            }"
          >
            <template v-if="balanceStatus !== 'neutral'">
              {{ formatCurrency(balance.netBalance) }}
            </template>
            <template v-else>$0.00</template>
          </div>
          <p class="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
            <TrendingUp v-if="balanceStatus === 'positive'" class="h-4 w-4 text-green-500" />
            <TrendingDown v-else-if="balanceStatus === 'negative'" class="h-4 w-4 text-red-500" />
            <Minus v-else class="h-4 w-4 text-gray-400" />
            {{ balanceText }}
          </p>
        </div>

        <!-- Breakdown by Group -->
        <div v-if="balance.breakdown.length > 0" class="border-t pt-3">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">By Group</p>
          <div class="space-y-2">
            <div
              v-for="item in balance.breakdown"
              :key="item.groupId"
              class="flex items-center justify-between text-sm"
            >
              <a
                :href="`/groups/${item.groupId}`"
                class="text-gray-600 hover:text-primary-600 truncate max-w-[150px]"
              >
                {{ item.groupName }}
              </a>
              <span
                :class="{
                  'text-green-600': item.amount > 0,
                  'text-red-600': item.amount < 0,
                  'text-gray-500': item.amount === 0,
                }"
              >
                {{ item.amount >= 0 ? '+' : '' }}{{ formatCurrency(item.amount) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
