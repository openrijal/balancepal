<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { ArrowRight, CheckCircle2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import SettleUpDialog from './SettleUpDialog.vue';
import { useGroupsStore } from '@/stores/groupsStore';

interface Debt {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
}

const props = defineProps<{
  groupId: string;
  currentUserId: string;
}>();

const groupsStore = useGroupsStore();
const balances = ref<Debt[]>([]);
const loading = ref(true);

// Watch for group stats updates to refresh balances via shared Pinia store
watch(
  () => groupsStore.currentGroup?.totalExpenses,
  () => {
    fetchBalances();
  }
);

// Settle Up State
const showSettleUp = ref(false);
const settleRecipient = ref<{ id: string; name: string } | null>(null);
const settleAmount = ref(0);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const fetchBalances = async () => {
  loading.value = true;
  try {
    const res = await fetch(`/api/groups/${props.groupId}/balances`);
    if (res.ok) {
      balances.value = await res.json();
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const openSettleUp = (debt: Debt) => {
  settleRecipient.value = debt.toUser;
  settleAmount.value = debt.amount;
  showSettleUp.value = true;
};

onMounted(() => {
  fetchBalances();
});

const myDebts = computed(() => balances.value.filter((d) => d.fromUserId === props.currentUserId));
const owedToMe = computed(() => balances.value.filter((d) => d.toUserId === props.currentUserId));
const otherDebts = computed(() =>
  balances.value.filter(
    (d) => d.fromUserId !== props.currentUserId && d.toUserId !== props.currentUserId
  )
);
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-xl font-semibold">Balances</h2>

    <div v-if="loading" class="text-muted-foreground text-sm">Loading balances...</div>

    <div
      v-else-if="balances.length === 0"
      class="text-muted-foreground rounded-lg border border-dashed bg-gray-50 p-6 text-center"
    >
      <CheckCircle2 class="mx-auto mb-2 h-8 w-8 text-green-500" />
      <p>All settled up! No outstanding debts.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Debts I owe -->
      <div v-if="myDebts.length > 0" class="space-y-2">
        <h3 class="text-sm font-medium tracking-wider text-gray-500 uppercase">You Owe</h3>
        <div
          v-for="debt in myDebts"
          :key="debt.toUserId"
          class="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700"
            >
              {{ debt.toUser?.name?.charAt(0) }}
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ debt.toUser?.name }}</p>
              <p class="font-bold text-red-600">{{ formatCurrency(debt.amount) }}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            class="border-red-200 text-red-700 hover:bg-red-100"
            @click="openSettleUp(debt)"
          >
            Settle Up
          </Button>
        </div>
      </div>

      <!-- Debts owed to me -->
      <div v-if="owedToMe.length > 0" class="space-y-2">
        <h3 class="text-sm font-medium tracking-wider text-gray-500 uppercase">Owed to You</h3>
        <div
          v-for="debt in owedToMe"
          :key="debt.fromUserId"
          class="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700"
            >
              {{ debt.fromUser?.name?.charAt(0) }}
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ debt.fromUser?.name }}</p>
              <p class="font-bold text-green-600">{{ formatCurrency(debt.amount) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Other debts -->
      <div v-if="otherDebts.length > 0" class="space-y-2">
        <h3 class="text-sm font-medium tracking-wider text-gray-500 uppercase">Other Debts</h3>
        <div
          v-for="debt in otherDebts"
          :key="debt.fromUserId + debt.toUserId"
          class="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm text-gray-600"
        >
          <span class="font-medium">{{ debt.fromUser?.name }}</span>
          <ArrowRight class="h-3 w-3 text-gray-400" />
          <span class="font-medium">{{ debt.toUser?.name }}</span>
          <span class="ml-auto font-bold">{{ formatCurrency(debt.amount) }}</span>
        </div>
      </div>
    </div>

    <SettleUpDialog
      v-model:open="showSettleUp"
      :recipient="settleRecipient"
      :amount="settleAmount"
      :group-id="groupId"
      :default-amount="settleAmount"
      @settlement-recorded="fetchBalances"
    />
  </div>
</template>
