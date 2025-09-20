import { EditorEventSystem } from '../eventSystem';
import { EditorEvent, EventPriority } from '../../types/editor';

describe('EditorEventSystem', () => {
  let eventSystem: EditorEventSystem;

  beforeEach(() => {
    eventSystem = EditorEventSystem.getInstance();
    eventSystem.clear();
  });

  afterEach(() => {
    eventSystem.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EditorEventSystem.getInstance();
      const instance2 = EditorEventSystem.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Event Subscription and Emission', () => {
    it('should subscribe and emit events correctly', () => {
      const mockHandler = jest.fn();
      const testEvent: EditorEvent = {
        type: 'canvas:element:add',
        payload: { elementId: 'test-element' },
        timestamp: Date.now(),
        source: 'test'
      };

      eventSystem.on('canvas:element:add', mockHandler);
      eventSystem.emit('canvas:element:add', testEvent.payload, testEvent.source);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'canvas:element:add',
          payload: testEvent.payload,
          source: testEvent.source
        })
      );
    });

    it('should handle multiple subscribers for the same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const payload = { test: 'data' };

      eventSystem.on('timeline:update', handler1);
      eventSystem.on('timeline:update', handler2);
      eventSystem.emit('timeline:update', payload);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should unsubscribe events correctly', () => {
      const mockHandler = jest.fn();
      
      const unsubscribe = eventSystem.on('canvas:element:remove', mockHandler);
      unsubscribe();
      eventSystem.emit('canvas:element:remove', { elementId: 'test' });

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Event Priority', () => {
    it('should handle high priority events first', (done) => {
      const executionOrder: string[] = [];
      
      eventSystem.on('test:priority', () => {
        executionOrder.push('normal');
      });
      
      eventSystem.on('test:priority', () => {
        executionOrder.push('high');
      }, EventPriority.HIGH);
      
      eventSystem.emit('test:priority', {});
      
      // Use setTimeout to allow async execution
      setTimeout(() => {
        expect(executionOrder).toEqual(['high', 'normal']);
        done();
      }, 0);
    });
  });

  describe('Batch Processing', () => {
    it('should process batched events', () => {
      const mockHandler = jest.fn();
      eventSystem.on('batch:test', mockHandler);

      eventSystem.startBatch();
      eventSystem.emit('batch:test', { id: 1 });
      eventSystem.emit('batch:test', { id: 2 });
      eventSystem.processBatch();

      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track event metrics', () => {
      const mockHandler = jest.fn();
      eventSystem.on('performance:test', mockHandler);
      
      eventSystem.emit('performance:test', {});
      
      const metrics = eventSystem.getMetrics();
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.eventCounts['performance:test']).toBe(1);
    });

    it('should measure average processing time', () => {
      const slowHandler = jest.fn(() => {
        // Simulate slow processing
        const start = Date.now();
        while (Date.now() - start < 10) {}
      });
      
      eventSystem.on('slow:test', slowHandler);
      eventSystem.emit('slow:test', {});
      
      const metrics = eventSystem.getMetrics();
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in event handlers gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalHandler = jest.fn();
      
      eventSystem.on('error:test', errorHandler);
      eventSystem.on('error:test', normalHandler);
      
      expect(() => {
        eventSystem.emit('error:test', {});
      }).not.toThrow();
      
      expect(normalHandler).toHaveBeenCalled();
    });
  });
});