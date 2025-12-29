<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Settings, UserPlus } from 'lucide-vue-next';
import InviteMemberDialog from './InviteMemberDialog.vue';

interface Props {
  groupId: string;
  groupName: string;
  description?: string | null;
  totalExpenses?: number; // Placeholder
}

const props = defineProps<Props>();
const showInviteDialog = ref(false);

const emit = defineEmits<{
  (e: 'settings'): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-4 border-b pb-6 mb-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ groupName }}</h1>
        <p v-if="description" class="text-muted-foreground mt-1">{{ description }}</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="showInviteDialog = true">
          <UserPlus class="w-4 h-4 mr-2" />
          Invite
        </Button>
        <Button variant="ghost" size="icon" @click="emit('settings')">
          <Settings class="w-4 h-4" />
        </Button>
      </div>
    </div>
    
    <InviteMemberDialog 
      :groupId="groupId" 
      v-model:isOpen="showInviteDialog" 
    />
    
    <!-- Stats Placeholder -->
    <div class="flex gap-6">
      <div class="space-y-1">
        <p class="text-sm font-medium text-muted-foreground">Total Expenses</p>
        <p class="text-2xl font-semibold">$0.00</p>
      </div>
      <div class="space-y-1">
         <p class="text-sm font-medium text-muted-foreground">Your Balance</p>
        <p class="text-2xl font-semibold text-green-600">+$0.00</p>
      </div>
    </div>
  </div>
</template>
