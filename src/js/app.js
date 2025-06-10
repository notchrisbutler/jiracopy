/**
 * Jira Markdown to HTML Converter - Main Application
 * Initializes and coordinates all application modules
 */

import { UIController } from './ui-controller.js';
import { DOMManager } from './dom-manager.js';
import { ClipboardManager } from './clipboard-manager.js';
import { WorkerComm } from './worker-comm.js';
import { Utils } from './utils.js';

class JiraMarkdownApp {
  constructor() {
    this.isInitialized = false;
    this.modules = {};
    
    // Application state
    this.state = {
      isProcessing: false,
      hasContent: false,
      lastProcessingTime: 0,
      errorCount: 0
    };
    
    // Configuration
    this.config = {
      debounceDelay: 150,
      maxInputSize: 10000,
      workerTimeout: 5000,
      enableWebWorker: true
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Initializing Jira Markdown to HTML Converter...');
      
      // Check browser compatibility
      if (!this.checkCompatibility()) {
        this.showCompatibilityError();
        return;
      }

      // Initialize core modules
      await this.initializeModules();
      
      // Set up global error handling
      this.setupErrorHandling();
      
      // Set up keyboard accessibility
      this.setupAccessibility();
      
      // Mark app as initialized
      this.isInitialized = true;
      
      console.log('✅ Application initialized successfully');
      
      // Show ready state
      this.modules.ui.showStatus('Ready', 'success');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showInitializationError(error);
    }
  }

  /**
   * Check browser compatibility
   */
  checkCompatibility() {
    const requiredFeatures = {
      'Web Workers': typeof Worker !== 'undefined',
      'ES6 Modules': typeof Symbol !== 'undefined',
      'Promises': typeof Promise !== 'undefined',
      'Fetch API': typeof fetch !== 'undefined',
      'Local Storage': typeof localStorage !== 'undefined'
    };

    const missingFeatures = Object.entries(requiredFeatures)
      .filter(([name, supported]) => !supported)
      .map(([name]) => name);

    if (missingFeatures.length > 0) {
      console.warn('⚠️ Missing browser features:', missingFeatures);
      return false;
    }

    return true;
  }

  /**
   * Initialize all application modules
   */
  async initializeModules() {
    try {
      // Initialize DOM Manager first (no dependencies)
      this.modules.dom = new DOMManager();
      console.log('✅ DOM Manager initialized');

      // Initialize Clipboard Manager
      this.modules.clipboard = new ClipboardManager(this.modules.dom);
      console.log('✅ Clipboard Manager initialized');

      // Initialize Worker Communication
      if (this.config.enableWebWorker) {
        this.modules.worker = new WorkerComm('workers/markdown-worker.js');
        await this.modules.worker.init();
        console.log('✅ Web Worker initialized');
      }

      // Initialize UI Controller (coordinates other modules)
      this.modules.ui = new UIController({
        domManager: this.modules.dom,
        clipboardManager: this.modules.clipboard,
        workerComm: this.modules.worker,
        config: this.config
      });
      
      await this.modules.ui.init();
      console.log('✅ UI Controller initialized');

    } catch (error) {
      console.error('❌ Module initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up global error handling
   */
  setupErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleGlobalError(event.reason);
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      this.handleGlobalError(event.error);
    });

    // Handle Web Worker errors
    if (this.modules.worker) {
      this.modules.worker.onError = (error) => {
        console.error('Web Worker error:', error);
        this.handleWorkerError(error);
      };
    }
  }

  /**
   * Set up keyboard accessibility
   */
  setupAccessibility() {
    // Track keyboard navigation
    let isKeyboardUser = false;
    
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        isKeyboardUser = true;
        document.body.classList.add('keyboard-user');
      }
    });

    document.addEventListener('mousedown', () => {
      isKeyboardUser = false;
      document.body.classList.remove('keyboard-user');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Enter to copy HTML
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        this.modules.ui.handleCopyRequest();
      }
      
      // Escape to close modals
      if (event.key === 'Escape') {
        this.modules.ui.closeAllModals();
      }
    });

    // Announce dynamic content changes to screen readers
    this.setupScreenReaderAnnouncements();
  }

  /**
   * Set up screen reader announcements
   */
  setupScreenReaderAnnouncements() {
    // Create announcement region
    const announcer = this.modules.dom.createElement('div', {
      id: 'announcer',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      class: 'sr-only'
    });
    
    // Add screen reader only styles
    const style = this.modules.dom.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(announcer);
    
    // Global announce function
    this.announce = (message) => {
      announcer.textContent = message;
      setTimeout(() => announcer.textContent = '', 1000);
    };
  }

  /**
   * Handle global application errors
   */
  handleGlobalError(error) {
    this.state.errorCount++;
    
    // Show user-friendly error message
    if (this.modules.ui) {
      this.modules.ui.showError('An unexpected error occurred. Please refresh the page.');
    }
    
    // Log detailed error for debugging
    console.error('Global error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      errorCount: this.state.errorCount
    });
  }

  /**
   * Handle Web Worker specific errors
   */
  handleWorkerError(error) {
    console.warn('Web Worker failed, falling back to main thread processing');
    
    // Disable worker and fall back to main thread
    this.config.enableWebWorker = false;
    this.modules.worker = null;
    
    if (this.modules.ui) {
      this.modules.ui.updateWorkerComm(null);
      this.modules.ui.showStatus('Processing on main thread', 'warning');
    }
  }

  /**
   * Show compatibility error to user
   */
  showCompatibilityError() {
    const errorHTML = `
      <div style="
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 600px;
        margin: 50px auto;
        padding: 20px;
        border: 1px solid #e74c3c;
        border-radius: 8px;
        background: #ffeaea;
        color: #c0392b;
      ">
        <h2>Browser Not Supported</h2>
        <p>This application requires a modern web browser with support for:</p>
        <ul>
          <li>Web Workers</li>
          <li>ES6 Modules</li>
          <li>Promises</li>
          <li>Fetch API</li>
        </ul>
        <p>Please update your browser or use a modern alternative like Chrome, Firefox, Safari, or Edge.</p>
      </div>
    `;
    
    document.body.innerHTML = errorHTML;
  }

  /**
   * Show initialization error
   */
  showInitializationError(error) {
    const errorHTML = `
      <div style="
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 600px;
        margin: 50px auto;
        padding: 20px;
        border: 1px solid #e74c3c;
        border-radius: 8px;
        background: #ffeaea;
        color: #c0392b;
      ">
        <h2>Initialization Failed</h2>
        <p>The application failed to start properly. Please try refreshing the page.</p>
        <details>
          <summary>Technical Details</summary>
          <pre style="margin-top: 10px; font-size: 12px; overflow: auto;">${error.message}</pre>
        </details>
      </div>
    `;
    
    document.body.innerHTML = errorHTML;
  }

  /**
   * Get application state for debugging
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      state: this.state,
      config: this.config,
      modules: Object.keys(this.modules)
    };
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  // Create global app instance
  window.JiraMarkdownApp = new JiraMarkdownApp();
  
  // Initialize the application
  window.JiraMarkdownApp.init().catch(error => {
    console.error('Failed to initialize application:', error);
  });
}

// Export for module usage
export { JiraMarkdownApp }; 