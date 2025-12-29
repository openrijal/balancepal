<script setup lang="ts">
import { ref } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-vue-next';

const props = defineProps<{
  groupId: string;
}>();

const emit = defineEmits<{
  (e: 'expense-created'): void;
}>();

const open = ref(false);
const loading = ref(false);
const description = ref('');
const amount = ref('');
const error = ref<string | null>(null);

async function handleSubmit() {
  if (!description.value || !amount.value) return;

  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(`/api/groups/${props.groupId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description.value,
        amount: parseFloat(amount.value),
        // currency: 'USD', // Default
        // splits: [] // Default to equal split
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create expense');
    }

    // Success
    emit('expense-created');
    open.value = false;
    
    // Reset form
    description.value = '';
    amount.value = '';
  } catch (e: any) {
    console.error(e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button class="gap-2">
        <Plus class="h-4 w-4" />
        Add Expense
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogDescription>
          Add an expense to split equally with the group.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Error -->
        <div v-if="error" class="text-sm text-red-500 font-medium">
            {{ error }}
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <label for="description" class="text-right text-sm font-medium">
            Description
          </label>
          <Input
            id="description"
            v-model="description"
            placeholder="e.g. Dinner"
            class="col-span-3"
            required
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <label for="amount" class="text-right text-sm font-medium">
            Amount
          </label>
          <div class="relative col-span-3">
             <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
             <Input
                id="amount"
                v-model="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="pl-7"
                required
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" @click="handleSubmit" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? 'Saving...' : 'Save Expense' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
