# Changelog

All notable changes to the "collapse-automation" extension will be documented in this file.

## [0.0.34] - 2025-01-03

🐛 Fixed:

- Fixed cursor jumping issue when folding code - now uses `selectionLines` parameter to fold without changing cursor position
- Cursor position and multiple selections are now preserved during all folding operations
- Removed unnecessary cursor position save/restore code since we no longer change selections

🧽 Chore:

- Reorganized test structure:
  - Renamed `simple.test.ts` to `unit.test.ts`
  - Renamed `extension.test.ts` to `bdd.test.ts`
- Added comprehensive unit tests for cursor position preservation
- Improved folding performance by batching fold operations

## [0.0.33] - 2025-01-03

✨ Added:

- Default patterns for common logging functions in `alwaysFold` configuration:
  - Logger patterns: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`, `logger.trace`, `logger.fatal`
  - Console patterns: `console.log`, `console.warn`, `console.error`, `console.debug`, `console.trace`, `console.info`
- Users no longer need to manually configure common logging patterns

🧽 Chore:

- Split `bump-version.js` into two separate scripts for better workflow control:
  - `bump-version.js` - Updates version in package.json
  - `create-tag.js` - Creates git tag based on current version
- Updated README.md to show new default configuration values
- Updated tests to work with new default patterns

## [0.0.32] - 2025-01-03

✨ Added:

- Import preservation: when unfolding all, previously folded imports are automatically re-folded
- Comprehensive BDD tests covering all user scenarios
- Test runner configured for TypeScript tests using esbuild-register

🐛 Fixed:

- Fixed VS Code command for unfold levels (using unfoldRecursively instead of non-existent unfoldLevel commands)
- Fixed all test failures by removing visual folding dependencies
- Improved test stability in headless environment

🧽 Chore:

- Added proper test infrastructure for TypeScript
- Updated test output formatting (TAP reporter for cleaner output)
- Added workflow documentation in CLAUDE.md

## [0.0.31] - 2025-01-03

✨ Added:

- Comprehensive BDD (Behavior-Driven Development) tests covering all user scenarios
- Test documentation explaining BDD approach and test structure
- Fixed test runner to use Bun directly without TypeScript compilation step
- Import preservation: when unfolding all, previously folded imports are re-folded automatically

🧽 Chore:

- Added automatic git tagging to version bump script
- Added --minor flag support for minor version bumps
- Script now creates git tags automatically (e.g., v0.0.31)
- Fixed TypeScript types - replaced `any` with proper `TSESTree.Node` type
- Added Development section to README noting Biome usage (not ESLint)
- Added note to CLAUDE.md about not using `any` types
- Fixed walkNode function to use proper TypeScript types without `any`
- Converted test suite from JavaScript to TypeScript
- Fixed test runner to work with TypeScript files using esbuild-register

🐛 Fixed:

- Fixed incorrect VS Code command for unfold levels (using unfoldRecursively)
- Added simple unit tests that work reliably in headless environment
- Fixed test infrastructure for TypeScript support
- Fixed all failing tests by removing dependency on visual folding state
- Added proper test setup/cleanup for configuration

## [0.0.28] - 2025-01-03

✨ Added:

- Updated VS Code settings

🧽 Chore:

- Better code formatting with biome (space indentation, single quotes)
- Organized imports using biome
- Code reformatted to match project style guidelines

## [0.0.26] - 2025-01-03

✨ Added:

- VS Code settings for biome formatter
- Development workflow instructions in CLAUDE.md
- More detailed usage examples with visual representation

🔄 Changed:

- Updated biome configuration with line width 120
- Improved documentation

## [0.0.25] - 2025-01-03

✨ Added:

- New command "Collapse all blocks (Outline View)" - works like @collapse pragma but manual
- More usage examples for alwaysFold configuration
- MIT license

🔄 Changed:

- Renamed command from "Run Analysis" to "Collapse all non-important code blocks"
- Command titles now more descriptive

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
