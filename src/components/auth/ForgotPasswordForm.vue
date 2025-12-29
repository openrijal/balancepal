<script setup lang="ts">
import { ref } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Mail, Check } from 'lucide-vue-next';

// Form state
const email = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

async function handleSubmit() {
  if (!email.value) {
    error.value = 'Please enter your email';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const supabase = useSupabase();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      error.value = resetError.message;
      return;
    }

    success.value = true;
  } catch (err) {
    error.value = 'An unexpected error occurred. Please try again.';
    console.error('Reset password error:', err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <!-- Success State -->
  <div v-if="success" class="py-4 text-center">
    <div
      class="bg-success-500/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
    >
      <Check class="text-success-500 h-8 w-8" />
    </div>
    <h2 class="mb-2 text-xl font-semibold text-gray-900">Check your email</h2>
    <p class="text-gray-600">
      If an account exists for <strong>{{ email }}</strong
      >, we've sent a password reset link.
    </p>
  </div>

  <!-- Form -->
  <form v-else class="space-y-4" @submit.prevent="handleSubmit">
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

    <!-- Submit Button -->
    <Button type="submit" class="w-full" :disabled="loading">
      <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
      {{ loading ? 'Sending...' : 'Send reset link' }}
    </Button>
  </form>
</template>
