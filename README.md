# Jira Markdown to HTML Converter

A lightweight web application that converts legacy Jira markdown syntax to HTML format that renders properly in Jira Cloud comment boxes.

## Problem Statement

Jira Cloud has changed how it handles markdown formatting in comment boxes. While HTML content pasted into comments renders correctly, traditional markdown syntax like `[Test.com](https://test.com)` no longer renders as formatted links. This tool bridges that gap by converting markdown to HTML locally in the browser.

## Key Features

- **100% Local Processing**: All conversion happens in the browser using Web Workers
- **No Server Communication**: Complete privacy and security - no data leaves your device
- **Real-time Conversion**: See HTML output as you type markdown
- **Copy-Ready Output**: Generated HTML is optimized for pasting into Jira Cloud
- **Lightweight**: Minimal dependencies and fast performance
- **Jira-Specific**: Handles Jira-specific markdown syntax and formatting

## Use Case

1. Paste your legacy Jira markdown into the input box
2. See the converted HTML in real-time
3. Copy the HTML output
4. Paste into Jira Cloud comment box for proper rendering

## Technology Stack

- Vanilla JavaScript (ES6+)
- Web Workers for background processing
- HTML5 and CSS3
- Markdown parsing library (lightweight)
- No build tools required - runs directly in browser

## Project Structure

```
jira_comment/
├── docs/                 # Project documentation
├── src/                  # Source code
│   ├── index.html       # Main application
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript modules
│   └── workers/         # Web Worker files
└── README.md            # Project overview
```

## Getting Started

Simply open `src/index.html` in a modern web browser. No installation or build process required. 