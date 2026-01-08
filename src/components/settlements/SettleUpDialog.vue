<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datepicker';
import { ArrowRight, Loader2, Handshake, ChevronDown } from 'lucide-vue-next';

interface Member {
  id: string;
  name: string;
  profilePictureUrl?: string | null;
}

interface MemberBalance {
  userId: string;
  name: string;
  balance: number;
  role: string;
}

const props = defineProps<{
  groupId: string;
  members: Member[];
  currentUserId: string;
}>();

const emit = defineEmits<{
  (e: 'settlement-created'): void;
}>();

const open = ref(false);
const loading = ref(false);
const loadingBalances = ref(false);
const error = ref<string | null>(null);

// Balance data
const memberBalances = ref<MemberBalance[]>([]);

// Form state
const payerId = ref(props.currentUserId);
const receiverId = ref<string>('');
const amount = ref('');
const selectedDate = ref(new Date().toISOString().split('T')[0]); // Today in YYYY-MM-DD format

// Dropdown visibility
const showPayerDropdown = ref(false);
const showReceiverDropdown = ref(false);

const payer = computed(() => props.members.find(m => m.id === payerId.value));
const receiver = computed(() => props.members.find(m => m.id === receiverId.value));

// Members excluding current payer
const otherMembers = computed(() => props.members.filter(m => m.id !== payerId.value));
const payableMembers = computed(() => props.members);

// Get balance for current user
const currentUserBalance = computed(() => 
  memberBalances.value.find(mb => mb.userId === props.currentUserId)?.balance || 0
);

// Dynamic width for amount input based on character length
const inputWidth = computed(() => {
  const len = amount.value.length || 4; // Default to 4 for placeholder "0.00"
  // Each character is roughly 30px at text-5xl, minimum 80px
  return Math.max(80, len * 32) + 'px';
});

const getInitials = (name: string) => name.charAt(0).toUpperCase();

const selectPayer = (id: string) => {
  payerId.value = id;
  showPayerDropdown.value = false;
  if (receiverId.value === id) receiverId.value = '';
  updateAmountFromBalances();
};

const selectReceiver = (id: string) => {
  receiverId.value = id;
  showReceiverDropdown.value = false;
  updateAmountFromBalances();
};

// Calculate suggested amount based on who is paying whom
const updateAmountFromBalances = () => {
  const payerBal = memberBalances.value.find(mb => mb.userId === payerId.value);
  const receiverBal = memberBalances.value.find(mb => mb.userId === receiverId.value);
  
  if (!payerBal || !receiverBal) return;
  
  // If payer has negative balance (owes money) and receiver has positive balance (is owed)
  // The suggested amount is the minimum of what payer owes and what receiver is owed
  if (payerBal.balance < 0 && receiverBal.balance > 0) {
    const suggestedAmount = Math.min(Math.abs(payerBal.balance), receiverBal.balance);
    amount.value = suggestedAmount.toFixed(2);
  } else {
    // Clear if no obvious debt relationship
    amount.value = '';
  }
};

async function fetchBalances() {
  loadingBalances.value = true;
  try {
    const res = await fetch(`/api/groups/${props.groupId}/member-balances`, { credentials: 'include' });
    if (res.ok) {
      memberBalances.value = await res.json();
      
      // Determine initial payer/receiver based on current user's balance
      const myBalance = memberBalances.value.find(mb => mb.userId === props.currentUserId);
      
      if (myBalance) {
        if (myBalance.balance < 0) {
          // I owe money → I'm the payer. Find someone with positive balance.
          payerId.value = props.currentUserId;
          const creditor = memberBalances.value.find(mb => mb.balance > 0 && mb.userId !== props.currentUserId);
          receiverId.value = creditor?.userId || otherMembers.value[0]?.id || '';
        } else if (myBalance.balance > 0) {
          // I'm owed money → Someone else is the payer. I'm the receiver.
          const debtor = memberBalances.value.find(mb => mb.balance < 0 && mb.userId !== props.currentUserId);
          payerId.value = debtor?.userId || props.currentUserId;
          receiverId.value = props.currentUserId;
        } else {
          // All settled up - default
          payerId.value = props.currentUserId;
          receiverId.value = otherMembers.value[0]?.id || '';
        }
      }
      
      updateAmountFromBalances();
    }
  } catch (e) {
    console.error('Failed to fetch balances', e);
  } finally {
    loadingBalances.value = false;
  }
}

// Reset form when dialog opens
watch(open, (isOpen) => {
  if (isOpen) {
    error.value = null;
    amount.value = '';
    fetchBalances();
  }
});

async function handleSubmit() {
  if (!receiverId.value || !amount.value) {
    error.value = 'Please select a recipient and enter an amount.';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(`/api/groups/${props.groupId}/settlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUserId: payerId.value,
        toUserId: receiverId.value,
        amount: parseFloat(amount.value),
        paymentMethod: 'cash',
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to record settlement');
    }

    emit('settlement-created');
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
    <Button @click="open = true" variant="outline" class="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
      <Handshake class="h-4 w-4" />
      Settle up
    </Button>

    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold text-gray-900">Settle up</DialogTitle>
      </DialogHeader>

      <div class="py-6 space-y-6">
        <!-- Error -->
        <div v-if="error" class="text-sm text-red-500 font-medium text-center">
          {{ error }}
        </div>

        <!-- Avatar Transfer Visual -->
        <div class="flex items-center justify-center gap-4">
          <!-- Payer Avatar & Dropdown -->
          <div class="relative">
            <button 
              @click="showPayerDropdown = !showPayerDropdown"
              class="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div class="h-16 w-16 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center text-xl font-bold text-primary-700 shadow-sm">
                {{ payer ? getInitials(payer.name) : '?' }}
              </div>
              <span class="text-xs font-bold text-gray-600 flex items-center gap-1">
                {{ payer?.id === currentUserId ? 'You' : payer?.name.split(' ')[0] }}
                <ChevronDown class="h-3 w-3" />
              </span>
            </button>
            <!-- Dropdown -->
            <div 
              v-if="showPayerDropdown" 
              class="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white rounded-lg shadow-lg border z-10 py-1"
            >
              <button 
                v-for="m in payableMembers" 
                :key="m.id"
                @click="selectPayer(m.id)"
                class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                :class="{ 'bg-gray-50 font-semibold': m.id === payerId }"
              >
                <div class="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{{ getInitials(m.name) }}</div>
                {{ m.id === currentUserId ? 'You' : m.name }}
              </button>
            </div>
          </div>

          <!-- Arrow -->
          <div class="flex flex-col items-center gap-1">
            <ArrowRight class="h-6 w-6 text-gray-300" />
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">paid</span>
          </div>

          <!-- Receiver Avatar & Dropdown -->
          <div class="relative">
            <button 
              @click="showReceiverDropdown = !showReceiverDropdown"
              class="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div class="h-16 w-16 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-xl font-bold text-orange-700 shadow-sm">
                {{ receiver ? getInitials(receiver.name) : '?' }}
              </div>
              <span class="text-xs font-bold text-gray-600 flex items-center gap-1">
                {{ receiver?.name.split(' ')[0] || 'Select...' }}
                <ChevronDown class="h-3 w-3" />
              </span>
            </button>
            <!-- Dropdown -->
            <div 
              v-if="showReceiverDropdown" 
              class="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white rounded-lg shadow-lg border z-10 py-1"
            >
              <button 
                v-for="m in otherMembers" 
                :key="m.id"
                @click="selectReceiver(m.id)"
                class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                :class="{ 'bg-gray-50 font-semibold': m.id === receiverId }"
              >
                <div class="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{{ getInitials(m.name) }}</div>
                {{ m.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Amount Input -->
        <div class="text-center">
          <div class="inline-flex items-baseline gap-1">
            <span class="text-3xl font-bold text-gray-400">$</span>
            <input 
              v-model="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :style="{ width: inputWidth }"
              class="text-5xl font-bold text-gray-900 text-center bg-transparent border-b-2 border-dashed border-gray-200 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        <!-- Date Picker -->
        <div class="flex justify-center">
          <DatePicker v-model="selectedDate" />
        </div>
      </div>

      <DialogFooter class="flex gap-2">
        <Button variant="outline" @click="open = false" class="flex-1">Cancel</Button>
        <Button @click="handleSubmit" :disabled="loading || !receiverId || !amount" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ loading ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
