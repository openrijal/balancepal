import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUIStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have null activeModal initially', () => {
      const store = useUIStore();
      expect(store.activeModal).toBeNull();
    });

    it('should have null modalData initially', () => {
      const store = useUIStore();
      expect(store.modalData).toBeNull();
    });

    it('should have sidebarOpen false initially', () => {
      const store = useUIStore();
      expect(store.sidebarOpen).toBe(false);
    });

    it('should have empty toasts array initially', () => {
      const store = useUIStore();
      expect(store.toasts).toEqual([]);
    });
  });

  describe('modal actions', () => {
    describe('openModal', () => {
      it('should set activeModal type', () => {
        const store = useUIStore();

        store.openModal('add-expense');

        expect(store.activeModal).toBe('add-expense');
      });

      it('should set modalData when provided', () => {
        const store = useUIStore();
        const data = { groupId: 'group-123', userId: 'user-456' };

        store.openModal('edit-expense', data);

        expect(store.activeModal).toBe('edit-expense');
        expect(store.modalData).toEqual(data);
      });

      it('should set modalData to null when not provided', () => {
        const store = useUIStore();
        store.openModal('create-group', { someData: 'value' });

        store.openModal('add-expense');

        expect(store.modalData).toBeNull();
      });
    });

    describe('closeModal', () => {
      it('should set activeModal to null', () => {
        const store = useUIStore();
        store.openModal('add-expense');

        store.closeModal();

        expect(store.activeModal).toBeNull();
      });

      it('should clear modalData', () => {
        const store = useUIStore();
        store.openModal('edit-expense', { expenseId: 'exp-123' });

        store.closeModal();

        expect(store.modalData).toBeNull();
      });
    });
  });

  describe('sidebar actions', () => {
    describe('toggleSidebar', () => {
      it('should toggle sidebar from false to true', () => {
        const store = useUIStore();

        store.toggleSidebar();

        expect(store.sidebarOpen).toBe(true);
      });

      it('should toggle sidebar from true to false', () => {
        const store = useUIStore();
        store.setSidebarOpen(true);

        store.toggleSidebar();

        expect(store.sidebarOpen).toBe(false);
      });
    });

    describe('setSidebarOpen', () => {
      it('should set sidebar to open', () => {
        const store = useUIStore();

        store.setSidebarOpen(true);

        expect(store.sidebarOpen).toBe(true);
      });

      it('should set sidebar to closed', () => {
        const store = useUIStore();
        store.setSidebarOpen(true);

        store.setSidebarOpen(false);

        expect(store.sidebarOpen).toBe(false);
      });
    });
  });

  describe('toast actions', () => {
    describe('addToast', () => {
      it('should add a toast with generated id', () => {
        const store = useUIStore();

        store.addToast({ type: 'success', title: 'Success!' });

        expect(store.toasts).toHaveLength(1);
        expect(store.toasts[0].type).toBe('success');
        expect(store.toasts[0].title).toBe('Success!');
        expect(store.toasts[0].id).toBeDefined();
      });

      it('should add toast with optional message', () => {
        const store = useUIStore();

        store.addToast({ type: 'error', title: 'Error', message: 'Something went wrong' });

        expect(store.toasts[0].message).toBe('Something went wrong');
      });

      it('should auto-remove toast after default duration', () => {
        const store = useUIStore();

        store.addToast({ type: 'info', title: 'Info' });

        expect(store.toasts).toHaveLength(1);

        vi.advanceTimersByTime(5000);

        expect(store.toasts).toHaveLength(0);
      });

      it('should auto-remove toast after custom duration', () => {
        const store = useUIStore();

        store.addToast({ type: 'warning', title: 'Warning', duration: 2000 });

        expect(store.toasts).toHaveLength(1);

        vi.advanceTimersByTime(2000);

        expect(store.toasts).toHaveLength(0);
      });

      it('should return the toast id', () => {
        const store = useUIStore();

        const id = store.addToast({ type: 'success', title: 'Test' });

        expect(typeof id).toBe('string');
        expect(store.toasts[0].id).toBe(id);
      });
    });

    describe('removeToast', () => {
      it('should remove toast by id', () => {
        const store = useUIStore();
        const id = store.addToast({ type: 'success', title: 'Test' });

        store.removeToast(id);

        expect(store.toasts).toHaveLength(0);
      });

      it('should only remove the specified toast', () => {
        const store = useUIStore();
        const id1 = store.addToast({ type: 'success', title: 'Toast 1' });
        store.addToast({ type: 'error', title: 'Toast 2' });

        store.removeToast(id1);

        expect(store.toasts).toHaveLength(1);
        expect(store.toasts[0].title).toBe('Toast 2');
      });
    });

    describe('showSuccess', () => {
      it('should add success toast', () => {
        const store = useUIStore();

        store.showSuccess('Operation completed');

        expect(store.toasts).toHaveLength(1);
        expect(store.toasts[0].type).toBe('success');
        expect(store.toasts[0].title).toBe('Operation completed');
      });

      it('should add success toast with message', () => {
        const store = useUIStore();

        store.showSuccess('Success', 'Your changes were saved');

        expect(store.toasts[0].message).toBe('Your changes were saved');
      });
    });

    describe('showError', () => {
      it('should add error toast', () => {
        const store = useUIStore();

        store.showError('Something went wrong');

        expect(store.toasts).toHaveLength(1);
        expect(store.toasts[0].type).toBe('error');
        expect(store.toasts[0].title).toBe('Something went wrong');
      });

      it('should add error toast with message', () => {
        const store = useUIStore();

        store.showError('Error', 'Please try again');

        expect(store.toasts[0].message).toBe('Please try again');
      });
    });

    describe('showWarning', () => {
      it('should add warning toast', () => {
        const store = useUIStore();

        store.showWarning('Be careful');

        expect(store.toasts).toHaveLength(1);
        expect(store.toasts[0].type).toBe('warning');
        expect(store.toasts[0].title).toBe('Be careful');
      });
    });

    describe('showInfo', () => {
      it('should add info toast', () => {
        const store = useUIStore();

        store.showInfo('Did you know?');

        expect(store.toasts).toHaveLength(1);
        expect(store.toasts[0].type).toBe('info');
        expect(store.toasts[0].title).toBe('Did you know?');
      });
    });
  });
});
