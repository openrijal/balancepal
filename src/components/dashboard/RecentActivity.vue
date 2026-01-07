<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Clock, ArrowRight, Receipt, CreditCard } from 'lucide-vue-next';

interface ActivityItem {
  id: string;
  type: 'expense' | 'settlement';
  description: string;
  amount: number;
  date: string;
  groupName: string;
  user: {
    name: string;
  };
  recipient?: {
    name: string;
  };
}

const activities = ref<ActivityItem[]>([]);
const loading = ref(true);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

async function fetchActivity() {
  try {
    const res = await fetch('/api/dashboard/activity', { credentials: 'include' });
    if (res.ok) {
      activities.value = await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch activity', e);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchActivity);
</script>

<template>
  <div class="rounded-xl border border-gray-100 bg-white shadow-sm h-full">
    <div class="border-b border-gray-100 p-4">
      <h2 class="font-semibold text-gray-900">Recent Activity</h2>
    </div>
    
    <!-- Loading -->
    <div v-if="loading" class="p-8 text-center">
      <div class="animate-pulse text-gray-400">Loading...</div>
    </div>
    
    <!-- No activity -->
    <div v-else-if="activities.length === 0" class="p-8 text-center">
      <div class="bg-sky-100 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <Clock class="text-sky-600 h-8 w-8" />
      </div>
      <h3 class="mb-1 font-medium text-gray-900">No activity yet</h3>
      <p class="text-sm text-gray-500">
        Your recent expenses and settlements will appear here.
      </p>
    </div>
    
    <!-- Activity List -->
    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
      >
        <!-- Icon -->
        <div
          :class="[
            'flex h-10 w-10 items-center justify-center rounded-full',
            activity.type === 'expense' ? 'bg-emerald-100' : 'bg-sky-100'
          ]"
        >
          <Receipt v-if="activity.type === 'expense'" class="h-5 w-5 text-emerald-600" />
          <CreditCard v-else class="h-5 w-5 text-sky-600" />
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ activity.description }}
          </p>
          <p class="text-xs text-gray-500 truncate">
            <span v-if="activity.type === 'expense'">
              {{ activity.user.name }} paid
            </span>
            <span v-else>
              {{ activity.user.name }} <ArrowRight class="inline h-3 w-3" /> {{ activity.recipient?.name }}
            </span>
            · {{ activity.groupName }}
          </p>
        </div>
        
        <!-- Amount & Time -->
        <div class="text-right">
          <p :class="[
            'text-sm font-semibold',
            activity.type === 'expense' ? 'text-emerald-600' : 'text-sky-600'
          ]">
            {{ formatCurrency(activity.amount) }}
          </p>
          <p class="text-xs text-gray-400">{{ formatDate(activity.date) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
