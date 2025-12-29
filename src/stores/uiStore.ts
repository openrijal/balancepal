/**
 * UI Store - Manages global UI state
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ModalType =
    | 'add-expense'
    | 'edit-expense'
    | 'create-group'
    | 'edit-group'
    | 'invite-member'
    | 'record-settlement'
    | 'confirm-delete'
    | null;

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

export const useUIStore = defineStore('ui', () => {
    // State
    const activeModal = ref<ModalType>(null);
    const modalData = ref<Record<string, unknown> | null>(null);
    const sidebarOpen = ref(false);
    const toasts = ref<Toast[]>([]);

    // Actions
    function openModal(type: ModalType, data?: Record<string, unknown>) {
        activeModal.value = type;
        modalData.value = data ?? null;
    }

    function closeModal() {
        activeModal.value = null;
        modalData.value = null;
    }

    function toggleSidebar() {
        sidebarOpen.value = !sidebarOpen.value;
    }

    function setSidebarOpen(open: boolean) {
        sidebarOpen.value = open;
    }

    function addToast(toast: Omit<Toast, 'id'>) {
        const id = crypto.randomUUID();
        toasts.value.push({ ...toast, id });

        // Auto remove after duration
        const duration = toast.duration ?? 5000;
        setTimeout(() => {
            removeToast(id);
        }, duration);

        return id;
    }

    function removeToast(id: string) {
        toasts.value = toasts.value.filter(t => t.id !== id);
    }

    function showSuccess(title: string, message?: string) {
        return addToast({ type: 'success', title, message });
    }

    function showError(title: string, message?: string) {
        return addToast({ type: 'error', title, message });
    }

    function showWarning(title: string, message?: string) {
        return addToast({ type: 'warning', title, message });
    }

    function showInfo(title: string, message?: string) {
        return addToast({ type: 'info', title, message });
    }

    return {
        // State
        activeModal,
        modalData,
        sidebarOpen,
        toasts,
        // Actions
        openModal,
        closeModal,
        toggleSidebar,
        setSidebarOpen,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };
});
