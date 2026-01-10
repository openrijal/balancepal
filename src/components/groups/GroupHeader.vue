<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Button } from '@/components/ui/button';
import { UserPlus, Settings } from 'lucide-vue-next';
import InviteMemberDialog from './InviteMemberDialog.vue';
import GroupSettingsDialog from './GroupSettingsDialog.vue';
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
const showSettingsDialog = ref(false);

// Local state for reactive updates (to avoid page refresh)
const displayName = ref(props.groupName);
const displayDescription = ref(props.description);
const localMembers = ref(props.members);

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

function handleGroupUpdated(data: { name: string; description: string | null }) {
  // Update local state from emitted data
  displayName.value = data.name;
  displayDescription.value = data.description;
}

function handleMemberRemoved(userId: string) {
  // Update local members list
  localMembers.value = localMembers.value.filter((m) => m.userId !== userId);
}

onMounted(() => {
  groupsStore.fetchGroupStats(props.groupId);
});
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 border-b pb-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900">{{ displayName }}</h1>
        <p v-if="displayDescription" class="text-muted-foreground mt-1 text-sm">
          {{ displayDescription }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" class="h-9 w-9" @click="showSettingsDialog = true">
          <Settings class="h-5 w-5" />
          <span class="sr-only">Group Settings</span>
        </Button>
      </div>
    </div>

    <InviteMemberDialog v-model:is-open="showInviteDialog" :group-id="groupId" hide-trigger />

    <GroupSettingsDialog
      v-model:is-open="showSettingsDialog"
      :group-id="groupId"
      :group-name="displayName"
      :description="displayDescription"
      :members="localMembers"
      :current-user-id="currentUserId"
      hide-trigger
      @group-updated="handleGroupUpdated"
      @member-removed="handleMemberRemoved"
    />

    <!-- Stats Section -->
    <div class="flex gap-6">
      <div class="space-y-1">
        <p class="text-muted-foreground text-sm font-medium">Total Expenses</p>
        <p class="text-2xl font-semibold">{{ formatCurrency(totalExpenses) }}</p>
      </div>
      <div class="space-y-1">
        <p class="text-muted-foreground text-sm font-medium">Your Balance</p>
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
