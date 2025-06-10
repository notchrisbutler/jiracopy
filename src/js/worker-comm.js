/**
 * Worker Communication - Handles Web Worker messaging for markdown processing
 */

import { Utils } from './utils.js';

export class WorkerComm {
  constructor(workerPath) {
    this.workerPath = workerPath;
    this.worker = null;
    this.messageQueue = new Map();
    this.messageId = 0;
    this.isReady = false;
    this.onError = null;
  }

  /**
   * Initialize Web Worker
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Create worker
      this.worker = new Worker(this.workerPath, { type: 'module' });
      
      // Set up message handler
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      
      // Set up error handler
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      // Wait for worker to be ready
      await this.waitForWorkerReady();
      
      console.log('✅ Web Worker initialized');
    } catch (error) {
      console.warn('⚠️ Web Worker initialization failed:', error);
      // Don't throw - app should work without worker
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Wait for worker ready signal
   * @returns {Promise<void>}
   */
  waitForWorkerReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker initialization timeout'));
      }, 5000);

      const checkReady = (event) => {
        if (event.data.type === 'WORKER_READY') {
          clearTimeout(timeout);
          this.worker.removeEventListener('message', checkReady);
          this.isReady = true;
          resolve();
        }
      };

      this.worker.addEventListener('message', checkReady);
    });
  }

  /**
   * Send message to worker with response handling
   * @param {string} type - Message type
   * @param {Object} payload - Message payload
   * @param {number} timeout - Response timeout (ms)
   * @returns {Promise<Object>} Worker response
   */
  async sendMessage(type, payload, timeout = 5000) {
    if (!this.worker || !this.isReady) {
      throw new Error('Worker not available');
    }

    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.messageQueue.delete(messageId);
        reject(new Error('Worker response timeout'));
      }, timeout);

      // Store message handler
      this.messageQueue.set(messageId, {
        resolve,
        reject,
        timeoutId,
        timestamp: Date.now()
      });

      // Send message to worker
      this.worker.postMessage({
        id: messageId,
        type,
        payload,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Handle incoming messages from worker
   * @param {MessageEvent} event - Worker message event
   */
  handleWorkerMessage(event) {
    const { id, type, payload, error } = event.data;

    // Handle worker ready signal
    if (type === 'WORKER_READY') {
      this.isReady = true;
      return;
    }

    // Handle response messages
    const messageHandler = this.messageQueue.get(id);
    if (messageHandler) {
      clearTimeout(messageHandler.timeoutId);
      this.messageQueue.delete(id);

      if (error) {
        messageHandler.reject(new Error(error));
      } else {
        messageHandler.resolve(payload);
      }
    }
  }

  /**
   * Handle worker errors
   * @param {ErrorEvent} event - Error event
   */
  handleWorkerError(event) {
    console.error('Web Worker error:', event);
    
    // Reject all pending messages
    for (const [id, handler] of this.messageQueue) {
      clearTimeout(handler.timeoutId);
      handler.reject(new Error('Worker error: ' + event.message));
    }
    this.messageQueue.clear();

    // Call error handler if set
    if (this.onError) {
      this.onError(event.error || new Error(event.message));
    }
  }

  /**
   * Generate unique message ID
   * @returns {string} Message ID
   */
  generateMessageId() {
    return `msg-${++this.messageId}-${Date.now()}`;
  }

  /**
   * Check if worker is available
   * @returns {boolean} Worker availability
   */
  isAvailable() {
    return !!(this.worker && this.isReady);
  }

  /**
   * Get worker statistics
   * @returns {Object} Worker stats
   */
  getStats() {
    return {
      isReady: this.isReady,
      pendingMessages: this.messageQueue.size,
      workerPath: this.workerPath
    };
  }

  /**
   * Terminate worker and cleanup
   */
  terminate() {
    if (this.worker) {
      // Reject all pending messages
      for (const [id, handler] of this.messageQueue) {
        clearTimeout(handler.timeoutId);
        handler.reject(new Error('Worker terminated'));
      }
      this.messageQueue.clear();

      // Terminate worker
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
} 