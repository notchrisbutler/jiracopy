/**
 * DOM Manager - Handles DOM manipulation and element management
 */

export class DOMManager {
  constructor() {
    this.eventListeners = new Map();
    this.elements = new Map();
  }

  /**
   * Create and configure DOM elements
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string} content - Element content
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Set attributes
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'class') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else if (key.startsWith('aria-')) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    }
    
    // Set content
    if (content) {
      if (content.includes('<') && content.includes('>')) {
        element.innerHTML = content;
      } else {
        element.textContent = content;
      }
    }
    
    return element;
  }

  /**
   * Update element content safely
   * @param {HTMLElement} element - Target element
   * @param {string} content - New content
   * @param {boolean} isHTML - Whether content is HTML
   */
  updateContent(element, content, isHTML = false) {
    if (!element) return;
    
    if (isHTML) {
      element.innerHTML = content;
    } else {
      element.textContent = content;
    }
  }

  /**
   * Add event listener with cleanup tracking
   * @param {HTMLElement} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   * @returns {Function} Cleanup function
   */
  addEventListener(element, event, handler, options = {}) {
    if (!element || !event || !handler) return () => {};
    
    element.addEventListener(event, handler, options);
    
    // Track for cleanup
    const key = `${element.tagName}-${event}-${Date.now()}`;
    this.eventListeners.set(key, {
      element,
      event,
      handler,
      options
    });
    
    // Return cleanup function
    return () => {
      element.removeEventListener(event, handler, options);
      this.eventListeners.delete(key);
    };
  }

  /**
   * Remove all event listeners for cleanup
   */
  removeAllEventListeners() {
    for (const [key, listener] of this.eventListeners) {
      const { element, event, handler, options } = listener;
      element.removeEventListener(event, handler, options);
    }
    this.eventListeners.clear();
  }

  /**
   * Apply CSS classes with transitions
   * @param {HTMLElement} element - Target element
   * @param {string[]} classes - CSS classes to add
   * @param {string[]} removeClasses - CSS classes to remove
   */
  applyClasses(element, classes = [], removeClasses = []) {
    if (!element) return;
    
    // Remove classes
    if (removeClasses.length > 0) {
      element.classList.remove(...removeClasses);
    }
    
    // Add classes
    if (classes.length > 0) {
      element.classList.add(...classes);
    }
  }

  /**
   * Toggle element visibility with animation
   * @param {HTMLElement} element - Target element
   * @param {boolean} show - Whether to show or hide
   * @param {string} animationClass - Animation class to apply
   */
  toggleVisibility(element, show, animationClass = '') {
    if (!element) return;
    
    if (show) {
      element.style.display = '';
      element.setAttribute('aria-hidden', 'false');
      if (animationClass) {
        element.classList.add(animationClass);
      }
    } else {
      element.setAttribute('aria-hidden', 'true');
      if (animationClass) {
        element.classList.remove(animationClass);
        // Hide after animation
        setTimeout(() => {
          if (element.getAttribute('aria-hidden') === 'true') {
            element.style.display = 'none';
          }
        }, 300);
      } else {
        element.style.display = 'none';
      }
    }
  }

  /**
   * Get element by ID with caching
   * @param {string} id - Element ID
   * @returns {HTMLElement} Element or null
   */
  getElementById(id) {
    if (this.elements.has(id)) {
      return this.elements.get(id);
    }
    
    const element = document.getElementById(id);
    if (element) {
      this.elements.set(id, element);
    }
    
    return element;
  }

  /**
   * Get element by selector with caching
   * @param {string} selector - CSS selector
   * @returns {HTMLElement} Element or null
   */
  querySelector(selector) {
    if (this.elements.has(selector)) {
      return this.elements.get(selector);
    }
    
    const element = document.querySelector(selector);
    if (element) {
      this.elements.set(selector, element);
    }
    
    return element;
  }

  /**
   * Get all elements by selector
   * @param {string} selector - CSS selector
   * @returns {NodeList} NodeList of elements
   */
  querySelectorAll(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Show modal with accessibility features
   * @param {string} modalId - Modal element ID
   */
  showModal(modalId) {
    const modal = this.getElementById(modalId);
    if (!modal) return;
    
    // Store previously focused element
    modal.previousFocus = document.activeElement;
    
    // Show modal
    this.toggleVisibility(modal, true);
    
    // Focus first focusable element
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) {
      focusable.focus();
    }
    
    // Trap focus within modal
    this.trapFocus(modal);
  }

  /**
   * Hide modal and restore focus
   * @param {string} modalId - Modal element ID
   */
  hideModal(modalId) {
    const modal = this.getElementById(modalId);
    if (!modal) return;
    
    // Hide modal
    this.toggleVisibility(modal, false);
    
    // Restore focus
    if (modal.previousFocus) {
      modal.previousFocus.focus();
      delete modal.previousFocus;
    }
    
    // Remove focus trap
    this.removeFocusTrap(modal);
  }

  /**
   * Trap focus within an element
   * @param {HTMLElement} element - Container element
   */
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const trapHandler = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };
    
    element.addEventListener('keydown', trapHandler);
    element.focusTrapHandler = trapHandler;
  }

  /**
   * Remove focus trap from element
   * @param {HTMLElement} element - Container element
   */
  removeFocusTrap(element) {
    if (element.focusTrapHandler) {
      element.removeEventListener('keydown', element.focusTrapHandler);
      delete element.focusTrapHandler;
    }
  }

  /**
   * Scroll element into view smoothly
   * @param {HTMLElement} element - Element to scroll to
   * @param {Object} options - Scroll options
   */
  scrollIntoView(element, options = { behavior: 'smooth', block: 'center' }) {
    if (!element) return;
    element.scrollIntoView(options);
  }

  /**
   * Highlight element temporarily
   * @param {HTMLElement} element - Element to highlight
   * @param {number} duration - Highlight duration in milliseconds
   */
  highlightElement(element, duration = 2000) {
    if (!element) return;
    
    element.classList.add('highlight');
    setTimeout(() => {
      element.classList.remove('highlight');
    }, duration);
  }

  /**
   * Create loading indicator
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement} Loading element
   */
  createLoadingIndicator(container) {
    const loading = this.createElement('div', {
      class: 'loading-indicator',
      'aria-label': 'Loading...'
    });
    
    const spinner = this.createElement('div', { class: 'spinner' });
    const text = this.createElement('span', {}, 'Processing...');
    
    loading.appendChild(spinner);
    loading.appendChild(text);
    
    if (container) {
      container.appendChild(loading);
    }
    
    return loading;
  }

  /**
   * Remove loading indicator
   * @param {HTMLElement} loading - Loading element to remove
   */
  removeLoadingIndicator(loading) {
    if (loading && loading.parentNode) {
      loading.parentNode.removeChild(loading);
    }
  }

  /**
   * Create notification element
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning)
   * @returns {HTMLElement} Notification element
   */
  createNotification(message, type = 'info') {
    const notification = this.createElement('div', {
      class: `notification ${type}`,
      role: 'alert',
      'aria-live': 'polite'
    });
    
    const icon = this.createElement('span', { class: 'notification-icon' });
    const text = this.createElement('span', { class: 'notification-text' }, message);
    
    notification.appendChild(icon);
    notification.appendChild(text);
    
    return notification;
  }

  /**
   * Show temporary notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @param {number} duration - Duration in milliseconds
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notification = this.createNotification(message, type);
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Hide and remove notification
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  /**
   * Measure element dimensions
   * @param {HTMLElement} element - Element to measure
   * @returns {Object} Element dimensions
   */
  measureElement(element) {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      margin: {
        top: parseFloat(style.marginTop),
        right: parseFloat(style.marginRight),
        bottom: parseFloat(style.marginBottom),
        left: parseFloat(style.marginLeft)
      },
      padding: {
        top: parseFloat(style.paddingTop),
        right: parseFloat(style.paddingRight),
        bottom: parseFloat(style.paddingBottom),
        left: parseFloat(style.paddingLeft)
      }
    };
  }

  /**
   * Check if element is visible in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element is visible
   */
  isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Clean up all resources
   */
  cleanup() {
    this.removeAllEventListeners();
    this.elements.clear();
  }
} 