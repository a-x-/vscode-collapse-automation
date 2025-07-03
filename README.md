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

- `collapse-automation.alwaysFold`: Array of function call patterns to always fold
  - Default: `["logger.info", "logger.warn", "logger.error", "logger.debug", "logger.trace", "logger.fatal", "console.log", "console.warn", "console.error", "console.debug", "console.trace", "console.info"]`
- `collapse-automation.neverFold`: Patterns to never fold in `@collapse` mode
  - Default: `["main"]`
- `collapse-automation.collapseLevel`: Folding level for `@collapse` pragma
  - Default: `1`
- `collapse-automation.enableCollapsePragma`: Enable/disable `@collapse` pragma functionality
  - Default: `true`

## Commands

- `Collapse Automation: Collapse all non-important code blocks` - Analyzes and folds function calls based on your patterns
- `Collapse Automation: Collapse all blocks (Outline View)` - Folds all code blocks like `@collapse` pragma but without adding it to file

## Usage Examples

### Pattern-based Folding

The extension comes with sensible defaults for common logging patterns. You can extend or override these defaults:

```json
{
  "collapse-automation.alwaysFold": [
    // These are already included by default:
    // "logger.info", "logger.warn", "logger.error", 
    // "logger.debug", "logger.trace", "logger.fatal",
    // "console.log", "console.warn", "console.error",
    // "console.debug", "console.trace", "console.info",
    
    // Add your custom patterns:
    "console.group",
    "console.groupEnd",
    "console.time",
    "console.timeEnd",
    "debugger",
    "assert",
    "chai.expect",
    "expect",
    "cy.log",
    "cy.debug"
  ]
}
```

### Common Use Cases

#### For Backend Development

```json
{
  "collapse-automation.alwaysFold": [
    "logger.info",
    "logger.debug",
    "logger.trace",
    "winston.info",
    "winston.debug",
    "pino.info",
    "bunyan.info"
  ]
}
```

#### For Frontend Development

```json
{
  "collapse-automation.alwaysFold": [
    "console.log",
    "console.debug",
    "console.info",
    "debugger"
  ]
}
```

#### For Testing

```json
{
  "collapse-automation.alwaysFold": [
    "describe",
    "it",
    "test",
    "beforeEach",
    "afterEach",
    "cy.log",
    "cy.debug"
  ]
}
```

### Pragma-based Folding

```javascript
// @collapse
// This file will have all code blocks folded according to collapseLevel setting

function example() {
  console.log("This will be folded", {
    because: "it's a multi-line function call",
    and: "matches the alwaysFold patterns",
    such: "awesome",
    much: "wow"
  });
}
```

Will be visually folded like this:

```javascript
function example() {
  // This will be folded
> console.log("This will be folded", {
  });
}
```

## How It Works

1. The extension uses AST parsing to find function calls matching your patterns
2. Only multi-line function calls are folded (single-line calls are skipped)
3. User preferences are tracked - manually unfolded functions stay unfolded
4. Before folding, all code is unfolded to ensure a clean state
5. Already folded functions are detected and skipped

## Development

This extension uses:

- **Biome** for linting and formatting (not ESLint)
- **TypeScript** for type safety
- **Bun** as the runtime and package manager
- **Vite** for building

### Development Commands

```bash
# Install dependencies
bun install

# Run linting
bun run lint

# Run linting with auto-fix
bun run lint:fix

# Build the extension
bun run build

# Run tests
bun run test

# Package the extension
bun run package

# Bump version (patch)
bun run version:patch

# Bump version (minor)
bun run version:minor

# Publish to VS Code Marketplace
bun run publish
```

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

---

### For more information

- [GitHub Repository](https://github.com/a-x-/vscode-collapse-automation)
- [Report Issues](https://github.com/a-x-/vscode-collapse-automation/issues)

**Enjoy!**
