import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AppProvider from '@/components/providers/AppProvider.vue';
import { supabaseKey, authKey } from '@/types/injection-keys';

describe('AppProvider', () => {
    it('provides supabase client and auth state', () => {
        // Mock getSupabaseBrowserClient
        vi.mock('@/lib/supabase-browser', () => ({
            getSupabaseBrowserClient: vi.fn(() => ({
                auth: {
                    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
                    onAuthStateChange: vi
                        .fn()
                        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
                },
            })),
        }));

        const wrapper = mount(AppProvider, {
            props: {
                supabaseUrl: 'https://example.supabase.co',
                supabaseAnonKey: 'anon-key',
            },
            slots: {
                default: '<div class="child">Child</div>',
            },
        });

        const child = wrapper.find('.child');
        expect(child.exists()).toBe(true);

        // We can't easily check 'provide' directly from wrapper using VTU 2/3 easily without injecting in a child
        // So we use a spy or check internal instance (implementation detail)
        // Or better, define a component using inject and mount that as slot
    });

    it('injects dependencies into child component', () => {
        const ChildComponent = {
            template: '<div>Child</div>',
            inject: {
                supabase: { from: supabaseKey },
                auth: { from: authKey },
            },
        };

        const wrapper = mount(AppProvider, {
            props: {
                supabaseUrl: 'https://test.supabase.co',
                supabaseAnonKey: 'key',
            },
            slots: {
                default: ChildComponent,
            },
        });

        const childWrapper = wrapper.findComponent(ChildComponent);
        expect(childWrapper.vm.supabase).toBeDefined();
        expect(childWrapper.vm.auth).toBeDefined();
    });
});
