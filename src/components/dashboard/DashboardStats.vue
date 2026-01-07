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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-0 border rounded-xl overflow-hidden bg-white shadow-sm">
      <!-- YOU OWE Column -->
      <div class="border-r border-gray-100 divide-y divide-gray-50">
        <div class="p-4 bg-gray-50 hidden md:block">
          <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wide">You Owe</h3>
        </div>
        <div v-if="youOweDetails.length === 0" class="p-8 text-center text-gray-400 italic text-sm">
          You do not owe anything
        </div>
        <div 
          v-for="detail in youOweDetails" 
          :key="detail.userId"
          class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <User class="h-6 w-6" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ detail.name }}</p>
              <p class="text-xs text-orange-600 font-medium">you owe <span class="font-bold">{{ formatCurrency(detail.amount) }}</span></p>
            </div>
          </div>
          <ArrowRight class="h-4 w-4 text-gray-300" />
        </div>
      </div>

      <!-- YOU ARE OWED Column -->
      <div class="divide-y divide-gray-50">
        <div class="p-4 bg-gray-50 hidden md:block">
          <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wide">You Are Owed</h3>
        </div>
        <div v-if="youreOwedDetails.length === 0" class="p-8 text-center text-gray-400 italic text-sm">
          You are not owed anything
        </div>
        <div 
          v-for="detail in youreOwedDetails" 
          :key="detail.userId"
          class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <User class="h-6 w-6" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ detail.name }}</p>
              <p class="text-xs text-emerald-600 font-medium">owes you <span class="font-bold">{{ formatCurrency(detail.amount) }}</span></p>
            </div>
          </div>
          <ArrowRight class="h-4 w-4 text-gray-300" />
        </div>
      </div>
    </div>
  </div>
</template>
