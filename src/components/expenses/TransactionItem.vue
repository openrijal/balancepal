<script setup lang="ts">
import { ref } from 'vue';
import { ChevronRight, Trash2, Loader2 } from 'lucide-vue-next';
import TransactionDetailContent from './TransactionDetailContent.vue';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'vue-sonner';

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
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const handleDelete = async () => {
  isDeleting.value = true;
  try {
    const res = await fetch(`/api/expenses/${props.transaction.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (res.ok) {
      toast.success('Transaction deleted');
      // Simple approach: refresh the page to update all balances and lists
      // In a more complex app, we'd use a store or event bus
      window.location.reload();
    } else {
      const error = await res.json();
      toast.error(error.error || 'Failed to delete transaction');
    }
  } catch (e) {
    console.error('Delete failed', e);
    toast.error('An unexpected error occurred');
  } finally {
    isDeleting.value = false;
    showDeleteConfirm.value = false;
  }
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

      <!-- Delete Action (Hover/Selected) -->
      <div 
        class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        @click.stop
      >
        <button 
          @click="showDeleteConfirm = true"
          class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete transaction"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteConfirm">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ transaction.description }}"? This will remove it from group balances and record the deletion in activity.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="mt-6 flex gap-2">
          <DialogClose as-child>
            <Button variant="outline" :disabled="isDeleting">Cancel</Button>
          </DialogClose>
          <Button 
            variant="destructive" 
            :disabled="isDeleting"
            @click="handleDelete"
          >
            <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
