<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Settings, UserPlus, Users, LogOut, Trash2 } from 'lucide-vue-next';
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
const showSettings = ref(false);

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

function handleExpensesChanged(event: Event) {
  const customEvent = event as CustomEvent;
  if (customEvent.detail?.groupId === props.groupId) {
    groupsStore.fetchGroupStats(props.groupId);
  }
}

onMounted(() => {
  groupsStore.fetchGroupStats(props.groupId);
  window.addEventListener('balancepal:expenses-changed', handleExpensesChanged);
});

onUnmounted(() => {
  window.removeEventListener('balancepal:expenses-changed', handleExpensesChanged);
});
</script>

<template>
  <div class="flex flex-col gap-4 border-b pb-6 mb-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ groupName }}</h1>
        <p v-if="description" class="text-muted-foreground mt-1">{{ description }}</p>
      </div>
      <div class="flex gap-2 items-center relative">
        <Button variant="outline" size="sm" @click="showInviteDialog = true" class="hidden sm:flex">
          <UserPlus class="w-4 h-4 mr-2" />
          Invite
        </Button>
        
        <div class="relative">
          <Button variant="ghost" size="icon" @click="showSettings = !showSettings">
            <Settings class="w-4 h-4" />
          </Button>

          <!-- Simple Settings Dropdown -->
          <div v-if="showSettings" class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div class="py-1" role="menu">
              <div class="px-4 py-2 border-b">
                <p class="text-sm font-medium">Group Members</p>
              </div>
              <div class="max-h-60 overflow-y-auto">
                <div v-for="member in members" :key="member.id" class="px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                   <div class="bg-secondary relative flex h-6 w-6 shrink-0 overflow-hidden rounded-full items-center justify-center text-[10px] font-bold uppercase">
                      {{ member.user.name?.charAt(0) || 'U' }}
                   </div>
                   <div class="flex-1 overflow-hidden">
                      <p class="truncate text-sm leading-none font-medium">{{ member.user.name }}</p>
                      <p class="text-muted-foreground truncate text-[10px]">
                        {{ member.role === 'admin' ? 'Admin' : 'Member' }}
                      </p>
                   </div>
                </div>
              </div>
              <div class="border-t">
                <button @click="showInviteDialog = true; showSettings = false" class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <UserPlus class="w-4 h-4 mr-2" />
                  Invite Member
                </button>
              </div>
            </div>
          </div>
        </div>
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
