<script setup lang="ts">
import { ref } from 'vue';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
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
  { href: '/expenses', label: 'All expenses', icon: Receipt },
];

const isActive = (href: string) => {
  return currentPath.value === href || currentPath.value.startsWith(href + '/');
};



// ... (imports remain)

const handleLogout = async () => {
  try {
    // 1. Sign out from Supabase (clears cookies via ssr client singleton)
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabase = getSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
    
    await supabase.auth.signOut();

    // 2. Sign out from Server (clears manual tokens if any, and redirects)
    await fetch('/api/auth/signout', { method: 'POST' });
    
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = '/login';
  }
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
        @click="handleLogout"
      >
        <LogOut class="h-5 w-5" />
        <span>Log out</span>
      </button>
    </div>
  </div>
</template>
