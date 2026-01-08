<script setup lang="ts">
import { computed } from 'vue';
import { 
  Receipt, 
  Utensils, 
  Car, 
  Gamepad2, 
  Lightbulb, 
  ShoppingBag,
  Camera,
  Calendar,
  User,
  Pencil,
  MessageSquare
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

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

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
};

const formatDateLong = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'food': return Utensils;
    case 'transport': return Car;
    case 'entertainment': return Gamepad2;
    case 'utilities': return Lightbulb;
    case 'shopping': return ShoppingBag;
    default: return Receipt;
  }
};

const isExpense = computed(() => props.transaction.type === 'expense');

// Fake chart data for now, matching the reference image style
const chartData = [
  { month: 'November', amount: 0, height: 1 },
  { month: 'December', amount: 43.09, height: 100 },
  { month: 'January', amount: 0, height: 1 },
];
</script>

<template>
  <div class="bg-gray-50/50 p-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
    <div class="flex flex-col md:flex-row gap-8">
      <!-- Left Column: Basic Info & Receipt -->
      <div class="flex-1 space-y-6">
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
            <component :is="getCategoryIcon(transaction.category)" class="h-8 w-8 text-gray-400" />
          </div>

          <div class="space-y-1">
            <h3 class="text-xl font-bold text-gray-900 leading-tight">{{ transaction.description }}</h3>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(transaction.amount) }}</p>
            <div class="text-xs text-gray-500 space-y-0.5">
              <p>Added by {{ transaction.paidBy?.name || 'Unknown' }} on {{ formatDateLong(transaction.date) }}</p>
              <p v-if="transaction.updatedAt">Last updated on {{ formatDateLong(transaction.updatedAt) }}</p>
            </div>
            
            <div class="pt-2">
              <Button variant="outline" size="sm" class="h-7 text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white border-none hover:bg-orange-600 px-3">
                Edit expense
              </Button>
            </div>
          </div>
        </div>

        <!-- Receipt -->
        <div v-if="transaction.receiptUrl || true" class="space-y-2">
          <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <Camera class="h-3 w-3" />
            Receipt
          </div>
          <div v-if="transaction.receiptUrl" class="relative group cursor-pointer inline-block">
             <img :src="transaction.receiptUrl" alt="Receipt" class="h-32 rounded-lg border shadow-sm transition-transform hover:scale-105" />
          </div>
          <div v-else class="h-32 w-48 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-white/50">
            <p class="text-[10px] font-bold text-gray-400 flex flex-col items-center gap-1">
                <Camera class="h-4 w-4 opacity-50" />
                No receipt attached
            </p>
          </div>
        </div>
      </div>

      <!-- Right Column: Splits & Chart -->
      <div class="flex-1 space-y-8">
        <!-- Splits -->
        <div class="space-y-4">
          <div v-for="split in transaction.splits" :key="split.userId" class="flex items-center gap-3">
            <div class="h-10 w-10 shrink-0 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-xs font-bold text-gray-500">
                {{ split.user?.name?.charAt(0) || '?' }}
            </div>
            <p class="text-sm font-medium text-gray-700">
                <span class="font-bold text-gray-900">{{ split.userId === currentUserId ? 'You' : (split.user?.name || 'Unknown') }}</span>
                <template v-if="transaction.paidBy?.id === split.userId">
                    paid {{ formatCurrency(transaction.amount) }} and owes {{ formatCurrency(split.amount) }}
                </template>
                <template v-else>
                    owes {{ formatCurrency(split.amount) }}
                </template>
            </p>
          </div>
        </div>

        <!-- Category Chart -->
        <div v-if="isExpense" class="space-y-4">
          <div class="space-y-1">
            <p class="text-[11px] font-black uppercase tracking-widest text-gray-900">Spending by category</p>
            <p class="text-xs text-gray-600">{{ transaction.groupName || 'BalancePal' }} :: {{ transaction.category || 'General' }}</p>
          </div>

          <div class="space-y-3">
            <div v-for="item in chartData" :key="item.month" class="flex items-center gap-4">
              <span class="text-[11px] font-medium text-gray-500 w-16">{{ item.month }}</span>
              <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex items-center">
                 <div 
                    class="h-full bg-yellow-200 rounded-full transition-all duration-500 border-r border-yellow-300" 
                    :style="{ width: `${item.height}%` }"
                 ></div>
              </div>
              <span class="text-[11px] font-bold text-gray-700 w-12 text-right">{{ formatCurrency(item.amount) }}</span>
            </div>
          </div>
          <button class="text-[11px] font-bold text-sky-500 hover:underline">View more charts</button>
        </div>
      </div>
    </div>

    <!-- Notes & Comments -->
    <div class="space-y-4 pt-4 border-t border-gray-100">
      <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
        <MessageSquare class="h-3 w-3" />
        Notes and comments
      </div>
      
      <div class="space-y-3 max-w-lg">
        <textarea 
          placeholder="Add a comment"
          class="w-full min-h-[80px] p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400"
        ></textarea>
        <Button class="bg-orange-500 hover:bg-orange-600 text-white font-bold h-8 px-4 text-xs">Post</Button>
      </div>
    </div>
  </div>
</template>
