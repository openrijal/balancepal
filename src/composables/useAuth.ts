/**
 * Composable to inject Auth state
 */
import { inject } from 'vue';
import { authKey, type AuthState } from '@/types/injection-keys';

export function useAuth(): AuthState {
    const auth = inject(authKey);

    if (!auth) {
        throw new Error('useAuth() must be used within an <AppProvider>');
    }

    return auth;
}
