<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useGroupsStore } from '@/stores/groupsStore';
import { User, ArrowRight } from 'lucide-vue-next';

const groupsStore = useGroupsStore();

interface DebtDetail {
  userId: string;
  name: string;
  amount: number;
}

const props = defineProps<{
  currentUserId: string;
}>();

// Local state for dashboard-specific stats
const youOwe = ref(0);
const youreOwed = ref(0);
const youOweDetails = ref<DebtDetail[]>([]);
const youreOwedDetails = ref<DebtDetail[]>([]);

const totalBalance = computed(() => youreOwed.value - youOwe.value);
const activeGroups = computed(() => groupsStore.groups.length);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatAbsCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));
};

async function fetchDashboardStats() {
  try {
    const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      youOwe.value = data.youOwe || 0;
      youreOwed.value = data.youreOwed || 0;
      youOweDetails.value = data.youOweDetails || [];
      youreOwedDetails.value = data.youreOwedDetails || [];
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
  <div class="space-y-6">
    <!-- Debt Breakdown -->
    <div
      class="grid grid-cols-1 gap-0 overflow-hidden rounded-xl border bg-white shadow-sm md:grid-cols-2"
    >
      <!-- YOU OWE Column -->
      <div class="divide-y divide-gray-50 border-r border-gray-100">
        <div class="hidden bg-gray-50 p-4 md:block">
          <h3 class="text-sm font-bold tracking-wide text-gray-500 uppercase">You Owe</h3>
        </div>
        <div v-if="youOweDetails.length === 0" class="p-8 text-center text-sm text-gray-400 italic">
          You do not owe anything
        </div>
        <div
          v-for="detail in youOweDetails"
          :key="detail.userId"
          class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400"
            >
              <User class="h-6 w-6" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ detail.name }}</p>
              <p class="text-xs font-medium text-orange-600">
                you owe <span class="font-bold">{{ formatCurrency(detail.amount) }}</span>
              </p>
            </div>
          </div>
          <ArrowRight class="h-4 w-4 text-gray-300" />
        </div>
      </div>

      <!-- YOU ARE OWED Column -->
      <div class="divide-y divide-gray-50">
        <div class="hidden bg-gray-50 p-4 md:block">
          <h3 class="text-sm font-bold tracking-wide text-gray-500 uppercase">You Are Owed</h3>
        </div>
        <div
          v-if="youreOwedDetails.length === 0"
          class="p-8 text-center text-sm text-gray-400 italic"
        >
          You are not owed anything
        </div>
        <div
          v-for="detail in youreOwedDetails"
          :key="detail.userId"
          class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400"
            >
              <User class="h-6 w-6" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ detail.name }}</p>
              <p class="text-xs font-medium text-emerald-600">
                owes you <span class="font-bold">{{ formatCurrency(detail.amount) }}</span>
              </p>
            </div>
          </div>
          <ArrowRight class="h-4 w-4 text-gray-300" />
        </div>
      </div>
    </div>
  </div>
</template>
