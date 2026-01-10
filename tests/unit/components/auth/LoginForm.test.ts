import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginForm from '@/components/auth/LoginForm.vue';
import { supabaseKey } from '@/types/injection-keys';

describe('LoginForm', () => {
  it('calls sign in with correct credentials', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      data: { session: { user: { id: '1' } } },
      error: null,
    });
    const mockSupabase = {
      auth: {
        signInWithPassword: mockSignIn,
      },
    };

    const wrapper = mount(LoginForm, {
      global: {
        provide: {
          [supabaseKey as symbol]: mockSupabase,
        },
      },
    });

    const emailInput = wrapper.find('#email');
    const passwordInput = wrapper.find('#password');

    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('password123');
    await wrapper.find('form').trigger('submit');

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
