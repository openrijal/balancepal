<script setup lang="ts">
import { ref } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, User, Check } from 'lucide-vue-next';

interface Props {
  initialName: string;
  email: string;
  avatarUrl: string | null;
}

const props = defineProps<Props>();

// Form state
const name = ref(props.initialName);
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = 'Name is required';
    return;
  }

  loading.value = true;
  error.value = null;
  success.value = false;

  try {
    const supabase = useSupabase();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      error.value = 'You must be logged in to update your profile';
      return;
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name: name.value.trim() })
      .eq('id', user.id);

    if (updateError) {
      error.value = updateError.message;
      return;
    }

    success.value = true;
    setTimeout(() => success.value = false, 3000);
  } catch (err) {
    error.value = 'An unexpected error occurred. Please try again.';
    console.error('Profile update error:', err);
  } finally {
    loading.value = false;
  }
}

async function handleSignOut() {
  const supabase = useSupabase();
  await supabase.auth.signOut();
  window.location.href = '/login';
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Avatar Section -->
    <div class="flex items-center gap-4">
      <div class="w-20 h-20 bg-sage/20 rounded-full flex items-center justify-center">
        <User class="w-10 h-10 text-sage" />
      </div>
      <div>
        <p class="font-medium text-gray-900">{{ name || 'User' }}</p>
        <p class="text-sm text-gray-500">{{ email }}</p>
      </div>
    </div>
    
    <!-- Alerts -->
    <div v-if="error" class="bg-danger-500/10 text-danger-500 rounded-lg p-3 flex items-start gap-2 text-sm">
      <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span>{{ error }}</span>
    </div>
    
    <div v-if="success" class="bg-success-500/10 text-success-500 rounded-lg p-3 flex items-center gap-2 text-sm">
      <Check class="w-5 h-5" />
      <span>Profile updated successfully!</span>
    </div>
    
    <!-- Name Field -->
    <div class="space-y-2">
      <label for="name" class="block text-sm font-medium text-gray-700">
        Display name
      </label>
      <Input
        id="name"
        v-model="name"
        type="text"
        placeholder="Your name"
        required
        :disabled="loading"
      />
    </div>
    
    <!-- Email Field (read-only) -->
    <div class="space-y-2">
      <label for="email" class="block text-sm font-medium text-gray-700">
        Email
      </label>
      <Input
        id="email"
        :value="email"
        type="email"
        disabled
        class="bg-gray-50"
      />
      <p class="text-xs text-gray-500">Email cannot be changed</p>
    </div>
    
    <!-- Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-100">
      <Button type="button" variant="outline" @click="handleSignOut">
        Sign out
      </Button>
      <Button type="submit" :disabled="loading">
        <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
        {{ loading ? 'Saving...' : 'Save changes' }}
      </Button>
    </div>
  </form>
</template>
