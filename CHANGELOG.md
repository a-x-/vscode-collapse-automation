# Changelog

All notable changes to the "collapse-automation" extension will be documented in this file.

## [0.0.19] - 2025-01-03

✨ Added:

- TypeScript conversion of entire codebase
- tsconfig.json for proper TypeScript compilation
- Type safety throughout the extension

🔄 Changed:

- Converted lib/extension.js to lib/extension.ts
- Updated build process to compile TypeScript
- Updated biome.json to support TypeScript formatting

## [0.0.18] - 2025-01-02

✨ Added:

- User preference tracking - extension now remembers when users manually unfold functions
- Tracking for when users fold back previously unfolded functions
- Cursor position preservation during folding operations
- Automatic version bumping after build
- Comprehensive logging for folding operations

🔄 Changed:

- Manual command now clears the manually unfolded list for fresh analysis

## [0.0.17]

✨ Added:

- Check if code is already folded before attempting to fold
- Skip already folded functions to improve performance

## [0.0.16]

✨ Added:

- Command to increment patch version in package.json
- bump-version.js script for version management

## [0.0.15]

🐛 Fixed:

- Improved folding precision to only fold the function call itself, not parent blocks

## [0.0.14]

✨ Added:

- Logging when single-line function calls are found but can't be folded
- Better diagnostic output for debugging

## [0.0.13]

🔄 Changed:

- Immediate analysis on file switch (removed 500ms delay for file switching)
- Kept debouncing for text changes to avoid performance issues

## [0.0.12]

✨ Added:

- AST-based parsing using @typescript-eslint/typescript-estree
- Accurate detection of function calls vs string literals
- Support for multi-line function call detection

🔄 Changed:

- Only multi-line function calls are folded (single-line calls ignored)

## [0.0.11]

✨ Added:

- Language filtering - only analyzes JS/JSX/TS/TSX files
- Better recursion prevention

## [0.0.10]

🐛 Fixed:

- Critical fix for infinite recursion bug
- Extension no longer analyzes its own output channel
- Added checks to skip output channels and extension-related files

## [0.0.9]

✨ Added:

- Support for alwaysFold configuration
- Pattern matching for function calls like logger.info, console.log

## [0.0.8]

✨ Added:

- neverFold configuration option

## [0.0.1] - 2024-12-30

✨ Added:

- Initial release
- @collapse pragma support
- Basic code folding functionality
- Support for multiple languages
