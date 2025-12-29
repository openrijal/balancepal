<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Mail, Lock, User, Check } from 'lucide-vue-next';

// Form state
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const supabase = useSupabase();

// Password strength
const passwordStrength = computed(() => {
  const pwd = password.value;
  if (!pwd) return { score: 0, label: '', color: '' };

  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-danger-500' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-warning-500' };
  return { score, label: 'Strong', color: 'bg-success-500' };
});

async function handleSubmit() {
  // Validation
  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields';
    return;
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // Sign up
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          name: name.value,
        },
      },
    });

    if (authError) {
      error.value = authError.message;
      return;
    }

    if (data.user) {
      // Create profile in database
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: email.value,
        name: name.value,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue anyway, profile can be created later
      }

      // Check if email confirmation is required
      if (data.session) {
        // Immediate login (no email confirmation required)
        window.location.href = '/dashboard';
      } else {
        // Email confirmation required
        success.value = true;
      }
    }
  } catch (err) {
    error.value = 'An unexpected error occurred. Please try again.';
    console.error('Signup error:', err);
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
    <p class="mb-4 text-gray-600">
      We've sent a confirmation link to <strong>{{ email }}</strong>
    </p>
    <a href="/login" class="text-primary-600 hover:text-primary-700 font-medium"> Back to login </a>
  </div>

  <!-- Signup Form -->
  <form v-else class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Error Alert -->
    <div
      v-if="error"
      class="bg-danger-500/10 text-danger-500 flex items-start gap-2 rounded-lg p-3 text-sm"
    >
      <AlertCircle class="mt-0.5 h-5 w-5 flex-shrink-0" />
      <span>{{ error }}</span>
    </div>

    <!-- Name -->
    <div class="space-y-2">
      <label for="name" class="block text-sm font-medium text-gray-700"> Full name </label>
      <div class="relative">
        <User class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          id="name"
          v-model="name"
          type="text"
          placeholder="John Doe"
          class="pl-10"
          required
          :disabled="loading"
        />
      </div>
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
      <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
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
      <!-- Password Strength -->
      <div v-if="password" class="flex items-center gap-2">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            class="h-full transition-all duration-300"
            :class="passwordStrength.color"
            :style="{ width: `${(passwordStrength.score / 5) * 100}%` }"
          />
        </div>
        <span class="text-xs font-medium" :class="passwordStrength.color.replace('bg-', 'text-')">
          {{ passwordStrength.label }}
        </span>
      </div>
    </div>

    <!-- Confirm Password -->
    <div class="space-y-2">
      <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
        Confirm password
      </label>
      <div class="relative">
        <Lock class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          id="confirmPassword"
          v-model="confirmPassword"
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
      {{ loading ? 'Creating account...' : 'Create account' }}
    </Button>

    <!-- Terms -->
    <p class="text-center text-xs text-gray-500">
      By signing up, you agree to our
      <a href="/terms" class="text-primary-600 hover:underline">Terms of Service</a>
      and
      <a href="/privacy" class="text-primary-600 hover:underline">Privacy Policy</a>
    </p>
  </form>
</template>
