import { renderHook, act } from '@testing-library/react';
import { useEventSystem } from '../useEventSystem';
import { EventSystem } from '../../core/eventSystem';

describe('useEventSystem', () => {
  beforeEach(() => {
    // Reset the EventSystem singleton before each test
    (EventSystem as any).instance = null;
  });

  it('should return the same event system instance', () => {
    const { result: result1 } = renderHook(() => useEventSystem());
    const { result: result2 } = renderHook(() => useEventSystem());

    expect(result1.current).toBeTruthy();
    expect(result2.current).toBeTruthy();
    expect(EventSystem.getInstance()).toBe(EventSystem.getInstance());
  });

  it('should subscribe and emit events', () => {
    const { result } = renderHook(() => useEventSystem());
    const handler = jest.fn();
    const payload = { level: 1.5 };

    act(() => {
      result.current.subscribe('canvas.zoom', handler);
      result.current.emit('canvas.zoom', payload);
    });

    expect(handler).toHaveBeenCalledWith(payload);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle debounced events', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useEventSystem());
    const handler = jest.fn();
    const payload = { level: 1.5 };

    act(() => {
      result.current.subscribe('canvas.zoom', handler);
      result.current.emitDebounced('canvas.zoom', payload, 100);
      result.current.emitDebounced('canvas.zoom', payload, 100);
      result.current.emitDebounced('canvas.zoom', payload, 100);
    });

    expect(handler).not.toHaveBeenCalled();

    act(() => {
      jest.runAllTimers();
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload);

    jest.useRealTimers();
  });

  it('should unsubscribe when component unmounts', () => {
    const handler = jest.fn();
    const payload = { level: 1.5 };

    const { unmount } = renderHook(() => {
      const { useSubscription } = useEventSystem();
      useSubscription('canvas.zoom', handler);
    });

    // Get the event system instance directly
    const eventSystem = EventSystem.getInstance();

    // Verify the handler is subscribed
    expect(eventSystem.getHandlerCount('canvas.zoom')).toBe(1);

    // Unmount the component
    unmount();

    // Verify the handler is unsubscribed
    expect(eventSystem.getHandlerCount('canvas.zoom')).toBe(0);

    // Emit an event to verify the handler is not called
    eventSystem.emit('canvas.zoom', payload);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple subscriptions', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const payload = { level: 1.5 };

    const { result } = renderHook(() => useEventSystem());

    act(() => {
      result.current.subscribe('canvas.zoom', handler1);
      result.current.subscribe('canvas.zoom', handler2);
      result.current.emit('canvas.zoom', payload);
    });

    expect(handler1).toHaveBeenCalledWith(payload);
    expect(handler2).toHaveBeenCalledWith(payload);
  });

  it('should maintain subscription during rerenders', () => {
    const handler = jest.fn();
    const payload = { level: 1.5 };

    const { result, rerender } = renderHook(() => {
      const { useSubscription } = useEventSystem();
      useSubscription('canvas.zoom', handler);
    });

    // Rerender the hook
    rerender();

    // Emit an event
    act(() => {
      EventSystem.getInstance().emit('canvas.zoom', payload);
    });

    // Handler should be called once despite rerender
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it('should handle errors in event handlers', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const errorHandler = () => {
      throw new Error('Test error');
    };

    const { result } = renderHook(() => useEventSystem());

    act(() => {
      result.current.subscribe('canvas.zoom', errorHandler);
      result.current.emit('canvas.zoom', { level: 1.5 });
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});