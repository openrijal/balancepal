import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@supabase/supabase-js';

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('should have null user initially', () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
    });

    it('should have null profile initially', () => {
      const store = useAuthStore();
      expect(store.profile).toBeNull();
    });

    it('should have loading true initially', () => {
      const store = useAuthStore();
      expect(store.loading).toBe(true);
    });

    it('should have null error initially', () => {
      const store = useAuthStore();
      expect(store.error).toBeNull();
    });
  });

  describe('getters', () => {
    it('isAuthenticated should return false when user is null', () => {
      const store = useAuthStore();
      expect(store.isAuthenticated).toBe(false);
    });

    it('isAuthenticated should return true when user exists', () => {
      const store = useAuthStore();
      store.setUser({ id: 'user-123' } as User);
      expect(store.isAuthenticated).toBe(true);
    });

    it('userId should return null when user is null', () => {
      const store = useAuthStore();
      expect(store.userId).toBeNull();
    });

    it('userId should return user id when user exists', () => {
      const store = useAuthStore();
      store.setUser({ id: 'user-123' } as User);
      expect(store.userId).toBe('user-123');
    });

    it('userEmail should return null when both user and profile are null', () => {
      const store = useAuthStore();
      expect(store.userEmail).toBeNull();
    });

    it('userEmail should return user email when user exists', () => {
      const store = useAuthStore();
      store.setUser({ id: 'user-123', email: 'test@example.com' } as User);
      expect(store.userEmail).toBe('test@example.com');
    });

    it('userEmail should return profile email as fallback', () => {
      const store = useAuthStore();
      store.setProfile({
        id: 'user-123',
        email: 'profile@example.com',
        name: 'Test User',
        profilePictureUrl: null,
        createdAt: new Date().toISOString(),
      });
      expect(store.userEmail).toBe('profile@example.com');
    });

    it('userName should return "User" when no user or profile exists', () => {
      const store = useAuthStore();
      expect(store.userName).toBe('User');
    });

    it('userName should return profile name when profile exists', () => {
      const store = useAuthStore();
      store.setProfile({
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
        profilePictureUrl: null,
        createdAt: new Date().toISOString(),
      });
      expect(store.userName).toBe('John Doe');
    });

    it('userName should return email prefix when only user email exists', () => {
      const store = useAuthStore();
      store.setUser({ id: 'user-123', email: 'johndoe@example.com' } as User);
      expect(store.userName).toBe('johndoe');
    });

    it('userAvatar should return null when no profile exists', () => {
      const store = useAuthStore();
      expect(store.userAvatar).toBeNull();
    });

    it('userAvatar should return profile picture url when profile exists', () => {
      const store = useAuthStore();
      store.setProfile({
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
        profilePictureUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date().toISOString(),
      });
      expect(store.userAvatar).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('actions', () => {
    describe('setUser', () => {
      it('should set user and set loading to false', () => {
        const store = useAuthStore();
        const mockUser = { id: 'user-123', email: 'test@example.com' } as User;

        store.setUser(mockUser);

        expect(store.user).toEqual(mockUser);
        expect(store.loading).toBe(false);
      });

      it('should handle null user', () => {
        const store = useAuthStore();
        store.setUser({ id: 'user-123' } as User);

        store.setUser(null);

        expect(store.user).toBeNull();
        expect(store.loading).toBe(false);
      });
    });

    describe('setProfile', () => {
      it('should set profile', () => {
        const store = useAuthStore();
        const mockProfile = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'John Doe',
          profilePictureUrl: 'https://example.com/avatar.jpg',
          createdAt: new Date().toISOString(),
        };

        store.setProfile(mockProfile);

        expect(store.profile).toEqual(mockProfile);
      });

      it('should handle null profile', () => {
        const store = useAuthStore();
        store.setProfile({
          id: 'user-123',
          email: 'test@example.com',
          name: 'John Doe',
          profilePictureUrl: null,
          createdAt: new Date().toISOString(),
        });

        store.setProfile(null);

        expect(store.profile).toBeNull();
      });
    });

    describe('setLoading', () => {
      it('should set loading state', () => {
        const store = useAuthStore();

        store.setLoading(false);
        expect(store.loading).toBe(false);

        store.setLoading(true);
        expect(store.loading).toBe(true);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        const store = useAuthStore();

        store.setError('Something went wrong');

        expect(store.error).toBe('Something went wrong');
      });

      it('should handle null error', () => {
        const store = useAuthStore();
        store.setError('Error');

        store.setError(null);

        expect(store.error).toBeNull();
      });
    });

    describe('clearAuth', () => {
      it('should clear all auth state', () => {
        const store = useAuthStore();
        store.setUser({ id: 'user-123', email: 'test@example.com' } as User);
        store.setProfile({
          id: 'user-123',
          email: 'test@example.com',
          name: 'John Doe',
          profilePictureUrl: null,
          createdAt: new Date().toISOString(),
        });
        store.setError('Some error');

        store.clearAuth();

        expect(store.user).toBeNull();
        expect(store.profile).toBeNull();
        expect(store.error).toBeNull();
      });
    });
  });
});
