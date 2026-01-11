import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  describe('basic class merging', () => {
    it('should return empty string for no arguments', () => {
      expect(cn()).toBe('');
    });

    it('should return single class unchanged', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('should merge multiple classes', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    it('should handle array of classes', () => {
      expect(cn(['text-red-500', 'bg-blue-500'])).toBe('text-red-500 bg-blue-500');
    });
  });

  describe('conditional classes with clsx', () => {
    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active')).toBe('base active');
    });

    it('should filter out false values', () => {
      expect(cn('base', false && 'hidden')).toBe('base');
    });

    it('should handle object syntax', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });

    it('should handle undefined values', () => {
      expect(cn('base', undefined, 'other')).toBe('base other');
    });

    it('should handle null values', () => {
      expect(cn('base', null, 'other')).toBe('base other');
    });
  });

  describe('tailwind merge functionality', () => {
    it('should merge conflicting padding classes', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
    });

    it('should merge conflicting margin classes', () => {
      expect(cn('m-2', 'm-4')).toBe('m-4');
    });

    it('should merge conflicting text color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should merge conflicting background color classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('should keep non-conflicting classes', () => {
      expect(cn('p-4', 'm-4')).toBe('p-4 m-4');
    });

    it('should handle complex tailwind class conflicts', () => {
      expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
    });

    it('should merge font size classes', () => {
      expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    });

    it('should merge flex direction classes', () => {
      expect(cn('flex-row', 'flex-col')).toBe('flex-col');
    });
  });

  describe('combined clsx and tailwind-merge', () => {
    it('should handle conditional with merge', () => {
      const isActive = true;
      expect(cn('p-4 text-gray-500', isActive && 'p-6 text-blue-500')).toBe('p-6 text-blue-500');
    });

    it('should handle object syntax with merge', () => {
      expect(cn('p-4', { 'p-8': true, 'text-red-500': false })).toBe('p-8');
    });

    it('should handle mixed inputs with merge', () => {
      const result = cn('base p-4', ['text-sm', 'm-2'], { 'p-8': true });
      expect(result).toContain('base');
      expect(result).toContain('text-sm');
      expect(result).toContain('m-2');
      expect(result).toContain('p-8');
      expect(result).not.toContain('p-4');
    });
  });
});
