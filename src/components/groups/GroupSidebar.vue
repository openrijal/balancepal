<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useGroupsStore } from '@/stores/groupsStore';
import { UserPlus, MoreHorizontal } from 'lucide-vue-next';
import InviteMemberDialog from './InviteMemberDialog.vue';

interface MemberBalance {
  userId: string;
  name: string;
  balance: number;
  role: string;
}

const props = defineProps<{
  groupId: string;
  currentUserId: string;
}>();

const groupsStore = useGroupsStore();
const memberBalances = ref<MemberBalance[]>([]);
const loading = ref(true);
const showInviteDialog = ref(false);

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

const getInitials = (name: string) => {
  return name.charAt(0).toUpperCase();
};

// Watch for group updates to refresh balances
watch(() => groupsStore.currentGroup?.totalExpenses, fetchMemberBalances);

onMounted(fetchMemberBalances);
</script>

<template>
  <div class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden h-fit sticky top-24">
    <div class="bg-gray-50/50 border-b border-gray-100 p-3 flex items-center justify-between">
      <h2 class="text-[10px] font-black uppercase tracking-widest text-gray-500">Balances</h2>
      <button 
        @click="showInviteDialog = true"
        class="flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[10px] font-bold text-sky-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all uppercase tracking-tight"
      >
        <UserPlus class="w-3.5 h-3.5" />
        Invite members
      </button>
    </div>

    <!-- Loading state skipped for brevity in this replacement chunk, but I'll keep the full structure -->
    <div v-if="loading" class="p-8 text-center bg-white">
      <div class="animate-pulse text-gray-400 text-sm">Loading members...</div>
    </div>

    <div v-else class="divide-y divide-gray-50 bg-white">
      <div 
        v-for="mb in memberBalances" 
        :key="mb.userId"
        class="flex items-center gap-3 p-4 hover:bg-gray-50/30 transition-colors"
      >
        <!-- Avatar -->
        <div class="relative">
          <div class="bg-primary-50 text-primary-700 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border border-primary-100 shadow-sm">
            {{ getInitials(mb.name) }}
          </div>
          <!-- Role Indicator for Admin -->
          <div v-if="mb.role === 'admin'" class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-50">
            <div class="bg-amber-100 text-amber-700 p-0.5 rounded-full">
              <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-gray-900 truncate">
              <span v-if="mb.userId === currentUserId">You</span>
              <span v-else>{{ mb.name }}</span>
            </p>
            <span class="text-[10px] text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded uppercase font-medium">
              {{ mb.role }}
            </span>
          </div>
          
          <p 
            v-if="mb.balance !== 0"
            :class="['text-[11px] font-medium leading-none mt-1', mb.balance > 0 ? 'text-emerald-600' : 'text-orange-600']"
          >
            {{ mb.balance > 0 ? 'gets back' : 'owes' }} {{ formatCurrency(mb.balance) }}
          </p>
          <p v-else class="text-[11px] text-gray-400 leading-none mt-1">
            all settled up
          </p>
        </div>
      </div>
    </div>

    <!-- Invitation Dialog -->
    <InviteMemberDialog 
      :groupId="groupId" 
      v-model:isOpen="showInviteDialog" 
      :existingMemberIds="memberBalances.map(mb => mb.userId)"
      @member-added="fetchMemberBalances"
      hide-trigger
    />
  </div>
</template>
