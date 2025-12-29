<script setup lang="ts">
import { ref } from 'vue';
import { Home, Users, Receipt, Wallet, Bell, User, LogOut, Plus } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

interface Props {
  mobile?: boolean;
}

defineEmits<{
  (e: 'add-expense'): void;
  (e: 'logout'): void;
}>();

withDefaults(defineProps<Props>(), {
  mobile: false,
});

// Current route - will be replaced with actual router later
const currentPath = ref(typeof window !== 'undefined' ? window.location.pathname : '/dashboard');

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/balances', label: 'Balances', icon: Wallet },
];

const isActive = (href: string) => {
  return currentPath.value === href || currentPath.value.startsWith(href + '/');
};
</script>

<template>
  <!-- Mobile Bottom Navigation -->
  <div v-if="mobile" class="flex h-16 items-center justify-around px-2">
    <a
      v-for="item in navItems"
      :key="item.href"
      :href="item.href"
      class="flex flex-1 flex-col items-center justify-center rounded-lg py-2 transition-colors"
      :class="isActive(item.href) ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'"
    >
      <component :is="item.icon" class="mb-1 h-5 w-5" />
      <span class="text-xs font-medium">{{ item.label }}</span>
    </a>

    <!-- Add Button (FAB style in nav) -->
    <button
      class="flex flex-1 flex-col items-center justify-center py-2"
      @click="$emit('add-expense')"
    >
      <div class="bg-primary-500 flex h-10 w-10 items-center justify-center rounded-full shadow-md">
        <Plus class="h-5 w-5 text-white" />
      </div>
    </button>
  </div>

  <!-- Desktop Sidebar -->
  <div v-else class="flex h-full flex-col">
    <!-- Logo -->
    <div class="border-b border-gray-100 p-4">
      <a href="/dashboard" class="flex items-center gap-3">
        <div class="bg-sage flex h-10 w-10 items-center justify-center rounded-xl">
          <span class="text-xl font-bold text-white">B</span>
        </div>
        <span class="text-xl font-semibold text-gray-900">Balance Pal</span>
      </a>
    </div>

    <!-- Add Expense Button -->
    <div class="p-4">
      <Button class="w-full gap-2" @click="$emit('add-expense')">
        <Plus class="h-4 w-4" />
        Add Expense
      </Button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 space-y-1 px-3 py-2">
      <a
        v-for="item in navItems"
        :key="item.href"
        :href="item.href"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors"
        :class="
          isActive(item.href)
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        "
      >
        <component :is="item.icon" class="h-5 w-5" />
        {{ item.label }}
      </a>
    </nav>

    <!-- Bottom Section -->
    <div class="mt-auto border-t border-gray-100">
      <!-- Notifications -->
      <a
        href="/notifications"
        class="flex items-center gap-3 px-6 py-3 text-gray-600 transition-colors hover:bg-gray-50"
      >
        <Bell class="h-5 w-5" />
        <span>Notifications</span>
        <!-- Badge placeholder -->
        <span class="bg-danger-500 ml-auto rounded-full px-2 py-0.5 text-xs font-medium text-white">
          3
        </span>
      </a>

      <!-- Profile -->
      <a
        href="/profile"
        class="flex items-center gap-3 px-6 py-3 text-gray-600 transition-colors hover:bg-gray-50"
      >
        <User class="h-5 w-5" />
        <span>Profile</span>
      </a>

      <!-- Logout -->
      <button
        class="flex w-full items-center gap-3 px-6 py-3 text-gray-600 transition-colors hover:bg-gray-50"
        @click="$emit('logout')"
      >
        <LogOut class="h-5 w-5" />
        <span>Log out</span>
      </button>
    </div>
  </div>
</template>
