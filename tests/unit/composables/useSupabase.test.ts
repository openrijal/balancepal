import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';
import { useSupabase } from '@/composables/useSupabase';
import { supabaseKey } from '@/types/injection-keys';
import { inject } from 'vue';

// Mock vue inject
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    inject: vi.fn(),
  };
});

describe('useSupabase', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns supabase client when injected successfully', () => {
    const mockClient = { auth: {} };
    (inject as unknown as Mock).mockReturnValue(mockClient);

    const client = useSupabase();
    expect(client).toBe(mockClient);
    expect(inject).toHaveBeenCalledWith(supabaseKey);
  });

  it('throws error when not provided', () => {
    (inject as unknown as Mock).mockReturnValue(undefined);

    expect(() => useSupabase()).toThrow('useSupabase() must be used within an <AppProvider>');
  });
});
