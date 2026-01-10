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
    const res = await fetch(`/api/groups/${props.groupId}/member-balances`, {
      credentials: 'include',
    });
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
  <div
    class="sticky top-24 h-fit overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
  >
    <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-3">
      <h2 class="text-[10px] font-black tracking-widest text-gray-500 uppercase">Balances</h2>
      <button
        class="flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1 text-[10px] font-bold tracking-tight text-sky-600 uppercase transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm"
        @click="showInviteDialog = true"
      >
        <UserPlus class="h-3.5 w-3.5" />
        Invite members
      </button>
    </div>

    <!-- Loading state skipped for brevity in this replacement chunk, but I'll keep the full structure -->
    <div v-if="loading" class="bg-white p-8 text-center">
      <div class="animate-pulse text-sm text-gray-400">Loading members...</div>
    </div>

    <div v-else class="divide-y divide-gray-50 bg-white">
      <div
        v-for="mb in memberBalances"
        :key="mb.userId"
        class="flex items-center gap-3 p-4 transition-colors hover:bg-gray-50/30"
      >
        <!-- Avatar -->
        <div class="relative">
          <div
            class="bg-primary-50 text-primary-700 border-primary-100 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold shadow-sm"
          >
            {{ getInitials(mb.name) }}
          </div>
          <!-- Role Indicator for Admin -->
          <div
            v-if="mb.role === 'admin'"
            class="absolute -right-1 -bottom-1 rounded-full border border-gray-50 bg-white p-0.5 shadow-sm"
          >
            <div class="rounded-full bg-amber-100 p-0.5 text-amber-700">
              <svg class="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <p class="truncate text-sm font-semibold text-gray-900">
              <span v-if="mb.userId === currentUserId">You</span>
              <span v-else>{{ mb.name }}</span>
            </p>
            <span
              class="text-muted-foreground rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase"
            >
              {{ mb.role }}
            </span>
          </div>

          <p
            v-if="mb.balance !== 0"
            :class="[
              'mt-1 text-[11px] leading-none font-medium',
              mb.balance > 0 ? 'text-emerald-600' : 'text-orange-600',
            ]"
          >
            {{ mb.balance > 0 ? 'gets back' : 'owes' }} {{ formatCurrency(mb.balance) }}
          </p>
          <p v-else class="mt-1 text-[11px] leading-none text-gray-400">all settled up</p>
        </div>
      </div>
    </div>

    <!-- Invitation Dialog -->
    <InviteMemberDialog
      v-model:is-open="showInviteDialog"
      :group-id="groupId"
      :existing-member-ids="memberBalances.map((mb) => mb.userId)"
      hide-trigger
      @member-added="fetchMemberBalances"
    />
  </div>
</template>
