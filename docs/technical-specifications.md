# Technical Specifications

## Technology Stack

### Core Technologies
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern layout with Grid, Flexbox, and custom properties
- **JavaScript ES2020+**: Native browser APIs and modern language features
- **Web Workers**: Background processing for markdown conversion
- **Web APIs**: Clipboard API, Storage API, Performance API

### External Dependencies
- **Markdown Parser**: Lightweight library (TBD - marked.js, markdown-it, or micromark)
- **Optional**: DOMPurify for additional HTML sanitization (CDN)

### Browser Requirements
- **Minimum Support**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Required Features**: Web Workers, ES6 modules, Clipboard API (with fallback)
- **Optional Features**: CSS Grid, CSS custom properties, IntersectionObserver

## Application Programming Interfaces (APIs)

### Main Thread API

#### UI Controller (`UIController`)

```javascript
class UIController {
  constructor(options = {}) {
    this.debounceDelay = options.debounceDelay || 150;
    this.maxInputSize = options.maxInputSize || 10000;
  }

  /**
   * Initialize the UI controller
   * @returns {Promise<void>}
   */
  async init() {}

  /**
   * Handle markdown input change
   * @param {string} markdown - Input markdown text
   * @returns {void}
   */
  handleInput(markdown) {}

  /**
   * Update the HTML output display
   * @param {string} html - Generated HTML
   * @param {Object} stats - Processing statistics
   * @returns {void}
   */
  updateOutput(html, stats) {}

  /**
   * Show loading state
   * @param {boolean} loading - Loading state
   * @returns {void}
   */
  setLoading(loading) {}

  /**
   * Display error message
   * @param {string} error - Error message
   * @returns {void}
   */
  showError(error) {}
}
```

#### DOM Manager (`DOMManager`)

```javascript
class DOMManager {
  /**
   * Create and configure DOM elements
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string} content - Element content
   * @returns {HTMLElement}
   */
  createElement(tag, attributes = {}, content = '') {}

  /**
   * Update element content safely
   * @param {HTMLElement} element - Target element
   * @param {string} content - New content
   * @param {boolean} isHTML - Whether content is HTML
   * @returns {void}
   */
  updateContent(element, content, isHTML = false) {}

  /**
   * Add event listener with cleanup tracking
   * @param {HTMLElement} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @returns {Function} Cleanup function
   */
  addEventListener(element, event, handler) {}

  /**
   * Apply CSS classes with transitions
   * @param {HTMLElement} element - Target element
   * @param {string[]} classes - CSS classes to add
   * @param {string[]} removeClasses - CSS classes to remove
   * @returns {void}
   */
  applyClasses(element, classes = [], removeClasses = []) {}
}
```

#### Clipboard Manager (`ClipboardManager`)

```javascript
class ClipboardManager {
  /**
   * Copy text to clipboard using modern API
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(text) {}

  /**
   * Copy text using fallback method (execCommand)
   * @param {string} text - Text to copy
   * @returns {boolean} Success status
   */
  copyFallback(text) {}

  /**
   * Check if clipboard API is available
   * @returns {boolean} API availability
   */
  isClipboardAPISupported() {}

  /**
   * Show copy feedback to user
   * @param {boolean} success - Copy operation success
   * @returns {void}
   */
  showFeedback(success) {}
}
```

#### Worker Communication (`WorkerComm`)

```javascript
class WorkerComm {
  constructor(workerPath) {
    this.workerPath = workerPath;
    this.messageQueue = new Map();
    this.messageId = 0;
  }

  /**
   * Initialize Web Worker
   * @returns {Promise<void>}
   */
  async init() {}

  /**
   * Send message to worker with response handling
   * @param {string} type - Message type
   * @param {Object} payload - Message payload
   * @param {number} timeout - Response timeout (ms)
   * @returns {Promise<Object>} Worker response
   */
  sendMessage(type, payload, timeout = 5000) {}

  /**
   * Handle incoming messages from worker
   * @param {MessageEvent} event - Worker message event
   * @returns {void}
   */
  handleWorkerMessage(event) {}

  /**
   * Terminate worker and cleanup
   * @returns {void}
   */
  terminate() {}
}
```

### Web Worker API

#### Markdown Worker (`markdown-worker.js`)

```javascript
// Message Types
const MESSAGE_TYPES = {
  CONVERT_MARKDOWN: 'CONVERT_MARKDOWN',
  CONVERSION_COMPLETE: 'CONVERSION_COMPLETE',
  CONVERSION_ERROR: 'CONVERSION_ERROR',
  WORKER_READY: 'WORKER_READY'
};

// Message Handlers
const messageHandlers = {
  [MESSAGE_TYPES.CONVERT_MARKDOWN]: handleConvertMarkdown
};

/**
 * Handle markdown conversion request
 * @param {Object} message - Incoming message
 * @returns {void}
 */
function handleConvertMarkdown(message) {}

/**
 * Send response back to main thread
 * @param {string} id - Message ID
 * @param {string} type - Response type
 * @param {Object} payload - Response payload
 * @returns {void}
 */
function sendResponse(id, type, payload) {}
```

#### Parser Engine (`parser-engine.js`)

```javascript
class ParserEngine {
  constructor(options = {}) {
    this.options = {
      sanitizeHtml: true,
      preserveJiraLinks: true,
      maxNestingLevel: 10,
      ...options
    };
  }

  /**
   * Parse markdown text into abstract syntax tree
   * @param {string} markdown - Input markdown
   * @returns {Object} Parsed AST
   */
  parse(markdown) {}

  /**
   * Tokenize markdown into individual elements
   * @param {string} markdown - Input markdown
   * @returns {Array} Token array
   */
  tokenize(markdown) {}

  /**
   * Build AST from token array
   * @param {Array} tokens - Input tokens
   * @returns {Object} Abstract syntax tree
   */
  buildAST(tokens) {}

  /**
   * Validate and sanitize input
   * @param {string} markdown - Input markdown
   * @returns {string} Sanitized markdown
   */
  sanitizeInput(markdown) {}
}
```

#### HTML Generator (`html-generator.js`)

```javascript
class HTMLGenerator {
  constructor(options = {}) {
    this.options = {
      jiraOptimized: true,
      sanitizeOutput: true,
      preserveWhitespace: false,
      ...options
    };
  }

  /**
   * Generate HTML from parsed AST
   * @param {Object} ast - Abstract syntax tree
   * @returns {string} Generated HTML
   */
  generate(ast) {}

  /**
   * Render individual AST node to HTML
   * @param {Object} node - AST node
   * @returns {string} HTML representation
   */
  renderNode(node) {}

  /**
   * Sanitize generated HTML for security
   * @param {string} html - Input HTML
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html) {}

  /**
   * Optimize HTML for Jira Cloud rendering
   * @param {string} html - Input HTML
   * @returns {string} Jira-optimized HTML
   */
  optimizeForJira(html) {}
}
```

## Data Structures

### Message Protocol

#### Request Message
```javascript
{
  id: string,           // Unique message identifier
  type: string,         // Message type constant
  payload: {
    markdown: string,   // Input markdown text
    options: {
      sanitizeHtml: boolean,
      preserveJiraLinks: boolean,
      jiraOptimized: boolean
    }
  },
  timestamp: number     // Message timestamp
}
```

#### Response Message
```javascript
{
  id: string,           // Matching request ID
  type: string,         // Response type constant
  payload: {
    html: string,       // Generated HTML
    stats: {
      processingTime: number,
      elementCount: number,
      warningCount: number,
      errors: Array<string>
    }
  },
  timestamp: number     // Response timestamp
}
```

#### Error Message
```javascript
{
  id: string,           // Matching request ID
  type: 'CONVERSION_ERROR',
  payload: {
    error: string,      // Error description
    code: string,       // Error code
    position: {         // Error position (if applicable)
      line: number,
      column: number
    },
    context: string     // Surrounding context
  },
  timestamp: number
}
```

### Abstract Syntax Tree (AST)

#### Node Structure
```javascript
{
  type: string,         // Node type (paragraph, heading, list, etc.)
  level: number,        // Nesting level (for headings, lists)
  attributes: Object,   // HTML attributes
  children: Array,      // Child nodes
  content: string,      // Text content (for leaf nodes)
  raw: string,         // Original markdown text
  position: {          // Source position
    start: { line: number, column: number },
    end: { line: number, column: number }
  }
}
```

#### Node Types
```javascript
const NODE_TYPES = {
  DOCUMENT: 'document',
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  LIST: 'list',
  LIST_ITEM: 'list_item',
  LINK: 'link',
  TEXT: 'text',
  EMPHASIS: 'emphasis',
  STRONG: 'strong',
  CODE: 'code',
  CODE_BLOCK: 'code_block',
  BLOCKQUOTE: 'blockquote',
  TABLE: 'table',
  TABLE_ROW: 'table_row',
  TABLE_CELL: 'table_cell'
};
```

## Configuration

### Application Configuration

```javascript
const CONFIG = {
  // Performance settings
  performance: {
    debounceDelay: 150,           // Input debounce delay (ms)
    maxInputSize: 10000,          // Maximum input size (characters)
    workerTimeout: 5000,          // Worker response timeout (ms)
    cacheSize: 100                // Result cache size
  },

  // UI settings
  ui: {
    showProcessingTime: true,     // Display processing statistics
    showElementCount: true,       // Display element count
    autoFocus: true,             // Auto-focus input on load
    copyFeedbackDuration: 2000   // Copy feedback duration (ms)
  },

  // Parsing settings
  parser: {
    sanitizeInput: true,         // Sanitize markdown input
    maxNestingLevel: 10,         // Maximum nesting depth
    preserveJiraLinks: true,     // Preserve Jira issue links
    autoLinkUrls: true          // Auto-detect URLs
  },

  // HTML generation settings
  generator: {
    sanitizeOutput: true,        // Sanitize HTML output
    jiraOptimized: true,         // Optimize for Jira Cloud
    preserveWhitespace: false,   // Preserve original whitespace
    compactOutput: false         // Minimize HTML output
  },

  // Security settings
  security: {
    allowedTags: [               // Allowed HTML tags
      'p', 'br', 'strong', 'em', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote',
      'table', 'tr', 'td', 'th', 'thead', 'tbody'
    ],
    allowedAttributes: {         // Allowed attributes per tag
      'a': ['href', 'title'],
      'code': ['class'],
      'pre': ['class'],
      'table': ['class'],
      'th': ['align'],
      'td': ['align']
    },
    forbiddenProtocols: [        // Forbidden URL protocols
      'javascript:', 'data:', 'vbscript:'
    ]
  }
};
```

### Build Configuration

Since this is a no-build application, configuration is managed through:

1. **HTML meta tags** for viewport and security
2. **CSS custom properties** for theming
3. **JavaScript constants** for runtime configuration
4. **CDN URLs** for external dependencies

```html
<!-- Security Configuration -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">

<!-- Viewport Configuration -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
```

```css
/* CSS Custom Properties for Theming */
:root {
  --primary-color: #0052cc;
  --secondary-color: #6b778c;
  --success-color: #00875a;
  --error-color: #de350b;
  --background-color: #ffffff;
  --surface-color: #f4f5f7;
  --text-color: #172b4d;
  --border-color: #dfe1e6;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-size-base: 14px;
  --line-height-base: 1.5;
  --border-radius: 4px;
  --spacing-unit: 8px;
  --transition-duration: 200ms;
}
```

## Performance Specifications

### Response Time Requirements
- **Input Processing**: < 50ms for debounce detection
- **Markdown Parsing**: < 100ms for 1KB input
- **HTML Generation**: < 50ms after parsing
- **UI Updates**: < 16ms for 60fps rendering
- **Copy Operation**: < 100ms including user feedback

### Memory Usage Targets
- **Initial Load**: < 10MB memory usage
- **Runtime Peak**: < 50MB during processing
- **Steady State**: < 25MB after processing
- **Cache Size**: < 5MB for result caching
- **Worker Memory**: < 20MB in Web Worker

### Network Requirements
- **Zero External Requests**: No network calls during operation
- **CDN Fallback**: Local fallback for any external dependencies
- **Offline Capability**: Full functionality without internet
- **Bundle Size**: < 500KB total application size

### Browser Performance
- **First Paint**: < 100ms on modern devices
- **Time to Interactive**: < 200ms on modern devices
- **Largest Contentful Paint**: < 300ms
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## Security Specifications

### Input Sanitization
- **HTML Entity Encoding**: All user input escaped
- **Script Tag Removal**: No `<script>` tags in input/output
- **Attribute Filtering**: Only whitelisted attributes allowed
- **URL Validation**: All URLs validated against safe protocols
- **Size Limits**: Input size limited to prevent DoS

### Output Security
- **XSS Prevention**: No executable content in output
- **Content Filtering**: Only safe HTML elements allowed
- **Attribute Sanitization**: Dangerous attributes removed
- **URL Scheme Validation**: Only http/https/mailto allowed
- **HTML Entity Encoding**: Special characters encoded

### Privacy Protection
- **No Data Transmission**: Zero external network requests
- **No Data Storage**: No persistent data storage
- **No Analytics**: No tracking or analytics code
- **No Cookies**: No cookie usage
- **Client-Side Only**: All processing happens locally

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'none';
object-src 'none';
frame-src 'none';
``` 