<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useGroupsStore } from '@/stores/groupsStore';

const groupsStore = useGroupsStore();

// Local state for dashboard-specific stats
const youOwe = ref(0);
const youreOwed = ref(0);
const totalBalance = computed(() => youreOwed.value - youOwe.value);
const activeGroups = computed(() => groupsStore.groups.length);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

async function fetchDashboardStats() {
  try {
    const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      youOwe.value = data.youOwe || 0;
      youreOwed.value = data.youreOwed || 0;
    }
  } catch (e) {
    console.error('Failed to fetch dashboard stats', e);
  }
}

async function fetchGroups() {
  try {
    const res = await fetch('/api/groups', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      groupsStore.setGroups(data);
    }
  } catch (e) {
    console.error('Failed to fetch groups', e);
  }
}

onMounted(() => {
  fetchDashboardStats();
  fetchGroups();
});
</script>

<template>
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p class="text-sm text-gray-500">You Owe</p>
      <p class="text-2xl font-bold text-red-500">{{ formatCurrency(youOwe) }}</p>
    </div>
    <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p class="text-sm text-gray-500">You're Owed</p>
      <p class="text-2xl font-bold text-green-500">{{ formatCurrency(youreOwed) }}</p>
    </div>
    <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p class="text-sm text-gray-500">Total Balance</p>
      <p :class="['text-2xl font-bold', totalBalance >= 0 ? 'text-gray-900' : 'text-red-500']">
        {{ formatCurrency(totalBalance) }}
      </p>
    </div>
    <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p class="text-sm text-gray-500">Active Groups</p>
      <p class="text-2xl font-bold text-emerald-600">{{ activeGroups }}</p>
    </div>
  </div>
</template>
