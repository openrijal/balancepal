<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-vue-next';
import InviteMemberDialog from './InviteMemberDialog.vue';
import { useGroupsStore } from '@/stores/groupsStore';

interface Props {
  groupId: string;
  groupName: string;
  description?: string | null;
  members: any[];
  currentUserId: string;
}

const props = defineProps<Props>();
const groupsStore = useGroupsStore();
const showInviteDialog = ref(false);

const totalExpenses = computed(() => {
  if (groupsStore.currentGroup?.id === props.groupId) {
    return groupsStore.currentGroup.totalExpenses || 0;
  }
  return 0;
});

const userBalance = computed(() => {
  if (groupsStore.currentGroup?.id === props.groupId) {
    return groupsStore.currentGroup.userBalance || 0;
  }
  return 0;
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const balanceClass = computed(() => {
  if (userBalance.value > 0) return 'text-green-600';
  if (userBalance.value < 0) return 'text-red-600';
  return 'text-muted-foreground';
});

const balancePrefix = computed(() => {
  if (userBalance.value > 0) return '+';
  return '';
});

onMounted(() => {
  groupsStore.fetchGroupStats(props.groupId);
});
</script>

<template>
  <div class="flex flex-col gap-4 border-b pb-6 mb-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900">{{ groupName }}</h1>
        <p v-if="description" class="text-muted-foreground mt-1 text-sm">{{ description }}</p>
      </div>
      <div class="flex gap-2 items-center">
      </div>
    </div>
    
    <InviteMemberDialog 
      :groupId="groupId" 
      v-model:isOpen="showInviteDialog" 
      hide-trigger
    />
    
    <!-- Stats Section -->
    <div class="flex gap-6">
      <div class="space-y-1">
        <p class="text-sm font-medium text-muted-foreground">Total Expenses</p>
        <p class="text-2xl font-semibold">{{ formatCurrency(totalExpenses) }}</p>
      </div>
      <div class="space-y-1">
        <p class="text-sm font-medium text-muted-foreground">Your Balance</p>
        <p :class="['text-2xl font-semibold', balanceClass]">
          {{ balancePrefix }}{{ formatCurrency(userBalance) }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Click outside to close could be added with @vueuse/core onClickOutside */
</style>
