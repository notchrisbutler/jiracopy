# User Guide

## Getting Started

### What is the Jira Markdown to HTML Converter?

This tool helps you convert legacy Jira markdown syntax into HTML format that renders properly in Jira Cloud comment boxes. When you paste HTML into Jira Cloud, it renders with proper formatting, while traditional markdown syntax often displays as plain text.

### Quick Start

1. **Open the Application**: Navigate to `src/index.html` in your web browser
2. **Paste Your Markdown**: Copy your Jira markdown text and paste it into the left input area
3. **See the Results**: The HTML conversion appears instantly in the right output area
4. **Copy the HTML**: Click the "Copy HTML" button to copy the generated HTML
5. **Paste in Jira**: Paste the copied HTML into your Jira Cloud comment box

### System Requirements

- **Modern Web Browser**: Chrome 80+, Firefox 75+, Safari 13+, or Edge 80+
- **Internet Connection**: Only required for initial loading (optional CDN resources)
- **JavaScript Enabled**: Required for application functionality
- **No Installation**: Runs directly in your browser

## Using the Application

### Interface Overview

The application features a clean, two-panel interface:

**Left Panel - Markdown Input**
- Large text area for entering markdown
- Real-time character count
- Scroll support for long content
- Syntax highlighting (visual cues)

**Right Panel - HTML Output**
- Generated HTML display
- Copy button for easy clipboard access
- Processing time and statistics
- Preview of how content will appear

**Status Bar**
- Processing time indicator
- Element count (headings, links, etc.)
- Error messages (if any)
- Copy operation feedback

### Basic Usage Examples

#### Text Formatting

**Input (Markdown):**
```markdown
This text contains *italic*, **bold**, and `code` formatting.
You can also use ~~strikethrough~~ text.
```

**Output (HTML):**
```html
<p>This text contains <em>italic</em>, <strong>bold</strong>, and <code>code</code> formatting.
You can also use <del>strikethrough</del> text.</p>
```

#### Links

**Input (Markdown):**
```markdown
Visit [Google](https://google.com) or email support@example.com
Auto-link: https://www.atlassian.com
```

**Output (HTML):**
```html
<p>Visit <a href="https://google.com">Google</a> or email <a href="mailto:support@example.com">support@example.com</a>
Auto-link: <a href="https://www.atlassian.com">https://www.atlassian.com</a></p>
```

#### Headers

**Input (Markdown):**
```markdown
# Main Title
## Section Header
### Subsection
#### Minor Header
```

**Output (HTML):**
```html
<h1>Main Title</h1>
<h2>Section Header</h2>
<h3>Subsection</h3>
<h4>Minor Header</h4>
```

#### Lists

**Input (Markdown):**
```markdown
Unordered list:
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

Ordered list:
1. First step
2. Second step
3. Third step
```

**Output (HTML):**
```html
<p>Unordered list:</p>
<ul>
<li>First item</li>
<li>Second item
<ul>
<li>Nested item</li>
<li>Another nested item</li>
</ul>
</li>
<li>Third item</li>
</ul>

<p>Ordered list:</p>
<ol>
<li>First step</li>
<li>Second step</li>
<li>Third step</li>
</ol>
```

#### Code Blocks

**Input (Markdown):**
```markdown
Inline code: `console.log('Hello World')`

Fenced code block:
```javascript
function greet(name) {
    return `Hello, ${name}!`;
}
```

**Output (HTML):**
```html
<p>Inline code: <code>console.log('Hello World')</code></p>

<p>Fenced code block:</p>
<pre><code class="language-javascript">function greet(name) {
    return `Hello, ${name}!`;
}</code></pre>
```

#### Tables

**Input (Markdown):**
```markdown
| Name | Role | Department |
|------|------|------------|
| John | Developer | Engineering |
| Jane | Designer | UX Team |
| Bob | Manager | Operations |
```

**Output (HTML):**
```html
<table>
<thead>
<tr>
<th>Name</th>
<th>Role</th>
<th>Department</th>
</tr>
</thead>
<tbody>
<tr>
<td>John</td>
<td>Developer</td>
<td>Engineering</td>
</tr>
<tr>
<td>Jane</td>
<td>Designer</td>
<td>UX Team</td>
</tr>
<tr>
<td>Bob</td>
<td>Manager</td>
<td>Operations</td>
</tr>
</tbody>
</table>
```

#### Blockquotes

**Input (Markdown):**
```markdown
> This is a blockquote.
> It can span multiple lines.
> 
> > Nested blockquotes are also supported.
```

**Output (HTML):**
```html
<blockquote>
<p>This is a blockquote.
It can span multiple lines.</p>
<blockquote>
<p>Nested blockquotes are also supported.</p>
</blockquote>
</blockquote>
```

### Jira-Specific Features

#### Preserving Jira Elements

The converter preserves certain Jira-specific elements that Jira Cloud will handle automatically:

**Mentions:**
- Input: `@john.doe will review this`
- Output: `<p>@john.doe will review this</p>`
- *Note: Jira Cloud will automatically convert @username to user links*

**Issue Links:**
- Input: `Related to ABC-123 and DEF-456`
- Output: `<p>Related to ABC-123 and DEF-456</p>`
- *Note: Jira Cloud will automatically convert issue keys to links*

**Smart Commits:**
- Input: `Fixed bug in {code}UserService{code}`
- Output: `<p>Fixed bug in <code>UserService</code></p>`

### Advanced Usage

#### Large Documents

For documents larger than 1KB:
1. The application may show a brief processing indicator
2. Processing happens in the background (Web Worker)
3. The UI remains responsive during conversion
4. Results appear when processing completes

#### Copy Operation

**Using the Copy Button:**
1. Click the "Copy HTML" button in the output panel
2. Success feedback appears briefly
3. HTML is now in your clipboard
4. Paste directly into Jira Cloud

**Keyboard Shortcuts:**
- `Ctrl+A` (or `Cmd+A`) in output area to select all
- `Ctrl+C` (or `Cmd+C`) to copy selected HTML
- Standard browser shortcuts work throughout

#### Error Recovery

If processing fails:
1. Check for malformed markdown syntax
2. Reduce input size if very large
3. Refresh the page to reset the application
4. Try processing smaller sections individually

## Troubleshooting

### Common Issues

#### "Copy Failed" Message

**Problem**: Copy button shows error message
**Causes**:
- Browser doesn't support Clipboard API
- User denied clipboard permissions
- Security restrictions in current context

**Solutions**:
1. Try manual selection and copy (Ctrl+C)
2. Enable clipboard permissions in browser settings
3. Use a different browser
4. Check if running from localhost vs file://

#### Slow Processing

**Problem**: Conversion takes longer than expected
**Causes**:
- Very large input document
- Complex nested structures
- Browser performance issues

**Solutions**:
1. Break large documents into smaller sections
2. Close other browser tabs to free memory
3. Refresh the page to reset state
4. Try a different browser

#### Incorrect HTML Output

**Problem**: Generated HTML doesn't match expected format
**Causes**:
- Malformed markdown syntax
- Unsupported markdown features
- Edge cases in parsing

**Solutions**:
1. Check markdown syntax carefully
2. Refer to supported features list
3. Test with simpler examples first
4. Use standard markdown syntax

#### Application Won't Load

**Problem**: Page appears blank or shows errors
**Causes**:
- JavaScript disabled
- Browser compatibility issues
- Network connection problems
- File permission issues

**Solutions**:
1. Enable JavaScript in browser settings
2. Try a different browser
3. Check browser console for error messages
4. Ensure files aren't blocked by security software

### Browser-Specific Issues

#### Safari Issues
- **Clipboard API**: May require user interaction before each copy
- **Web Workers**: Should work in Safari 13+
- **Solution**: Use manual copy/paste if automatic copy fails

#### Firefox Issues
- **File Protocol**: Some features may not work from file:// URLs
- **Solution**: Serve from local web server or use supported browser

#### Chrome Issues
- **CORS Restrictions**: May affect local file loading
- **Solution**: Use --allow-file-access-from-files flag or local server

### Performance Optimization

#### For Large Documents
1. **Break into sections**: Process smaller chunks individually
2. **Remove unnecessary elements**: Strip non-essential formatting
3. **Use simpler syntax**: Avoid deeply nested structures
4. **Clear cache**: Refresh page periodically

#### For Slow Devices
1. **Reduce input size**: Work with smaller documents
2. **Close other applications**: Free system memory
3. **Use newer browser**: Modern browsers perform better
4. **Enable hardware acceleration**: Check browser settings

### Getting Help

#### Self-Diagnosis Steps
1. **Check browser console**: Look for JavaScript errors
2. **Test with simple input**: Verify basic functionality
3. **Try different browser**: Rule out compatibility issues
4. **Clear browser cache**: Remove stored data

#### Supported Markdown Elements
- ✅ Headers (H1-H6)
- ✅ Paragraphs and line breaks
- ✅ Bold, italic, strikethrough
- ✅ Links (standard and auto-detected)
- ✅ Lists (ordered, unordered, nested)
- ✅ Code (inline and code blocks)
- ✅ Tables
- ✅ Blockquotes
- ❌ Custom HTML tags
- ❌ Mathematical expressions
- ❌ Diagrams and charts

#### Limitations
- **Input size**: Maximum 10,000 characters
- **Nesting depth**: Maximum 10 levels for lists/quotes
- **Security**: Some HTML elements are filtered for safety
- **Offline only**: No cloud features or synchronization

## Best Practices

### Preparing Your Markdown

1. **Use standard syntax**: Stick to common markdown patterns
2. **Test incrementally**: Process small sections first
3. **Validate links**: Ensure URLs are properly formatted
4. **Check nesting**: Avoid excessively deep structures
5. **Preview in Jira**: Test final HTML in actual Jira comments

### Optimizing for Jira Cloud

1. **Keep it simple**: Complex formatting may not render well
2. **Test early**: Verify HTML works in your Jira instance
3. **Use semantic HTML**: Tables, lists, and headers work best
4. **Avoid inline styles**: Jira may strip custom styling
5. **Consider mobile**: Ensure content works on mobile devices

### Workflow Integration

1. **Bookmark the tool**: Quick access for regular use
2. **Create templates**: Save common markdown patterns
3. **Batch processing**: Convert multiple sections together
4. **Quality check**: Always review output before posting
5. **Keep originals**: Maintain markdown sources for future edits 