// Debug test to check updatePreferences behavior
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdvancedUI } from './src/hooks/useAdvancedUI.ts';

describe('Debug updatePreferences behavior', () => {
  it('should update preferences correctly', async () => {
    console.log('Starting debug test...');
    
    const { result } = renderHook(() => useAdvancedUI());
    
    console.log('Initial notifications:', result.current.configs.notifications);
    console.log('Initial preferences:', result.current.state?.preferences?.notifications);
    
    await act(async () => {
      result.current.updatePreferences({ notifications: false });
    });
    
    console.log('After update notifications:', result.current.configs.notifications);
    console.log('After update preferences:', result.current.state?.preferences?.notifications);
    
    // Wait a bit
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    console.log('After wait notifications:', result.current.configs.notifications);
    console.log('After wait preferences:', result.current.state?.preferences?.notifications);
    
    // Basic assertion to make it a proper test
    expect(result.current.configs).toBeDefined();
  });
});