# BDD Tests for Collapse Automation

This directory contains Behavior-Driven Development (BDD) tests for the Collapse Automation VS Code extension.

## Test Structure

Tests are organized by user stories and follow the Given-When-Then format:

- **Given**: The initial context or state
- **When**: The action or event that occurs
- **Then**: The expected outcome

## User Stories Covered

1. **Auto-folding logger calls**
   - Multi-line function calls are folded
   - Single-line calls are not folded
   - Manually unfolded functions stay unfolded

2. **Using @collapse pragma**
   - All code blocks are folded when pragma is present
   - neverFold patterns are respected
   - Pragma can be disabled via configuration

3. **Manual collapse commands**
   - "Collapse all non-important code blocks" command
   - "Collapse all blocks" command (outline view)

4. **Language filtering**
   - Only JS/JSX/TS/TSX files are processed
   - Other languages are ignored

5. **AST-based detection**
   - Function calls in strings are not folded
   - Only real function calls are detected

6. **Performance and edge cases**
   - Immediate folding on file switch
   - No errors with empty documents
   - Proper handling of configuration changes

## Running Tests

```bash
# Run all tests
bun run test

# Watch mode for development
bun run test:watch
```

## Test Implementation Details

- Tests use VS Code's testing API
- Each test creates temporary documents to simulate real usage
- Configuration is saved/restored between tests
- Tests wait for extension processing to complete
- Folding state is verified by checking visible ranges

## Adding New Tests

When adding new tests:

1. Follow the Given-When-Then format
2. Group related tests in suites
3. Use descriptive test names that explain the user scenario
4. Clean up after tests (close editors, restore config)
5. Use helper functions for common operations