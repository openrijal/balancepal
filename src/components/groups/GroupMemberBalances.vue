<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useGroupsStore } from '@/stores/groupsStore';

interface MemberBalance {
  userId: string;
  name: string;
  balance: number;
}

const props = defineProps<{
  groupId: string;
  currentUserId: string;
}>();

const groupsStore = useGroupsStore();
const memberBalances = ref<MemberBalance[]>([]);
const loading = ref(true);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));
};

async function fetchMemberBalances() {
  try {
    const res = await fetch(`/api/groups/${props.groupId}/member-balances`, { credentials: 'include' });
    if (res.ok) {
      memberBalances.value = await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch member balances', e);
  } finally {
    loading.value = false;
  }
}

// Watch for group updates to refresh balances
watch(() => groupsStore.currentGroup?.totalExpenses, fetchMemberBalances);

onMounted(fetchMemberBalances);
</script>

<template>
  <div class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
    <div class="bg-gray-50/50 border-b border-gray-100 p-4">
      <h2 class="text-xs font-bold uppercase tracking-wider text-gray-500">Group Balances</h2>
    </div>

    <div v-if="loading" class="p-8 text-center bg-white">
      <div class="animate-pulse text-gray-400 text-sm">Loading balances...</div>
    </div>

    <div v-else class="divide-y divide-gray-50 bg-white">
      <div 
        v-for="mb in memberBalances" 
        :key="mb.userId"
        class="flex items-center gap-3 p-4"
      >
        <div class="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 border border-white shadow-sm">
          {{ mb.name.charAt(0) }}
        </div>
        
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-gray-900 truncate">
            <span v-if="mb.userId === currentUserId">You</span>
            <span v-else>{{ mb.name }}</span>
          </p>
          <p 
            v-if="mb.balance !== 0"
            :class="['text-[10px] font-medium leading-none mt-0.5', mb.balance > 0 ? 'text-emerald-600' : 'text-orange-600']"
          >
            {{ mb.balance > 0 ? 'gets back' : 'owes' }} {{ formatCurrency(mb.balance) }}
          </p>
          <p v-else class="text-[10px] text-gray-400 leading-none mt-0.5">
            all settled up
          </p>
        </div>
      </div>
    </div>
    
    <div class="p-3 bg-gray-50/30 text-center border-t border-gray-100">
      <a href="#" class="text-[10px] uppercase font-bold text-sky-600 hover:text-sky-700 transition-colors">View details »</a>
    </div>
  </div>
</template>
