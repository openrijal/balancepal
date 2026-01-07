<script setup lang="ts">
import { ArrowLeft, Mail, User } from 'lucide-vue-next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Props {
  friendId: string;
  name: string;
  email: string;
  profilePictureUrl?: string | null;
}

const props = defineProps<Props>();

const initials = props.name
  .split(' ')
  .map((n) => n[0])
  .join('')
  .toUpperCase()
  .slice(0, 2);

const goBack = () => {
  if (typeof window !== 'undefined') {
    window.history.back();
  }
};
</script>

<template>
  <div class="mb-6">
    <!-- Back Button -->
    <button
      @click="goBack"
      class="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft class="h-4 w-4" />
      <span>Back</span>
    </button>

    <!-- Profile Header -->
    <div class="flex items-center gap-4">
      <Avatar class="h-16 w-16 ring-2 ring-primary-100 ring-offset-2">
        <AvatarImage v-if="profilePictureUrl" :src="profilePictureUrl" :alt="name" />
        <AvatarFallback class="bg-primary-100 text-primary-700 text-lg font-semibold">
          {{ initials }}
        </AvatarFallback>
      </Avatar>

      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ name }}</h1>
        <div class="flex items-center gap-2 text-gray-500 mt-1">
          <Mail class="h-4 w-4" />
          <span class="text-sm">{{ email }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
