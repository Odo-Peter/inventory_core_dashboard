import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('resolves conflicting classes, keeping the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('supports conditional and object arguments', () => {
    const isActive = true;
    const isHidden = false;

    expect(cn('px-2 py-1', isActive && 'bg-blue-500', { 'text-white': isActive })).toBe(
      'px-2 py-1 bg-blue-500 text-white',
    );
    expect(cn('block', isHidden && 'hidden')).toBe('block');
  });

  it('ignores empty and undefined values', () => {
    expect(cn(undefined, null, false, '', 'gap-2')).toBe('gap-2');
  });

  it('lets a later className override the base classes', () => {
    const result = cn('rounded-md px-4 text-sm', 'rounded-lg px-8');

    expect(result).toContain('rounded-lg');
    expect(result).toContain('px-8');
    expect(result).toContain('text-sm');
    expect(result).not.toContain('rounded-md');
    expect(result).not.toContain('px-4');
  });
});
