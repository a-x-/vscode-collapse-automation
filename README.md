# Collapse Automation - VS Code Extension

Smart code folding for VS Code that automatically collapses function calls and code blocks based on configurable patterns and AST parsing.

## Features

### 🎯 AST-based Pattern Matching
- Uses TypeScript AST parsing for accurate function call detection
- Distinguishes between actual function calls and string literals
- Supports complex nested function calls

### 📏 Smart Multi-line Detection
- Automatically folds only multi-line function calls
- Single-line function calls are detected but skipped (cannot be folded)
- Provides statistics on both multi-line and single-line matches

### 🧠 Intelligent User Preference Tracking
- Remembers when you manually unfold functions
- Won't re-fold functions you've manually unfolded until next manual command
- Tracks when you manually fold functions back

### 🔄 Precise Folding Algorithm
- Unfolds all before folding to ensure clean state
- Detects already folded functions to avoid redundant operations
- Preserves cursor position during all folding operations

### 🛠️ Flexible Configuration
- **alwaysFold**: Array of function call patterns to always fold (e.g., `["logger.info", "console.log"]`)
- **neverFold**: Patterns that should never be folded in `@collapse` mode
- **@collapse pragma**: Add `// @collapse` to any file to fold all code blocks
- **collapseLevel**: Control folding depth in pragma mode (default: 1)
- **enableCollapsePragma**: Enable/disable pragma functionality

### ⚡ Performance Optimizations
- Immediate analysis on file switch (no delay)
- Debounced analysis for text changes (500ms)
- Language filtering - only processes JS/JSX/TS/TSX files
- Recursion prevention for output channels

### 📝 Supported Languages
- JavaScript (`.js`)
- TypeScript (`.ts`)
- JSX (`.jsx`)
- TSX (`.tsx`)

## Extension Settings

This extension contributes the following settings:

* `collapse-automation.alwaysFold`: Array of function call patterns to always fold
* `collapse-automation.neverFold`: Patterns to never fold in `@collapse` mode
* `collapse-automation.collapseLevel`: Folding level for `@collapse` pragma (default: 1)
* `collapse-automation.enableCollapsePragma`: Enable/disable `@collapse` pragma functionality

## Commands

* `Auto Collapse: Run Analysis` - Manually trigger folding analysis on the current file

## Usage Examples

### Pattern-based Folding
```json
{
  "collapse-automation.alwaysFold": [
    "logger.info",
    "logger.error",
    "console.log",
    "console.error"
  ]
}
```

### Pragma-based Folding
```javascript
// @collapse
// This file will have all code blocks folded according to collapseLevel setting

function example() {
  // code here
}
```

## How It Works

1. The extension uses AST parsing to find function calls matching your patterns
2. Only multi-line function calls are folded (single-line calls are skipped)
3. User preferences are tracked - manually unfolded functions stay unfolded
4. Before folding, all code is unfolded to ensure a clean state
5. Already folded functions are detected and skipped

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

---

### For more information

- [GitHub Repository](https://github.com/a-x-/vscode-collapse-automation)
- [Report Issues](https://github.com/a-x-/vscode-collapse-automation/issues)

**Enjoy!**