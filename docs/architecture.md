# Architecture Design

## System Overview

The Jira Markdown to HTML Converter is a client-side web application built with vanilla JavaScript that processes markdown text locally using Web Workers for optimal performance and responsiveness.

## Architecture Principles

- **Client-Only Processing**: Zero server dependencies
- **Privacy First**: No data leaves the user's device
- **Performance Optimized**: Web Workers prevent UI blocking
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Minimal Dependencies**: Lightweight and fast loading

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   Main Thread   │    │   Web Worker    │               │
│  │                 │    │                 │               │
│  │  ┌───────────┐  │    │  ┌───────────┐  │               │
│  │  │    UI     │  │    │  │ Markdown  │  │               │
│  │  │Controller │  │────┼──│ Processor │  │               │
│  │  └───────────┘  │    │  └───────────┘  │               │
│  │        │        │    │        │        │               │
│  │  ┌───────────┐  │    │  ┌───────────┐  │               │
│  │  │   DOM     │  │    │  │  Parser   │  │               │
│  │  │ Manager   │  │    │  │  Engine   │  │               │
│  │  └───────────┘  │    │  └───────────┘  │               │
│  │        │        │    │        │        │               │
│  │  ┌───────────┐  │    │  ┌───────────┐  │               │
│  │  │Clipboard  │  │    │  │ HTML      │  │               │
│  │  │ Manager   │  │    │  │Generator  │  │               │
│  │  └───────────┘  │    │  └───────────┘  │               │
│  └─────────────────┘    └─────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Main Thread Components

#### 1. UI Controller (`js/ui-controller.js`)
- **Responsibility**: Manages user interface interactions
- **Functions**:
  - Handle input events from textarea
  - Coordinate with Web Worker
  - Update output display
  - Manage loading states
- **Dependencies**: DOM Manager, Web Worker Communication

#### 2. DOM Manager (`js/dom-manager.js`)
- **Responsibility**: Direct DOM manipulation and element management
- **Functions**:
  - Create and update DOM elements
  - Handle element styling and classes
  - Manage event listeners
  - Accessibility features
- **Dependencies**: None (pure DOM operations)

#### 3. Clipboard Manager (`js/clipboard-manager.js`)
- **Responsibility**: Handle copying HTML to clipboard
- **Functions**:
  - Modern Clipboard API implementation
  - Fallback for older browsers
  - User feedback for copy operations
  - Error handling
- **Dependencies**: DOM Manager (for feedback)

#### 4. Worker Communication (`js/worker-comm.js`)
- **Responsibility**: Manage Web Worker communication
- **Functions**:
  - Send messages to worker
  - Handle worker responses
  - Queue management for rapid inputs
  - Error handling and recovery
- **Dependencies**: UI Controller

### Web Worker Components

#### 1. Markdown Processor (`workers/markdown-worker.js`)
- **Responsibility**: Main worker thread coordination
- **Functions**:
  - Receive markdown input from main thread
  - Coordinate parsing and HTML generation
  - Send results back to main thread
  - Error handling and logging
- **Dependencies**: Parser Engine, HTML Generator

#### 2. Parser Engine (`workers/parser-engine.js`)
- **Responsibility**: Parse markdown into abstract syntax tree
- **Functions**:
  - Tokenize markdown text
  - Build syntax tree
  - Handle Jira-specific syntax
  - Validate and sanitize input
- **Dependencies**: Markdown library (minimal)

#### 3. HTML Generator (`workers/html-generator.js`)
- **Responsibility**: Convert parsed markdown to HTML
- **Functions**:
  - Transform syntax tree to HTML
  - Apply Jira-specific formatting
  - Sanitize output for security
  - Optimize for Jira Cloud rendering
- **Dependencies**: Parser Engine output

## Data Flow

### Input Processing Flow

```
User Input (Markdown)
        ↓
UI Controller (debounce/throttle)
        ↓
Worker Communication (message queue)
        ↓
Web Worker (Markdown Processor)
        ↓
Parser Engine (tokenize & parse)
        ↓
HTML Generator (transform to HTML)
        ↓
Worker Communication (result message)
        ↓
UI Controller (update display)
        ↓
DOM Manager (render HTML preview)
```

### Copy Operation Flow

```
User Click (Copy Button)
        ↓
UI Controller (trigger copy)
        ↓
Clipboard Manager (access clipboard)
        ↓
Browser Clipboard API
        ↓
DOM Manager (show feedback)
```

## Message Protocol

### Main Thread to Worker

```javascript
{
  id: "unique-message-id",
  type: "CONVERT_MARKDOWN",
  payload: {
    markdown: "input markdown text",
    options: {
      preserveJiraLinks: true,
      sanitizeHtml: true
    }
  },
  timestamp: Date.now()
}
```

### Worker to Main Thread

```javascript
{
  id: "unique-message-id",
  type: "CONVERSION_COMPLETE",
  payload: {
    html: "generated HTML",
    stats: {
      processingTime: 45,
      elementCount: 12,
      warningCount: 0
    }
  },
  timestamp: Date.now()
}
```

### Error Messages

```javascript
{
  id: "unique-message-id",
  type: "CONVERSION_ERROR",
  payload: {
    error: "Error description",
    code: "PARSE_ERROR",
    position: {
      line: 5,
      column: 12
    }
  },
  timestamp: Date.now()
}
```

## File Structure

```
src/
├── index.html                 # Main application entry point
├── css/
│   ├── main.css              # Primary styles
│   ├── components.css        # Component-specific styles
│   └── responsive.css        # Mobile responsiveness
├── js/
│   ├── app.js               # Application initialization
│   ├── ui-controller.js     # UI interaction management
│   ├── dom-manager.js       # DOM manipulation utilities
│   ├── clipboard-manager.js # Clipboard operations
│   ├── worker-comm.js       # Web Worker communication
│   └── utils.js            # Shared utilities
└── workers/
    ├── markdown-worker.js   # Main worker thread
    ├── parser-engine.js     # Markdown parsing logic
    ├── html-generator.js    # HTML generation logic
    └── lib/
        └── markdown-lib.js  # Lightweight markdown library
```

## Performance Considerations

### Input Debouncing
- Implement 150ms debounce on input to prevent excessive processing
- Use requestAnimationFrame for smooth UI updates
- Queue management to handle rapid successive inputs

### Memory Management
- Limit processing to reasonable input sizes (10KB default)
- Clean up worker resources for large operations
- Implement garbage collection hints where appropriate

### Optimization Strategies
- Use efficient parsing algorithms (linear complexity)
- Minimize DOM updates through batching
- Implement virtual scrolling for large outputs
- Cache parsed results for identical inputs

## Security Architecture

### Input Sanitization
- HTML entity encoding for all user input
- Whitelist allowed HTML tags and attributes
- Remove potentially dangerous elements (`<script>`, `<iframe>`, etc.)
- Validate URLs in links for safety

### XSS Prevention
- No `innerHTML` usage with unsanitized content
- Use `textContent` and `createElement` for DOM manipulation
- Sanitize all generated HTML before display
- Content Security Policy headers (if served via HTTP)

### Privacy Protection
- No external network requests during operation
- No user data storage or persistence
- No analytics or tracking code
- Client-side only processing guarantee

## Error Handling Strategy

### Graceful Degradation
- Fallback to basic HTML conversion if advanced features fail
- Progressive enhancement based on browser capabilities
- Clear error messages for user guidance
- Recovery mechanisms for worker failures

### Error Categories
- **Parse Errors**: Invalid markdown syntax
- **Generation Errors**: HTML creation failures  
- **System Errors**: Worker or browser issues
- **Network Errors**: CDN failures (if applicable)

## Browser Compatibility

### Modern Browser Features
- Web Workers (required)
- Clipboard API (with fallback)
- ES6+ JavaScript features
- CSS Grid and Flexbox
- Local Storage (optional enhancement)

### Fallback Strategies
- Synchronous processing if workers unavailable
- Manual copy/paste if Clipboard API unsupported
- Basic styling if CSS features unavailable
- Progressive enhancement philosophy 