import { realtimeService } from '../realtimeService';

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('RealtimeService', () => {
  beforeEach(() => {
    // Reset service state
    if (realtimeService.disconnect) {
      realtimeService.disconnect();
    }
  });

  afterEach(() => {
    if (realtimeService.disconnect) {
      realtimeService.disconnect();
    }
  });

  describe('Basic Functionality', () => {
    test('should exist and have required methods', () => {
      expect(realtimeService).toBeDefined();
      expect(typeof realtimeService.connect).toBe('function');
      expect(typeof realtimeService.disconnect).toBe('function');
      expect(typeof realtimeService.send).toBe('function');
    });

    test('should connect successfully', async () => {
      await expect(realtimeService.connect('test-project', 'test-user')).resolves.not.toThrow();
    });

    test('should send messages without throwing', () => {
      expect(() => {
        realtimeService.send('test_message', { data: 'test' });
      }).not.toThrow();
    });

    test('should disconnect without throwing', async () => {
      await expect(realtimeService.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Event Handling', () => {
    test('should handle event listeners', () => {
      expect(() => {
        realtimeService.on('test_event', () => {});
        realtimeService.off('test_event', () => {});
      }).not.toThrow();
    });
  });
});