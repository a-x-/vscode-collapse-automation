# Collapse Automation - VS Code Extension

Smart code folding for VS Code that automatically collapses logger calls and code blocks based on configurable patterns.

## Features

### 🎯 Smart Function Call Detection
- Uses AST parsing to accurately detect function calls (not just string matches)
- Automatically folds multi-line function calls like `logger.info()`, `console.log()`, etc.
- Single-line calls are ignored since they can't be folded

### 🔄 Intelligent Folding
- Immediate analysis when switching files (no delay)
- Respects user preferences - won't re-fold functions you manually unfold
- Tracks when you manually fold/unfold functions
- Preserves cursor position during folding operations

### 🛠️ Flexible Configuration
- **alwaysFold**: Patterns for function calls to always fold (e.g., `["logger.info", "console.log"]`)
- **neverFold**: Patterns that should never be folded when using `@collapse` pragma
- **@collapse pragma**: Add `// @collapse` to any file to fold all code blocks

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

## Release Notes

### 0.0.18

Latest stable release with all features

---

### For more information

- If you found an issue with this extension, please submit an issue within this repo to bring it to our attention
- For more language support, please submit an issue and we will add them shortly!

**Enjoy!**
