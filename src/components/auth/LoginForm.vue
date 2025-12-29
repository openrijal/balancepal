<script setup lang="ts">
import { ref } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Mail, Lock } from 'lucide-vue-next';

interface Props {
  redirectTo?: string;
}

const props = withDefaults(defineProps<Props>(), {
  redirectTo: '/dashboard',
});

// Form state
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const supabase = useSupabase();

async function handleSubmit() {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (authError) {
      error.value = authError.message;
      return;
    }

    if (data.session) {
      // Set cookies on server
      await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });

      // Redirect to dashboard or requested page
      window.location.href = props.redirectTo;
    }
  } catch (err) {
    error.value = 'An unexpected error occurred. Please try again.';
    console.error('Login error:', err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Error Alert -->
    <div
      v-if="error"
      class="bg-danger-500/10 text-danger-500 flex items-start gap-2 rounded-lg p-3 text-sm"
    >
      <AlertCircle class="mt-0.5 h-5 w-5 flex-shrink-0" />
      <span>{{ error }}</span>
    </div>

    <!-- Email -->
    <div class="space-y-2">
      <label for="email" class="block text-sm font-medium text-gray-700"> Email </label>
      <div class="relative">
        <Mail class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          id="email"
          v-model="email"
          type="email"
          placeholder="you@example.com"
          class="pl-10"
          required
          :disabled="loading"
        />
      </div>
    </div>

    <!-- Password -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
        <a href="/forgot-password" class="text-primary-600 hover:text-primary-700 text-sm">
          Forgot password?
        </a>
      </div>
      <div class="relative">
        <Lock class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          id="password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          class="pl-10"
          required
          :disabled="loading"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <Button type="submit" class="w-full" :disabled="loading">
      <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
      {{ loading ? 'Logging in...' : 'Log in' }}
    </Button>
  </form>
</template>
