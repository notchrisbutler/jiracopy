/**
 * UI Controller - Manages user interface interactions and coordinates application modules
 */

import { Utils } from './utils.js';

export class UIController {
  constructor(options = {}) {
    this.domManager = options.domManager;
    this.clipboardManager = options.clipboardManager;
    this.workerComm = options.workerComm;
    this.config = options.config || {};
    
    // UI elements (cached)
    this.elements = {};
    
    // State
    this.state = {
      isProcessing: false,
      currentInput: '',
      currentOutput: '',
      lastProcessingTime: 0
    };
    
    // Debounced functions
    this.debouncedProcess = Utils.debounce(
      this.processInput.bind(this), 
      this.config.debounceDelay || 150
    );
    
    this.debouncedUpdateCharCount = Utils.debounce(
      this.updateCharacterCount.bind(this), 
      50
    );
  }

  /**
   * Initialize the UI Controller
   */
  async init() {
    try {
      // Cache DOM elements
      this.cacheElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize UI state
      this.initializeUI();
      
      console.log('✅ UI Controller initialized');
    } catch (error) {
      console.error('❌ UI Controller initialization failed:', error);
      throw error;
    }
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.elements = {
      // Input elements
      markdownInput: this.domManager.getElementById('markdown-input'),
      charCount: this.domManager.querySelector('.char-count'),
      
      // Preview elements
      jiraPreviewLight: this.domManager.getElementById('jira-preview-light'),
      jiraPreviewDark: this.domManager.getElementById('jira-preview-dark'),
      copyButton: this.domManager.getElementById('copy-button'),
      
      // Status elements
      processingTime: this.domManager.getElementById('processing-time'),
      elementCount: this.domManager.getElementById('element-count'),
      statusMessage: this.domManager.getElementById('status-message'),
      
      // Modal elements
      helpButton: this.domManager.getElementById('help-button'),
      aboutButton: this.domManager.getElementById('about-button'),
      helpModal: this.domManager.getElementById('help-modal'),
      aboutModal: this.domManager.getElementById('about-modal'),
      
      // Loading overlay
      loadingOverlay: this.domManager.getElementById('loading-overlay')
    };

    // Verify critical elements exist
    if (!this.elements.markdownInput) {
      throw new Error('Critical UI element missing: markdown-input');
    }
    
    if (!this.elements.jiraPreviewLight || !this.elements.jiraPreviewDark) {
      throw new Error('Critical UI elements missing: jira preview containers');
    }
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Input events
    if (this.elements.markdownInput) {
      this.domManager.addEventListener(
        this.elements.markdownInput, 
        'input', 
        this.handleInput.bind(this)
      );
      
      this.domManager.addEventListener(
        this.elements.markdownInput, 
        'paste', 
        this.handlePaste.bind(this)
      );
    }

    // Copy button
    if (this.elements.copyButton) {
      this.domManager.addEventListener(
        this.elements.copyButton, 
        'click', 
        this.handleCopyClick.bind(this)
      );
    }

    // Modal buttons
    if (this.elements.helpButton) {
      this.domManager.addEventListener(
        this.elements.helpButton, 
        'click', 
        () => this.showModal('help-modal')
      );
    }

    if (this.elements.aboutButton) {
      this.domManager.addEventListener(
        this.elements.aboutButton, 
        'click', 
        () => this.showModal('about-modal')
      );
    }

    // Modal close handlers
    this.setupModalEventListeners();

    // Keyboard shortcuts
    this.domManager.addEventListener(
      document, 
      'keydown', 
      this.handleKeyboardShortcuts.bind(this)
    );
  }

  /**
   * Set up modal event listeners
   */
  setupModalEventListeners() {
    const modals = ['help-modal', 'about-modal'];
    
    modals.forEach(modalId => {
      const modal = this.domManager.getElementById(modalId);
      if (!modal) return;

      // Close button
      const closeButton = modal.querySelector('.modal-close');
      if (closeButton) {
        this.domManager.addEventListener(closeButton, 'click', () => {
          this.hideModal(modalId);
        });
      }

      // Overlay click
      const overlay = modal.querySelector('.modal-overlay');
      if (overlay) {
        this.domManager.addEventListener(overlay, 'click', () => {
          this.hideModal(modalId);
        });
      }

      // Escape key
      this.domManager.addEventListener(modal, 'keydown', (event) => {
        if (event.key === 'Escape') {
          this.hideModal(modalId);
        }
      });
    });
  }

  /**
   * Initialize UI state
   */
  initializeUI() {
    // Set initial character count
    this.updateCharacterCount();
    
    // Disable copy button initially
    if (this.elements.copyButton) {
      this.elements.copyButton.disabled = true;
    }
    
    // Hide status items initially
    this.hideStatusItems();
    
    // Show placeholder message
    this.showPlaceholderMessage();
  }

  /**
   * Handle input events from the markdown textarea
   */
  handleInput(event) {
    const input = event.target.value;
    this.state.currentInput = input;
    
    // Update character count immediately
    this.debouncedUpdateCharCount();
    
    // Process input with debouncing
    if (input.trim().length > 0) {
      this.debouncedProcess(input);
    } else {
      this.clearOutput();
    }
  }

  /**
   * Handle paste events
   */
  handlePaste(event) {
    // Let the paste happen, then process
    setTimeout(() => {
      this.handleInput(event);
    }, 10);
  }

  /**
   * Process markdown input
   */
  async processInput(markdown) {
    if (this.state.isProcessing) return;
    
    try {
      this.state.isProcessing = true;
      this.showProcessingState();
      
      const startTime = performance.now();
      
      // If we have a web worker, use it
      if (this.workerComm) {
        const result = await this.workerComm.sendMessage('CONVERT_MARKDOWN', {
          markdown: markdown,
          options: {
            preserveJiraLinks: true,
            sanitizeHtml: true
          }
        });
        
        this.handleProcessingResult(result, startTime);
      } else {
        // Fallback to simple processing on main thread
        const html = this.simpleMarkdownToHtml(markdown);
        this.handleProcessingResult({ html }, startTime);
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      this.showError('Failed to process markdown: ' + error.message);
    } finally {
      this.state.isProcessing = false;
      this.hideProcessingState();
    }
  }

  /**
   * Simple markdown to HTML conversion (fallback)
   */
  simpleMarkdownToHtml(markdown) {
    let html = markdown;
    
    // Basic conversions
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Convert line breaks to paragraphs
    const paragraphs = html.split('\n\n').filter(p => p.trim());
    html = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n');
    
    return html;
  }

  /**
   * Handle processing result
   */
  handleProcessingResult(result, startTime) {
    const processingTime = performance.now() - startTime;
    this.state.lastProcessingTime = processingTime;
    
    if (result.html) {
      this.state.currentOutput = result.html;
      this.updateOutput(result.html);
      this.updateStats(result.stats || {}, processingTime);
      this.enableCopyButton();
    } else if (result.error) {
      this.showError(result.error);
    }
  }

  /**
   * Update character count display
   */
  updateCharacterCount() {
    if (!this.elements.charCount || !this.elements.markdownInput) return;
    
    const count = this.elements.markdownInput.value.length;
    const maxLength = this.config.maxInputSize || 10000;
    
    this.elements.charCount.textContent = `${count} characters`;
    
    // Add warning if approaching limit
    if (count > maxLength * 0.9) {
      this.elements.charCount.style.color = 'var(--warning-color)';
    } else if (count > maxLength) {
      this.elements.charCount.style.color = 'var(--error-color)';
    } else {
      this.elements.charCount.style.color = '';
    }
  }

  /**
   * Update output with converted HTML
   */
  updateOutput(html) {
    if (!this.elements.jiraPreviewLight || !this.elements.jiraPreviewDark) return;
    
    // Clear placeholders
    this.hidePlaceholderMessage();
    
    // Update both preview containers with the same HTML content
    this.domManager.updateContent(this.elements.jiraPreviewLight, html, true);
    this.domManager.updateContent(this.elements.jiraPreviewDark, html, true);
    
    // Store current output for copying
    this.state.currentOutput = html;
  }

  /**
   * Clear output and show placeholder
   */
  clearOutput() {
    this.state.currentOutput = '';
    this.disableCopyButton();
    this.hideStatusItems();
    this.showPlaceholderMessage();
  }

  /**
   * Show placeholder message
   */
  showPlaceholderMessage() {
    const placeholderHTML = `
      <div class="placeholder-message">
        <span class="placeholder-icon" aria-hidden="true">✨</span>
        <p>Your converted HTML will appear here...</p>
        <p class="placeholder-hint">Start typing markdown in the left panel to see results</p>
      </div>
    `;
    
    if (this.elements.jiraPreviewLight) {
      this.elements.jiraPreviewLight.innerHTML = placeholderHTML;
    }
    
    if (this.elements.jiraPreviewDark) {
      this.elements.jiraPreviewDark.innerHTML = placeholderHTML;
    }
  }

  /**
   * Hide placeholder message
   */
  hidePlaceholderMessage() {
    [this.elements.jiraPreviewLight, this.elements.jiraPreviewDark].forEach(element => {
      if (!element) return;
      const placeholder = element.querySelector('.placeholder-message');
      if (placeholder) {
        placeholder.remove();
      }
    });
  }

  /**
   * Update statistics display
   */
  updateStats(stats, processingTime) {
    // Update processing time
    if (this.elements.processingTime) {
      this.elements.processingTime.textContent = Utils.formatProcessingTime(processingTime);
      this.elements.processingTime.parentElement.style.display = 'flex';
    }
    
    // Update element count
    if (this.elements.elementCount && stats.elementCount) {
      this.elements.elementCount.textContent = stats.elementCount;
      this.elements.elementCount.parentElement.style.display = 'flex';
    }
  }

  /**
   * Hide status items
   */
  hideStatusItems() {
    const statusItems = [
      this.elements.processingTime?.parentElement,
      this.elements.elementCount?.parentElement
    ];
    
    statusItems.forEach(item => {
      if (item) item.style.display = 'none';
    });
  }

  /**
   * Enable copy button
   */
  enableCopyButton() {
    if (this.elements.copyButton) {
      this.elements.copyButton.disabled = false;
    }
  }

  /**
   * Disable copy button
   */
  disableCopyButton() {
    if (this.elements.copyButton) {
      this.elements.copyButton.disabled = true;
    }
  }

  /**
   * Handle copy button click
   */
  async handleCopyClick() {
    if (!this.state.currentOutput || !this.clipboardManager) return;
    
    await this.clipboardManager.copyToClipboard(this.state.currentOutput);
  }

  /**
   * Handle copy request (can be called from keyboard shortcut)
   */
  async handleCopyRequest() {
    return this.handleCopyClick();
  }

  /**
   * Show processing state
   */
  showProcessingState() {
    // Add processing class to input panel
    const inputPanel = this.elements.markdownInput?.closest('.input-panel');
    if (inputPanel) {
      inputPanel.classList.add('processing');
    }
  }

  /**
   * Hide processing state
   */
  hideProcessingState() {
    // Remove processing class
    const inputPanel = this.elements.markdownInput?.closest('.input-panel');
    if (inputPanel) {
      inputPanel.classList.remove('processing');
    }
  }

  /**
   * Show modal
   */
  showModal(modalId) {
    this.domManager.showModal(modalId);
  }

  /**
   * Hide modal
   */
  hideModal(modalId) {
    this.domManager.hideModal(modalId);
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    ['help-modal', 'about-modal'].forEach(modalId => {
      this.hideModal(modalId);
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter to copy
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.handleCopyRequest();
    }
    
    // Escape to close modals
    if (event.key === 'Escape') {
      this.closeAllModals();
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.elements.statusMessage) {
      this.elements.statusMessage.style.display = 'block';
      this.elements.statusMessage.querySelector('.status-text').textContent = message;
      this.elements.statusMessage.querySelector('.status-text').className = 'status-text error';
    }
    
    console.error('UI Error:', message);
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    if (this.elements.statusMessage) {
      this.elements.statusMessage.style.display = 'block';
      this.elements.statusMessage.querySelector('.status-text').textContent = message;
      this.elements.statusMessage.querySelector('.status-text').className = `status-text ${type}`;
    }
  }

  /**
   * Update worker communication reference
   */
  updateWorkerComm(workerComm) {
    this.workerComm = workerComm;
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      ...this.state,
      hasElements: Object.keys(this.elements).length > 0,
      workerAvailable: !!this.workerComm
    };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // DOM manager will handle event listener cleanup
    this.elements = {};
    this.state = {};
  }
} 