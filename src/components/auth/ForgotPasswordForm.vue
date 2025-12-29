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
  <div v-if="success" class="text-center py-4">
    <div class="w-16 h-16 bg-success-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <Check class="w-8 h-8 text-success-500" />
    </div>
    <h2 class="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
    <p class="text-gray-600">
      If an account exists for <strong>{{ email }}</strong>, we've sent a password reset link.
    </p>
  </div>

  <!-- Form -->
  <form v-else @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Error Alert -->
    <div v-if="error" class="bg-danger-500/10 text-danger-500 rounded-lg p-3 flex items-start gap-2 text-sm">
      <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span>{{ error }}</span>
    </div>
    
    <!-- Email -->
    <div class="space-y-2">
      <label for="email" class="block text-sm font-medium text-gray-700">
        Email
      </label>
      <div class="relative">
        <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
      <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
      {{ loading ? 'Sending...' : 'Send reset link' }}
    </Button>
  </form>
</template>
