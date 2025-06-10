/**
 * Clipboard Manager - Handles copying HTML to clipboard
 */

export class ClipboardManager {
  constructor(domManager) {
    this.domManager = domManager;
    this.isClipboardAPISupported = this.checkClipboardAPISupport();
    this.feedbackTimeout = null;
  }

  /**
   * Check if modern Clipboard API is supported
   * @returns {boolean} True if Clipboard API is supported
   */
  checkClipboardAPISupport() {
    return !!(navigator.clipboard && navigator.clipboard.writeText);
  }

  /**
   * Copy text to clipboard using the best available method
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(text) {
    if (!text) {
      this.showFeedback(false, 'No content to copy');
      return false;
    }

    try {
      let success = false;

      if (this.isClipboardAPISupported) {
        success = await this.copyWithModernAPI(text);
      } else {
        success = this.copyWithFallback(text);
      }

      if (success) {
        this.showFeedback(true, 'HTML copied to clipboard!');
        console.log('✅ Successfully copied to clipboard');
      } else {
        this.showFeedback(false, 'Failed to copy to clipboard');
        console.warn('❌ Failed to copy to clipboard');
      }

      return success;
    } catch (error) {
      console.error('Clipboard copy error:', error);
      this.showFeedback(false, 'Copy failed: ' + error.message);
      return false;
    }
  }

  /**
   * Copy using modern Clipboard API
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyWithModernAPI(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Modern clipboard API failed, trying fallback:', error);
      return this.copyWithFallback(text);
    }
  }

  /**
   * Copy using fallback method (execCommand)
   * @param {string} text - Text to copy
   * @returns {boolean} Success status
   */
  copyWithFallback(text) {
    try {
      // Create temporary textarea element
      const textArea = this.domManager.createElement('textarea', {
        value: text,
        style: {
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: '0',
          pointerEvents: 'none'
        }
      });

      document.body.appendChild(textArea);

      // Select and copy the text
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      
      const success = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textArea);
      
      return success;
    } catch (error) {
      console.error('Fallback copy method failed:', error);
      return false;
    }
  }

  /**
   * Copy HTML with rich text support
   * @param {string} html - HTML content to copy
   * @param {string} plainText - Plain text fallback
   * @returns {Promise<boolean>} Success status
   */
  async copyRichContent(html, plainText = '') {
    if (!html) {
      this.showFeedback(false, 'No content to copy');
      return false;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        // Use rich text copying if available
        const data = [
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText || html], { type: 'text/plain' })
          })
        ];

        await navigator.clipboard.write(data);
        this.showFeedback(true, 'HTML copied with formatting!');
        return true;
      } else {
        // Fallback to plain HTML text
        return await this.copyToClipboard(html);
      }
    } catch (error) {
      console.warn('Rich content copy failed, falling back to plain text:', error);
      return await this.copyToClipboard(html);
    }
  }

  /**
   * Show copy feedback to user
   * @param {boolean} success - Whether copy was successful
   * @param {string} message - Feedback message
   * @param {number} duration - Duration to show feedback (ms)
   */
  showFeedback(success, message, duration = 3000) {
    const feedback = this.domManager.getElementById('copy-feedback');
    if (!feedback) return;

    // Clear existing timeout
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }

    // Update feedback content
    const icon = feedback.querySelector('.feedback-icon');
    const text = feedback.querySelector('.feedback-text');
    
    if (icon) {
      icon.textContent = success ? '✅' : '❌';
    }
    
    if (text) {
      text.textContent = message;
    }

    // Update feedback styling
    feedback.className = `copy-feedback ${success ? 'success' : 'error'}`;
    feedback.setAttribute('aria-hidden', 'false');

    // Hide feedback after duration
    this.feedbackTimeout = setTimeout(() => {
      feedback.setAttribute('aria-hidden', 'true');
    }, duration);
  }

  /**
   * Check if user can paste (for UI feedback)
   * @returns {Promise<boolean>} True if paste is available
   */
  async canPaste() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        // Check if we have clipboard read permission
        const permissionStatus = await navigator.permissions.query({ name: 'clipboard-read' });
        return permissionStatus.state === 'granted' || permissionStatus.state === 'prompt';
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Read text from clipboard (if permission is granted)
   * @returns {Promise<string|null>} Clipboard text or null
   */
  async readFromClipboard() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        return text;
      }
      return null;
    } catch (error) {
      console.warn('Failed to read from clipboard:', error);
      return null;
    }
  }

  /**
   * Handle keyboard shortcuts for copy operations
   * @param {Event} event - Keyboard event
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async handleKeyboardCopy(event, text) {
    // Check for Ctrl+C or Cmd+C
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      return await this.copyToClipboard(text);
    }
    return false;
  }

  /**
   * Copy button click handler with debouncing
   * @param {string} text - Text to copy
   * @returns {Function} Click handler function
   */
  createCopyHandler(text) {
    let isProcessing = false;

    return async (event) => {
      if (isProcessing) return;
      
      isProcessing = true;
      
      try {
        const button = event.target.closest('button');
        const originalContent = button ? button.innerHTML : '';
        
        // Show loading state
        if (button) {
          button.disabled = true;
          button.innerHTML = '<span class="button-icon">⏳</span><span class="button-text">Copying...</span>';
        }

        const success = await this.copyToClipboard(text);

        // Restore button state
        if (button) {
          button.disabled = false;
          button.innerHTML = originalContent;
        }

        return success;
      } finally {
        isProcessing = false;
      }
    };
  }

  /**
   * Setup automatic copy on text selection
   * @param {HTMLElement} element - Element to monitor for selection
   * @param {Function} getTextCallback - Function to get text to copy
   */
  setupSelectionCopy(element, getTextCallback) {
    if (!element) return;

    let selectionTimeout;

    const handleSelection = () => {
      clearTimeout(selectionTimeout);
      
      selectionTimeout = setTimeout(async () => {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText && selectedText.length > 10) {
          const shouldCopy = confirm('Copy selected text to clipboard?');
          if (shouldCopy) {
            const textToCopy = getTextCallback ? getTextCallback(selectedText) : selectedText;
            await this.copyToClipboard(textToCopy);
          }
        }
      }, 1000);
    };

    this.domManager.addEventListener(element, 'mouseup', handleSelection);
    this.domManager.addEventListener(element, 'keyup', handleSelection);
  }

  /**
   * Validate clipboard content before copying
   * @param {string} content - Content to validate
   * @returns {Object} Validation result
   */
  validateClipboardContent(content) {
    const result = {
      isValid: true,
      warnings: [],
      sanitizedContent: content
    };

    if (!content || content.trim().length === 0) {
      result.isValid = false;
      result.warnings.push('No content to copy');
      return result;
    }

    // Check for very large content
    if (content.length > 100000) {
      result.warnings.push('Content is very large and may not copy properly');
    }

    // Check for potentially problematic characters
    if (content.includes('\0')) {
      result.sanitizedContent = content.replace(/\0/g, '');
      result.warnings.push('Null characters removed from content');
    }

    // Check for HTML content
    if (content.includes('<') && content.includes('>')) {
      result.warnings.push('HTML content detected - may not paste correctly in all applications');
    }

    return result;
  }

  /**
   * Get clipboard API information for debugging
   * @returns {Object} Clipboard API information
   */
  getClipboardInfo() {
    return {
      modernAPISupported: this.isClipboardAPISupported,
      writeSupported: !!(navigator.clipboard && navigator.clipboard.writeText),
      readSupported: !!(navigator.clipboard && navigator.clipboard.readText),
      writeRichSupported: !!(navigator.clipboard && navigator.clipboard.write),
      readRichSupported: !!(navigator.clipboard && navigator.clipboard.read),
      execCommandSupported: document.queryCommandSupported && document.queryCommandSupported('copy'),
      secureContext: window.isSecureContext,
      permissions: navigator.permissions ? 'available' : 'not available'
    };
  }

  /**
   * Test clipboard functionality
   * @returns {Promise<Object>} Test results
   */
  async testClipboard() {
    const testText = 'Test clipboard functionality';
    const results = {
      modernAPI: false,
      fallback: false,
      richContent: false,
      info: this.getClipboardInfo()
    };

    try {
      // Test modern API
      if (this.isClipboardAPISupported) {
        results.modernAPI = await this.copyWithModernAPI(testText);
      }

      // Test fallback
      results.fallback = this.copyWithFallback(testText);

      // Test rich content
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          await this.copyRichContent('<p>Test HTML</p>', 'Test HTML');
          results.richContent = true;
        } catch (error) {
          results.richContent = false;
        }
      }

    } catch (error) {
      console.error('Clipboard test failed:', error);
    }

    return results;
  }

  /**
   * Clean up clipboard manager resources
   */
  cleanup() {
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
      this.feedbackTimeout = null;
    }
  }
} 