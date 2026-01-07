<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Home, Users, Receipt, Wallet, Bell, User, LogOut, Plus, Tag, UserPlus, Mail } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  mobile?: boolean;
  currentPath?: string;
}

interface Group {
  id: string;
  name: string;
}

interface Friend {
  id: string;
  name: string;
  email: string;
}

defineEmits<{
  (e: 'add-expense'): void;
  (e: 'logout'): void;
}>();

const props = withDefaults(defineProps<Props>(), {
  mobile: false,
});

// Current route - will be replaced with actual router later
// Current route
const currentPath = computed(() => props.currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/dashboard'));

const groups = ref<Group[]>([]);
const friends = ref<Friend[]>([]);
const inviteEmail = ref('');

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/activity', label: 'Recent activity', icon: Bell },
  { href: '/expenses', label: 'All expenses', icon: Receipt },
];

const isActive = (href: string) => {
  return currentPath.value === href || currentPath.value.startsWith(href + '/');
};

const fetchSidebarData = async () => {
  try {
    const res = await fetch('/api/sidebar/data', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      groups.value = data.groups;
      friends.value = data.friends;
    }
  } catch (e) {
    console.error('Failed to fetch sidebar data', e);
  }
};

onMounted(() => {
  if (!props.mobile) {
    fetchSidebarData();
  }
});

const handleLogout = async () => {
  // ... (logout logic remains same)
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
  <div v-else class="flex h-full flex-col bg-white overflow-y-auto custom-scrollbar">
    <!-- Logo -->
    <div class="p-4 mb-2">
      <a href="/dashboard" class="flex items-center gap-2">
        <div class="bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg shadow-sm">
          <span class="text-sm font-bold text-white leading-none">B</span>
        </div>
        <span class="text-lg font-bold text-gray-900 tracking-tight">Balance Pal</span>
      </a>
    </div>

    <!-- Main Navigation -->
    <nav class="px-2 space-y-0.5 mb-6">
      <a
        v-for="item in navItems"
        :key="item.href"
        :href="item.href"
        class="flex items-center gap-3 rounded px-3 py-1.5 text-[13px] font-medium transition-colors"
        :class="
          isActive(item.href)
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        "
      >
        <component :is="item.icon" class="h-4 w-4" />
        {{ item.label }}
      </a>
    </nav>

    <!-- Groups Section -->
    <div class="px-2 mb-6">
      <div class="flex items-center justify-between px-3 py-1 mb-1">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Groups</span>
        <button class="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition-colors">
          <Plus class="h-3 w-3" />
        </button>
      </div>
      <div class="space-y-0.5">
        <a
          v-for="group in groups"
          :key="group.id"
          :href="`/groups/${group.id}`"
          class="flex items-center gap-3 rounded px-3 py-1.5 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          :class="{ 'bg-primary-50 text-primary-700 font-medium': isActive(`/groups/${group.id}`) }"
        >
          <Tag class="h-4 w-4 shrink-0" />
          <span class="truncate">{{ group.name }}</span>
        </a>
        <p v-if="groups.length === 0" class="px-3 py-2 text-[11px] text-gray-400 italic">No groups yet</p>
      </div>
    </div>

    <!-- Friends Section -->
    <div class="px-2 mb-6">
      <div class="flex items-center justify-between px-3 py-1 mb-1">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Friends</span>
        <button class="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition-colors">
          <Plus class="h-3 w-3" />
        </button>
      </div>
      <div class="space-y-0.5">
        <a
          v-for="friend in friends"
          :key="friend.id"
          :href="`/friends/${friend.id}`"
          class="flex items-center gap-3 rounded px-3 py-1.5 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <User class="h-4 w-4 shrink-0" />
          <span class="truncate">{{ friend.name }}</span>
        </a>
        <p v-if="friends.length === 0" class="px-3 py-2 text-[11px] text-gray-400 italic">No friends yet</p>
      </div>
    </div>

    <!-- Invite Friends Footer Block -->
    <div class="mt-auto border-t border-gray-100 p-4 bg-gray-50/50">
      <h3 class="text-[11px] font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-2">
        <UserPlus class="h-3.5 w-3.5 text-primary-600" />
        Invite friends
      </h3>
      <div class="space-y-2">
        <div class="relative">
          <Mail class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <Input 
            v-model="inviteEmail" 
            placeholder="Enter an email address" 
            class="h-8 pl-9 text-xs border-gray-200 focus:ring-primary-100"
          />
        </div>
        <Button class="w-full h-8 text-xs font-semibold py-0" size="sm" variant="outline">
          Send invite
        </Button>
      </div>
    </div>

    <!-- Profile & Logout -->
    <div class="border-t border-gray-100 px-2 py-2">
      <a
        href="/profile"
        class="flex items-center gap-3 rounded px-3 py-1.5 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        <User class="h-4 w-4" />
        <span>Profile</span>
      </a>
      <button
        class="flex w-full items-center gap-3 rounded px-3 py-1.5 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-orange-600 transition-colors"
        @click="handleLogout"
      >
        <LogOut class="h-4 w-4" />
        <span>Log out</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
