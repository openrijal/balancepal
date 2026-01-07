<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  Receipt, 
  Utensils, 
  Car, 
  Gamepad2, 
  Lightbulb, 
  ShoppingBag,
  CreditCard,
  ChevronRight
} from 'lucide-vue-next';

interface Activity {
  id: string;
  type: 'expense' | 'settlement';
  description: string;
  amount: string | number;
  date: string;
  category?: string;
  groupName: string;
  paidBy?: { id: string; name: string };
  fromUser?: { id: string; name: string };
  toUser?: { id: string; name: string };
  splits?: { userId: string; amount: string | number }[];
}

const props = defineProps<{
  currentUserId: string;
}>();

const activities = ref<Activity[]>([]);
const loading = ref(true);

const formatMonthYear = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.getDate(),
  };
};

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
};

const getCategoryIcon = (activity: Activity) => {
  if (activity.type === 'settlement') return CreditCard;
  
  switch (activity.category) {
    case 'food': return Utensils;
    case 'transport': return Car;
    case 'entertainment': return Gamepad2;
    case 'utilities': return Lightbulb;
    case 'shopping': return ShoppingBag;
    default: return Receipt;
  }
};

const groupedActivities = computed(() => {
  const groups: Record<string, Activity[]> = {};
  activities.value.forEach(activity => {
    const key = formatMonthYear(activity.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(activity);
  });
  return Object.entries(groups).map(([monthYear, items]) => ({ monthYear, items }));
});

const getSettlementNarrative = (activity: Activity) => {
  const fromName = activity.fromUser?.id === props.currentUserId ? 'You' : activity.fromUser?.name;
  const toName = activity.toUser?.id === props.currentUserId ? 'you' : activity.toUser?.name;
  return `${fromName} paid ${toName} ${formatCurrency(activity.amount)} in "${activity.groupName}"`;
};

const getExpenseDebtContext = (activity: Activity) => {
  if (activity.type === 'settlement') {
    const isPayer = activity.fromUser?.id === props.currentUserId;
    return {
      label: isPayer ? 'you paid' : 'you received',
      amount: formatCurrency(activity.amount),
      class: isPayer ? 'text-gray-500' : 'text-emerald-600'
    };
  }

  const isPayer = activity.paidBy?.id === props.currentUserId;
  const userSplit = activity.splits?.find(s => s.userId === props.currentUserId);
  const userAmount = userSplit ? Number(userSplit.amount) : 0;
  
  if (isPayer) {
    const othersOwe = Number(activity.amount) - userAmount;
    return othersOwe > 0 
      ? { label: 'you lent', amount: formatCurrency(othersOwe), class: 'text-emerald-600' }
      : { label: 'you paid', amount: formatCurrency(activity.amount), class: 'text-gray-500' };
  } else {
    return userAmount > 0 
      ? { label: `${activity.paidBy?.name.split(' ')[0]} lent you`, amount: formatCurrency(userAmount), class: 'text-orange-600' }
      : { label: 'not involved', amount: '', class: 'text-gray-400' };
  }
};

onMounted(async () => {
  try {
    const res = await fetch('/api/expenses/all', { credentials: 'include' });
    if (res.ok) {
      activities.value = await res.json();
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">All expenses</h1>
      <div class="flex gap-2">
        <button class="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-orange-700 transition-colors">Add an expense</button>
        <button class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-emerald-700 transition-colors">Settle up</button>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-20 bg-gray-100 animate-pulse rounded-xl"></div>
    </div>

    <div v-else-if="activities.length === 0" class="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
      <Receipt class="mx-auto h-12 w-12 text-gray-300 mb-4" />
      <p class="text-gray-500">No expenses recorded yet.</p>
    </div>

    <div v-else v-for="group in groupedActivities" :key="group.monthYear" class="space-y-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50 py-1 px-3 rounded-md inline-block">
        {{ group.monthYear }}
      </h3>
      
      <div class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div 
          v-for="activity in group.items" 
          :key="activity.id"
          class="group flex items-center justify-between p-4 transition-colors hover:bg-gray-50/80"
        >
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <!-- Date Box -->
            <div class="flex flex-col items-center justify-center text-center w-10 shrink-0">
              <span class="text-[10px] font-bold text-gray-400 tracking-tighter">{{ formatDate(activity.date).month }}</span>
              <span class="text-xl font-medium text-gray-600 leading-none">{{ formatDate(activity.date).day }}</span>
            </div>

            <!-- Icon -->
            <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all', 
              activity.type === 'settlement' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-transparent text-gray-400 group-hover:bg-white group-hover:border-gray-100']">
              <component :is="getCategoryIcon(activity)" class="h-5 w-5" />
            </div>

            <div class="min-w-0">
              <template v-if="activity.type === 'settlement'">
                <p class="text-[13px] font-medium text-gray-900 leading-snug">
                  {{ getSettlementNarrative(activity) }}
                </p>
              </template>
              <template v-else>
                <h4 class="font-bold text-gray-900 leading-none mb-1">{{ activity.description }}</h4>
                <span class="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                  {{ activity.groupName }}
                </span>
              </template>
            </div>
          </div>

          <!-- Payer/Receiver Columns (Matching Layout) -->
          <div class="flex items-center gap-8 md:gap-12 shrink-0 ml-4">
            <!-- Who paid -->
            <div v-if="activity.type === 'expense'" class="hidden sm:block text-right w-24">
              <p class="text-[10px] font-bold text-gray-400 uppercase leading-none mb-0.5">
                {{ activity.paidBy?.id === currentUserId ? 'You' : activity.paidBy?.name.split(' ')[0] }} paid
              </p>
              <p class="text-sm font-bold text-gray-800">{{ formatCurrency(activity.amount) }}</p>
            </div>

            <!-- Debt Context -->
            <div class="text-right w-28">
              <template v-if="getExpenseDebtContext(activity).amount">
                <p class="text-[10px] font-bold uppercase tracking-tight text-gray-400 leading-none mb-0.5">
                  {{ getExpenseDebtContext(activity).label }}
                </p>
                <p :class="['text-sm font-bold', getExpenseDebtContext(activity).class]">
                  {{ getExpenseDebtContext(activity).amount }}
                </p>
              </template>
              <template v-else>
                  <p class="text-xs italic text-gray-300">not involved</p>
              </template>
            </div>
            
            <ChevronRight class="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
