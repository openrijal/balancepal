import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SignupForm from '@/components/auth/SignupForm.vue';
import { supabaseKey } from '@/types/injection-keys';

describe('SignupForm', () => {
    it('validates passwords match', async () => {
        // Mock useSupabase injection
        const mockSupabase = {
            auth: {
                signUp: vi.fn(),
            },
        };

        const wrapper = mount(SignupForm, {
            global: {
                provide: {
                    [supabaseKey as symbol]: mockSupabase,
                },
                stubs: {
                    // Stub UI components if needed or deep mount
                },
            },
        });

        const nameInput = wrapper.find('#name');
        const emailInput = wrapper.find('#email');
        const passwordInput = wrapper.find('#password');
        const confirmInput = wrapper.find('#confirmPassword');

        await nameInput.setValue('John Doe');
        await emailInput.setValue('john@example.com');

        await passwordInput.setValue('password123');
        await confirmInput.setValue('different123');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.text()).toContain('Passwords do not match');
        expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });
});
