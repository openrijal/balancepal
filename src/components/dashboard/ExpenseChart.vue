<script setup lang="ts">
import { ref } from 'vue';

// Fake data for the chart - will be replaced with real data later
const chartData = ref([
  { month: 'Jan', expenses: 120, settlements: 80 },
  { month: 'Feb', expenses: 200, settlements: 150 },
  { month: 'Mar', expenses: 150, settlements: 100 },
  { month: 'Apr', expenses: 280, settlements: 200 },
  { month: 'May', expenses: 180, settlements: 120 },
  { month: 'Jun', expenses: 250, settlements: 180 },
]);

const maxValue = Math.max(...chartData.value.flatMap((d) => [d.expenses, d.settlements]));
const getBarHeight = (value: number) => (value / maxValue) * 100;
</script>

<template>
  <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
    <h3 class="mb-6 font-semibold text-gray-900">Expense Trends</h3>

    <!-- Legend -->
    <div class="mb-4 flex gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="h-3 w-3 rounded-sm bg-emerald-500"></div>
        <span class="text-gray-600">Expenses</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="h-3 w-3 rounded-sm bg-sky-500"></div>
        <span class="text-gray-600">Settlements</span>
      </div>
    </div>

    <!-- Chart -->
    <div class="flex h-48 items-end justify-between gap-2">
      <template v-for="item in chartData" :key="item.month">
        <div class="flex flex-1 flex-col items-center gap-1">
          <div class="flex w-full items-end justify-center gap-1" style="height: 160px">
            <div
              class="w-3 rounded-t bg-emerald-500 transition-all duration-300"
              :style="{ height: `${getBarHeight(item.expenses)}%` }"
              :title="`Expenses: $${item.expenses}`"
            ></div>
            <div
              class="w-3 rounded-t bg-sky-500 transition-all duration-300"
              :style="{ height: `${getBarHeight(item.settlements)}%` }"
              :title="`Settlements: $${item.settlements}`"
            ></div>
          </div>
          <span class="text-xs text-gray-500">{{ item.month }}</span>
        </div>
      </template>
    </div>

    <!-- Summary -->
    <div class="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
      <div>
        <p class="text-sm text-gray-500">Total Expenses</p>
        <p class="text-lg font-semibold text-emerald-600">$1,180</p>
      </div>
      <div>
        <p class="text-sm text-gray-500">Total Settlements</p>
        <p class="text-lg font-semibold text-sky-600">$830</p>
      </div>
    </div>
  </div>
</template>
