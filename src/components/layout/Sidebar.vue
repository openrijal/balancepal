<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Home, 
  Users, 
  Receipt, 
  Wallet,
  Bell,
  User,
  LogOut,
  Plus
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

interface Props {
  mobile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mobile: false
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
  <div v-if="mobile" class="flex items-center justify-around h-16 px-2">
    <a
      v-for="item in navItems"
      :key="item.href"
      :href="item.href"
      class="flex flex-col items-center justify-center flex-1 py-2 rounded-lg transition-colors"
      :class="isActive(item.href) 
        ? 'text-primary-600' 
        : 'text-gray-500 hover:text-gray-900'"
    >
      <component :is="item.icon" class="w-5 h-5 mb-1" />
      <span class="text-xs font-medium">{{ item.label }}</span>
    </a>
    
    <!-- Add Button (FAB style in nav) -->
    <button 
      class="flex flex-col items-center justify-center flex-1 py-2"
      @click="$emit('add-expense')"
    >
      <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
        <Plus class="w-5 h-5 text-white" />
      </div>
    </button>
  </div>
  
  <!-- Desktop Sidebar -->
  <div v-else class="flex flex-col h-full">
    <!-- Logo -->
    <div class="p-4 border-b border-gray-100">
      <a href="/dashboard" class="flex items-center gap-3">
        <div class="w-10 h-10 bg-sage rounded-xl flex items-center justify-center">
          <span class="text-white font-bold text-xl">B</span>
        </div>
        <span class="font-semibold text-xl text-gray-900">Balance Pal</span>
      </a>
    </div>
    
    <!-- Add Expense Button -->
    <div class="p-4">
      <Button class="w-full gap-2" @click="$emit('add-expense')">
        <Plus class="w-4 h-4" />
        Add Expense
      </Button>
    </div>
    
    <!-- Navigation -->
    <nav class="flex-1 px-3 py-2 space-y-1">
      <a
        v-for="item in navItems"
        :key="item.href"
        :href="item.href"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors"
        :class="isActive(item.href) 
          ? 'bg-primary-50 text-primary-700' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
      >
        <component :is="item.icon" class="w-5 h-5" />
        {{ item.label }}
      </a>
    </nav>
    
    <!-- Bottom Section -->
    <div class="mt-auto border-t border-gray-100">
      <!-- Notifications -->
      <a 
        href="/notifications" 
        class="flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Bell class="w-5 h-5" />
        <span>Notifications</span>
        <!-- Badge placeholder -->
        <span class="ml-auto bg-danger-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          3
        </span>
      </a>
      
      <!-- Profile -->
      <a 
        href="/profile" 
        class="flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <User class="w-5 h-5" />
        <span>Profile</span>
      </a>
      
      <!-- Logout -->
      <button 
        class="w-full flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
        @click="$emit('logout')"
      >
        <LogOut class="w-5 h-5" />
        <span>Log out</span>
      </button>
    </div>
  </div>
</template>
