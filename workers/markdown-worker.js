/**
 * Markdown Worker - Background processing for markdown to HTML conversion
 */

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
 */
function handleConvertMarkdown(message) {
  try {
    const startTime = performance.now();
    const { markdown, options = {} } = message.payload;
    
    // Validate input
    if (!markdown || typeof markdown !== 'string') {
      throw new Error('Invalid markdown input');
    }
    
    // Convert markdown to HTML
    const html = convertMarkdownToHtml(markdown, options);
    
    // Calculate stats
    const processingTime = performance.now() - startTime;
    const stats = calculateStats(markdown, html, processingTime);
    
    // Send successful response
    sendResponse(message.id, MESSAGE_TYPES.CONVERSION_COMPLETE, {
      html,
      stats
    });
    
  } catch (error) {
    // Send error response
    sendResponse(message.id, MESSAGE_TYPES.CONVERSION_ERROR, {
      error: error.message
    });
  }
}

/**
 * Convert markdown to HTML (simple implementation)
 * @param {string} markdown - Input markdown
 * @param {Object} options - Conversion options
 * @returns {string} Generated HTML
 */
function convertMarkdownToHtml(markdown, options = {}) {
  let html = markdown;
  
  // Escape HTML entities first
  html = escapeHtml(html);
  
  // Headers
  html = html.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');
  
  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Links (process before auto-links)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Auto-links (URLs) - simple approach to avoid conflicts
  html = html.replace(/(?<!\")https?:\/\/[^\s<>]+(?![\">])/g, '<a href="$&">$&</a>');
  
  // Auto-links (email)
  html = html.replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, '<a href="mailto:$&">$&</a>');
  
  // Code blocks (fenced)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const className = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${className}>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Code blocks (indented)
  html = html.replace(/^(    .+)$/gm, (match, code) => {
    return `<pre><code>${escapeHtml(code.substring(4))}</code></pre>`;
  });
  
  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Unordered lists
  html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Ordered lists
  html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Tables (basic)
  html = processSimpleTables(html);
  
  // Line breaks and paragraphs
  html = processParagraphs(html);
  
  // Clean up extra whitespace
  html = html.replace(/\n\s*\n/g, '\n');
  html = html.trim();
  
  return html;
}

/**
 * Process simple tables
 * @param {string} html - HTML string
 * @returns {string} HTML with tables
 */
function processSimpleTables(html) {
  const lines = html.split('\n');
  let inTable = false;
  let tableLines = [];
  let result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('|') && line.trim().split('|').length > 2) {
      if (!inTable) {
        inTable = true;
        tableLines = [];
      }
      tableLines.push(line);
    } else {
      if (inTable) {
        // Process accumulated table lines
        result.push(convertTableLines(tableLines));
        tableLines = [];
        inTable = false;
      }
      result.push(line);
    }
  }
  
  // Handle table at end of input
  if (inTable && tableLines.length > 0) {
    result.push(convertTableLines(tableLines));
  }
  
  return result.join('\n');
}

/**
 * Convert table lines to HTML table
 * @param {string[]} lines - Table lines
 * @returns {string} HTML table
 */
function convertTableLines(lines) {
  if (lines.length < 2) return lines.join('\n');
  
  let html = '<table>\n';
  
  // Header row
  const headerCells = lines[0].split('|').map(cell => cell.trim()).filter(cell => cell);
  html += '<thead>\n<tr>\n';
  headerCells.forEach(cell => {
    html += `<th>${cell}</th>\n`;
  });
  html += '</tr>\n</thead>\n';
  
  // Body rows (skip separator line)
  if (lines.length > 2) {
    html += '<tbody>\n';
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').map(cell => cell.trim()).filter(cell => cell);
      html += '<tr>\n';
      cells.forEach(cell => {
        html += `<td>${cell}</td>\n`;
      });
      html += '</tr>\n';
    }
    html += '</tbody>\n';
  }
  
  html += '</table>';
  return html;
}

/**
 * Process paragraphs and line breaks
 * @param {string} html - HTML string
 * @returns {string} HTML with proper paragraphs
 */
function processParagraphs(html) {
  // Split by double line breaks (paragraph separators)
  const paragraphs = html.split(/\n\s*\n/);
  
  const processedParagraphs = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim();
    if (!trimmed) return '';
    
    // Don't wrap block elements in paragraphs
    if (trimmed.match(/^<(h[1-6]|blockquote|pre|ul|ol|table|div)/)) {
      return trimmed;
    }
    
    // Convert single line breaks to <br> within paragraphs
    const withBreaks = trimmed.replace(/\n/g, '<br>');
    return `<p>${withBreaks}</p>`;
  });
  
  return processedParagraphs.filter(p => p).join('\n\n');
}

/**
 * Escape HTML entities
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = { 
    innerHTML: '',
    textContent: text 
  };
  // Simple escape without DOM
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Calculate processing statistics
 * @param {string} markdown - Input markdown
 * @param {string} html - Output HTML
 * @param {number} processingTime - Processing time in ms
 * @returns {Object} Statistics
 */
function calculateStats(markdown, html, processingTime) {
  const stats = {
    processingTime: Math.round(processingTime * 100) / 100,
    inputLength: markdown.length,
    outputLength: html.length,
    elementCount: 0
  };
  
  // Count HTML elements
  const elementMatches = html.match(/<\w+[^>]*>/g);
  stats.elementCount = elementMatches ? elementMatches.length : 0;
  
  // Count specific markdown elements
  stats.headers = (markdown.match(/^#{1,6}\s/gm) || []).length;
  stats.links = (markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
  stats.codeBlocks = (markdown.match(/```[\s\S]*?```/g) || []).length;
  stats.inlineCode = (markdown.match(/`[^`]+`/g) || []).length;
  
  return stats;
}

/**
 * Send response back to main thread
 * @param {string} id - Message ID
 * @param {string} type - Response type
 * @param {Object} payload - Response payload
 */
function sendResponse(id, type, payload) {
  self.postMessage({
    id,
    type,
    payload,
    timestamp: Date.now()
  });
}

/**
 * Main message handler
 */
self.onmessage = function(event) {
  const { id, type, payload } = event.data;
  
  const handler = messageHandlers[type];
  if (handler) {
    handler({ id, type, payload });
  } else {
    sendResponse(id, MESSAGE_TYPES.CONVERSION_ERROR, {
      error: `Unknown message type: ${type}`
    });
  }
};

// Send ready signal
self.postMessage({
  type: MESSAGE_TYPES.WORKER_READY,
  timestamp: Date.now()
}); 