<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Clock, ArrowRight, Receipt, CreditCard, Filter, Trash2 } from 'lucide-vue-next';
import GroupFilter from './GroupFilter.vue';

interface Group {
  id: string;
  name: string;
}

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
  currentUserId: string;
  // For the main activity page - show filter
  groups?: Group[];
  // For group-specific view (group detail page)
  groupId?: string;
  // Compact mode for sidebar panels
  compact?: boolean;
}>();

const activities = ref<ActivityItem[]>([]);
const loading = ref(true);
const selectedGroupIds = ref<string[]>([]);

const showFilter = computed(() => props.groups && props.groups.length > 0 && !props.groupId);

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
    // Build URL with optional filters
    let url = '/api/dashboard/activity';
    const params = new URLSearchParams();

    // Single group mode (group detail page)
    if (props.groupId) {
      params.set('groupIds', props.groupId);
    }
    // Multi-group filter mode (activity page)
    else if (selectedGroupIds.value.length > 0) {
      params.set('groupIds', selectedGroupIds.value.join(','));
    }

    if (params.toString()) {
      url += '?' + params.toString();
    }

    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) {
      activities.value = await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch activity', e);
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
    if (props.groupId) {
      return `${deleterName} deleted "${activity.description}"`;
    }
    return `${deleterName} deleted "${activity.description}" in "${activity.groupName}"`;
  }

  if (activity.type === 'expense') {
    if (props.groupId) {
      // Compact mode - don't show group name
      return `${userName} added "${activity.description}"`;
    }
    return `${userName} added "${activity.description}" in "${activity.groupName}"`;
  } else {
    const recipientName =
      activity.recipient?.id === props.currentUserId ? 'you' : activity.recipient?.name;
    if (props.groupId) {
      return `${userName} paid ${recipientName}`;
    }
    return `${userName} paid ${recipientName} in "${activity.groupName}"`;
  }
};

// Watch for filter changes
watch(selectedGroupIds, fetchActivity);

onMounted(fetchActivity);
</script>

<template>
  <div class="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm">
    <div class="flex items-center justify-between gap-4 border-b border-gray-50 p-4">
      <h2 class="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Activity Feed</h2>
      <GroupFilter v-if="showFilter && groups" v-model="selectedGroupIds" :groups="groups" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 p-8 text-center">
      <div class="animate-pulse text-sm text-gray-400">Loading activity...</div>
    </div>

    <!-- No activity -->
    <div
      v-else-if="activities.length === 0"
      class="flex flex-1 flex-col items-center justify-center p-8 text-center"
    >
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gray-100 bg-gray-50"
      >
        <Clock class="h-8 w-8 text-gray-300" />
      </div>
      <h3 class="mb-1 text-sm font-bold text-gray-900">No activity yet</h3>
      <p class="text-xs text-gray-500">Your group expenses and payments will appear here.</p>
    </div>

    <!-- Activity List -->
    <div v-else class="custom-scrollbar flex-1 divide-y divide-gray-50 overflow-y-auto">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start gap-3 p-4 transition-colors hover:bg-gray-50/50"
      >
        <!-- Icon -->
        <div
          :class="[
            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
            activity.isDeleted
              ? 'border-red-100 bg-red-50 text-red-600'
              : activity.type === 'expense'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                : 'border-orange-100 bg-orange-50 text-orange-600',
          ]"
        >
          <Trash2 v-if="activity.isDeleted" class="h-5 w-5" />
          <Receipt v-else-if="activity.type === 'expense'" class="h-5 w-5" />
          <CreditCard v-else class="h-5 w-5" />
        </div>

        <!-- Content -->
        <div class="min-w-0 flex-1">
          <p class="text-[13px] leading-snug text-gray-700">
            {{ getActivityDescription(activity) }}
          </p>
          <div class="mt-1 flex items-center justify-between">
            <span
              :class="[
                'text-[11px] font-bold tracking-tight uppercase',
                activity.isDeleted
                  ? 'text-red-600'
                  : activity.type === 'expense'
                    ? 'text-emerald-600'
                    : 'text-orange-600',
              ]"
            >
              {{
                activity.isDeleted ? 'Deleted' : activity.type === 'expense' ? 'Added' : 'Payment'
              }}
              · {{ formatCurrency(activity.amount) }}
            </span>
            <span class="text-[10px] font-medium text-gray-400">{{
              formatDate(activity.date)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="shrink-0 border-t border-gray-100 bg-gray-50/30 p-3 text-center">
      <a
        href="/activity"
        class="text-[10px] font-bold text-sky-600 uppercase transition-colors hover:text-sky-700"
        >See all activity »</a
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
