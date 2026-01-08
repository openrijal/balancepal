<script setup lang="ts">
import { ref } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import TransactionDetailContent from './TransactionDetailContent.vue';

interface Expense {
  id: string;
  type: 'expense' | 'settlement';
  description: string;
  amount: number | string;
  date: string;
  category?: string;
  groupName?: string;
  paidBy?: {
    id: string;
    name: string;
  };
  fromUser?: { id: string; name: string };
  toUser?: { id: string; name: string };
  splits?: {
    userId: string;
    user: { id: string; name: string };
    amount: number | string;
  }[];
  notes?: string;
  receiptUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

const props = defineProps<{
  transaction: Expense;
  currentUserId: string;
}>();

const isExpanded = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div class="overflow-hidden border-b border-gray-100 last:border-b-0 bg-white">
    <!-- Header/Trigger -->
    <div 
      @click="toggleExpand"
      class="group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-gray-50/50"
      :class="{ 'bg-gray-50/80': isExpanded }"
    >
      <slot name="header" :is-expanded="isExpanded" :toggle="toggleExpand">
        <!-- Default header if slot not provided -->
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <ChevronRight 
            class="h-4 w-4 text-gray-300 transition-transform duration-200"
            :class="{ 'rotate-90 text-gray-900': isExpanded }"
          />
          <div class="min-w-0">
            <h4 class="font-bold text-gray-900 leading-none mb-1">{{ transaction.description }}</h4>
            <p class="text-xs text-gray-500 truncate">{{ transaction.groupName }}</p>
          </div>
        </div>
      </slot>
    </div>

    <!-- Content -->
    <div 
      class="grid transition-all duration-300 ease-in-out"
      :class="isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden">
        <TransactionDetailContent 
          :transaction="transaction"
          :current-user-id="currentUserId"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Added focus styles for accessibility if needed */
</style>
