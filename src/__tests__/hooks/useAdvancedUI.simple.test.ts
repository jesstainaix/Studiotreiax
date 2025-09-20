/**
 * Teste simples para verificar hooks inconsistentes
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdvancedUI } from '../../hooks/useAdvancedUI';

describe('useAdvancedUI Hook - Teste Simples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar sem erros de hooks', () => {
    const { result } = renderHook(() => useAdvancedUI());

    expect(result.current).toBeDefined();
    expect(result.current.components).toEqual([]);
    expect(result.current.tours).toEqual([]);
  });

  it('deve manter hooks consistentes em re-renders', () => {
    const { result, rerender } = renderHook(() => useAdvancedUI());

    // Primeiro render
    expect(result.current.components).toEqual([]);
    
    // Re-render
    rerender();
    
    // Deve manter a mesma estrutura
    expect(result.current.components).toEqual([]);
    expect(result.current.tours).toEqual([]);
  });

  it('deve executar ação simples sem erro de hooks', async () => {
    const { result } = renderHook(() => useAdvancedUI());

    await act(async () => {
      result.current.actions.setFilters({ search: 'test' });
    });

    // Deve completar sem erro
    expect(result.current).toBeDefined();
  });
});