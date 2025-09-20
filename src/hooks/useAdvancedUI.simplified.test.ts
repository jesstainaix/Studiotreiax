import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdvancedUISimplified } from './useAdvancedUI.simplified';

describe('useAdvancedUISimplified', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize correctly', () => {
    const { result } = renderHook(() => useAdvancedUISimplified());

    expect(result.current.initialized).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.themes).toHaveLength(1);
    expect(result.current.themes[0].id).toBe('light');
    expect(result.current.components).toEqual([]);
  });

  it('should provide computed values', () => {
    const { result } = renderHook(() => useAdvancedUISimplified());

    expect(result.current.totalComponents).toBe(0);
    expect(result.current.activeComponents).toBe(0);
    expect(result.current.systemHealth).toBe(85);
  });

  it('should provide theme actions', () => {
    const { result } = renderHook(() => useAdvancedUISimplified());

    expect(typeof result.current.setTheme).toBe('function');
    expect(typeof result.current.addTheme).toBe('function');
  });

  it('should provide component actions', () => {
    const { result } = renderHook(() => useAdvancedUISimplified());

    expect(typeof result.current.addComponent).toBe('function');
    expect(typeof result.current.updateComponent).toBe('function');
    expect(typeof result.current.removeComponent).toBe('function');
  });

  it('should provide layout and animation actions', () => {
    const { result } = renderHook(() => useAdvancedUISimplified());

    expect(typeof result.current.addLayout).toBe('function');
    expect(typeof result.current.addAnimation).toBe('function');
  });

  it('should provide preferences action', () => {
    const { result } = renderHook(() => useAdvancedUISimplified());

    expect(typeof result.current.updatePreferences).toBe('function');
  });

  it('should handle consistent hook calls', () => {
    const { result, rerender } = renderHook(() => useAdvancedUISimplified());
    
    const initialHookCount = Object.keys(result.current).length;
    
    // Re-render multiple times
    rerender();
    rerender();
    rerender();
    
    const finalHookCount = Object.keys(result.current).length;
    
    expect(finalHookCount).toBe(initialHookCount);
    expect(result.current.initialized).toBe(true);
  });

  it('should maintain stable references', () => {
    const { result, rerender } = renderHook(() => useAdvancedUISimplified());
    
    const initialSetTheme = result.current.setTheme;
    const initialAddComponent = result.current.addComponent;
    
    rerender();
    
    expect(result.current.setTheme).toBe(initialSetTheme);
    expect(result.current.addComponent).toBe(initialAddComponent);
  });
});