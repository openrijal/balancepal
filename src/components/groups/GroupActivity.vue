<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Clock, Receipt, CreditCard, Trash2 } from 'lucide-vue-next';

interface ActivityItem {
  id: string;
  type: 'expense' | 'settlement';
  description: string;
  amount: number;
  date: string;
  groupId: string;
  groupName: string;
  user: {
    id: string;
    name: string;
  };
  recipient?: {
    id: string;
    name: string;
  };
  isDeleted?: boolean;
  deletedBy?: {
    id: string;
    name: string;
  };
}

const props = defineProps<{
  groupId: string;
  currentUserId: string;
}>();

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
  loading.value = true;
  try {
    const res = await fetch(`/api/dashboard/activity?groupIds=${props.groupId}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      // Limit to 8 items for the sidebar
      activities.value = data.slice(0, 8);
    }
  } catch (e) {
    console.error('Failed to fetch group activity', e);
  } finally {
    loading.value = false;
  }
}

const getActivityDescription = (activity: ActivityItem) => {
  const userName = activity.user.id === props.currentUserId ? 'You' : activity.user.name;

  if (activity.isDeleted) {
    const deleterName =
      activity.deletedBy?.id === props.currentUserId
        ? 'You'
        : activity.deletedBy?.name || 'Someone';
    return `${deleterName} deleted "${activity.description}"`;
  }

  if (activity.type === 'expense') {
    return `${userName} added "${activity.description}"`;
  } else {
    const recipientName =
      activity.recipient?.id === props.currentUserId ? 'you' : activity.recipient?.name;
    return `${userName} paid ${recipientName}`;
  }
};

onMounted(fetchActivity);
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
    <div class="border-b border-gray-100 bg-gray-50/50 p-3">
      <h2 class="text-[10px] font-black tracking-widest text-gray-500 uppercase">
        Recent Activity
      </h2>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-6 text-center">
      <div class="animate-pulse text-sm text-gray-400">Loading activity...</div>
    </div>

    <!-- No activity -->
    <div v-else-if="activities.length === 0" class="p-6 text-center">
      <div
        class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-gray-50"
      >
        <Clock class="h-6 w-6 text-gray-300" />
      </div>
      <h3 class="mb-1 text-sm font-bold text-gray-900">No activity yet</h3>
      <p class="text-xs text-gray-500">Add expenses to see activity here.</p>
    </div>

    <!-- Activity List -->
    <div v-else class="custom-scrollbar max-h-80 divide-y divide-gray-50 overflow-y-auto">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start gap-2.5 p-3 transition-colors hover:bg-gray-50/50"
      >
        <!-- Icon -->
        <div
          :class="[
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
            activity.isDeleted
              ? 'border-red-100 bg-red-50 text-red-600'
              : activity.type === 'expense'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                : 'border-orange-100 bg-orange-50 text-orange-600',
          ]"
        >
          <Trash2 v-if="activity.isDeleted" class="h-4 w-4" />
          <Receipt v-else-if="activity.type === 'expense'" class="h-4 w-4" />
          <CreditCard v-else class="h-4 w-4" />
        </div>

        <!-- Content -->
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-[12px] leading-snug text-gray-700">
            {{ getActivityDescription(activity) }}
          </p>
          <div class="mt-0.5 flex items-center justify-between">
            <span
              :class="[
                'text-[10px] font-bold tracking-tight uppercase',
                activity.isDeleted
                  ? 'text-red-600'
                  : activity.type === 'expense'
                    ? 'text-emerald-600'
                    : 'text-orange-600',
              ]"
            >
              {{ activity.isDeleted ? 'Deleted' : formatCurrency(activity.amount) }}
            </span>
            <span class="text-[9px] font-medium text-gray-400">{{
              formatDate(activity.date)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-100 bg-gray-50/30 p-2.5 text-center">
      <a
        href="/activity"
        class="text-[10px] font-bold text-sky-600 uppercase transition-colors hover:text-sky-700"
        >View all activity »</a
      >
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
