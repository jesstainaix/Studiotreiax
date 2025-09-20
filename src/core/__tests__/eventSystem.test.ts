import { EventSystem } from '../eventSystem';

describe('EventSystem', () => {
  let eventSystem: EventSystem;

  beforeEach(() => {
    // Reset the singleton instance before each test
    (EventSystem as any).instance = null;
    eventSystem = EventSystem.getInstance();
  });

  afterEach(() => {
    eventSystem.removeAllHandlers();
  });

  it('should be a singleton', () => {
    const instance1 = EventSystem.getInstance();
    const instance2 = EventSystem.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should subscribe and emit events', () => {
    const handler = jest.fn();
    const payload = { level: 1.5 };

    eventSystem.subscribe('canvas.zoom', handler);
    eventSystem.emit('canvas.zoom', payload);

    expect(handler).toHaveBeenCalledWith(payload);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe from events', () => {
    const handler = jest.fn();
    const payload = { level: 1.5 };

    eventSystem.subscribe('canvas.zoom', handler);
    eventSystem.unsubscribe('canvas.zoom', handler);
    eventSystem.emit('canvas.zoom', payload);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple subscribers', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const payload = { level: 1.5 };

    eventSystem.subscribe('canvas.zoom', handler1);
    eventSystem.subscribe('canvas.zoom', handler2);
    eventSystem.emit('canvas.zoom', payload);

    expect(handler1).toHaveBeenCalledWith(payload);
    expect(handler2).toHaveBeenCalledWith(payload);
  });

  it('should return unsubscribe function from subscribe', () => {
    const handler = jest.fn();
    const payload = { level: 1.5 };

    const unsubscribe = eventSystem.subscribe('canvas.zoom', handler);
    unsubscribe();
    eventSystem.emit('canvas.zoom', payload);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle errors in event handlers', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const handler = () => {
      throw new Error('Test error');
    };

    eventSystem.subscribe('canvas.zoom', handler);
    eventSystem.emit('canvas.zoom', { level: 1.5 });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should debounce events', () => {
    jest.useFakeTimers();
    const handler = jest.fn();
    const payload = { level: 1.5 };

    eventSystem.subscribe('canvas.zoom', handler);
    eventSystem.emitDebounced('canvas.zoom', payload, 100);
    eventSystem.emitDebounced('canvas.zoom', payload, 100);
    eventSystem.emitDebounced('canvas.zoom', payload, 100);

    expect(handler).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload);

    jest.useRealTimers();
  });

  it('should get correct handler count', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    expect(eventSystem.getHandlerCount('canvas.zoom')).toBe(0);

    eventSystem.subscribe('canvas.zoom', handler1);
    expect(eventSystem.getHandlerCount('canvas.zoom')).toBe(1);

    eventSystem.subscribe('canvas.zoom', handler2);
    expect(eventSystem.getHandlerCount('canvas.zoom')).toBe(2);

    eventSystem.unsubscribe('canvas.zoom', handler1);
    expect(eventSystem.getHandlerCount('canvas.zoom')).toBe(1);
  });

  it('should remove all handlers', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    eventSystem.subscribe('canvas.zoom', handler1);
    eventSystem.subscribe('canvas.pan', handler2);

    eventSystem.removeAllHandlers();

    expect(eventSystem.getHandlerCount('canvas.zoom')).toBe(0);
    expect(eventSystem.getHandlerCount('canvas.pan')).toBe(0);
  });
});