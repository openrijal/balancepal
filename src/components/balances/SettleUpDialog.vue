<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-vue-next';

interface User {
    id: string;
    name: string;
}

const props = defineProps<{
  groupId: string;
  recipient: User | null;
  defaultAmount?: number;
}>();

const open = defineModel<boolean>('open');

const emit = defineEmits<{
  (e: 'settlement-recorded'): void;
}>();

const loading = ref(false);
const amount = ref('');
const error = ref<string | null>(null);

// Update amount when defaultAmount changes or dialog opens
watch(() => props.defaultAmount, (val) => {
    if (val) amount.value = val.toString();
}, { immediate: true });

async function handleSettle() {
  if (!props.recipient || !amount.value) return;

  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(`/api/groups/${props.groupId}/settlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toUserId: props.recipient.id,
        amount: parseFloat(amount.value),
        paymentMethod: 'cash' // Default for now
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to record settlement');
    }

    emit('settlement-recorded');
    open.value = false;
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
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Settle Up</DialogTitle>
        <DialogDescription>
            Record a payment to {{ recipient?.name }}.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div v-if="error" class="text-sm text-red-500">{{ error }}</div>

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
        <Button variant="secondary" @click="open = false">Cancel</Button>
        <Button @click="handleSettle" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            Pay {{ recipient?.name }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
