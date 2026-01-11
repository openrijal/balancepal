import { describe, it, expect, vi } from 'vitest';
import { useAuth } from '@/composables/useAuth';
import { authKey } from '@/types/injection-keys';
import * as vue from 'vue';

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    inject: vi.fn(),
  };
});

describe('useAuth', () => {
  it('should return auth state when AppProvider is present', () => {
    const mockAuthState = {
      user: { value: { id: 'user-123', email: 'test@example.com' } },
      profile: { value: null },
      loading: { value: false },
      error: { value: null },
      isAuthenticated: { value: true },
    };

    vi.mocked(vue.inject).mockReturnValue(mockAuthState);

    const result = useAuth();

    expect(vue.inject).toHaveBeenCalledWith(authKey);
    expect(result).toBe(mockAuthState);
  });

  it('should throw error when used outside AppProvider', () => {
    vi.mocked(vue.inject).mockReturnValue(undefined);

    expect(() => useAuth()).toThrow('useAuth() must be used within an <AppProvider>');
  });

  it('should throw error when inject returns null', () => {
    vi.mocked(vue.inject).mockReturnValue(null);

    expect(() => useAuth()).toThrow('useAuth() must be used within an <AppProvider>');
  });
});
