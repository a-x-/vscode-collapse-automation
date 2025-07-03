import { parse, type TSESTree } from '@typescript-eslint/typescript-estree';
import {
    commands,
    type ExtensionContext,
    type OutputChannel,
    Position,
    Selection,
    type TextDocument,
    window,
    workspace,
} from 'vscode';

let outputChannel: OutputChannel;
let timeout: NodeJS.Timeout | null = null;
let isProcessing = false;
// Map to store manually unfolded functions per document
const manuallyUnfolded = new Map<string, Set<number>>(); // Map<documentUri, Set<lineNumber>>

interface FunctionCall {
    pattern: string;
    startLine: number;
    endLine: number;
}

/**
 * Find function calls matching the pattern using AST and return their locations
 * @param text - The full document text
 * @param patterns - The patterns to match (e.g., ["logger.info", "logger.error"])
 * @returns Array of matches with line numbers
 */
function findFunctionCalls(text: string, patterns: string[]): { multiLine: FunctionCall[]; singleLine: number } {
    const matches: FunctionCall[] = [];
    let singleLineCount = 0;

    try {
        // Parse the entire document
        const ast = parse(text, {
            ecmaVersion: 'latest',
            sourceType: 'module',
            jsx: true,
            errorOnUnknownASTType: false,
            range: true,
            loc: true,
        });

        // Walk the AST to find matching call expressions
        function walkNode(node: TSESTree.Node | null | undefined): void {
            if (!node || typeof node !== 'object') return;

            // Check if this is a matching member expression call
            if (node.type === 'CallExpression' && node.callee && node.loc) {
                if (node.callee.type === 'MemberExpression' && node.callee.object && node.callee.property) {
                    // Check each pattern
                    for (const pattern of patterns) {
                        if (!pattern.includes('.')) continue;

                        const [objectName, methodName] = pattern.split('.');

                        if (
                            node.callee.object.type === 'Identifier' &&
                            node.callee.object.name === objectName &&
                            node.callee.property.type === 'Identifier' &&
                            node.callee.property.name === methodName
                        ) {
                            // Found a match, check if it's multi-line
                            const startLine = node.loc.start.line - 1; // Convert to 0-based
                            const endLine = node.loc.end.line - 1;

                            if (startLine !== endLine) {
                                matches.push({
                                    pattern,
                                    startLine,
                                    endLine,
                                });
                            } else {
                                singleLineCount++;
                            }
                        }
                    }
                }
            }

            // Use TypeScript ESTree visitor pattern
            const nodeAsRecord = node as unknown as Record<string, unknown>;

            // Recursively check all child nodes
            for (const key in nodeAsRecord) {
                if (key !== 'parent' && key !== 'type' && key !== 'loc' && key !== 'range') {
                    const value = nodeAsRecord[key];
                    if (value) {
                        if (Array.isArray(value)) {
                            for (const child of value) {
                                if (child && typeof child === 'object' && 'type' in child) {
                                    walkNode(child as TSESTree.Node);
                                }
                            }
                        } else if (typeof value === 'object' && 'type' in value) {
                            walkNode(value as TSESTree.Node);
                        }
                    }
                }
            }
        }

        walkNode(ast);
    } catch (e) {
        outputChannel.appendLine(`- ERROR parsing document for AST: ${(e as Error).message}`);
    }

    return { multiLine: matches, singleLine: singleLineCount };
}

export function activate(context: ExtensionContext): void {
    outputChannel = window.createOutputChannel('Collapse Automation');
    outputChannel.appendLine('Extension "collapse-automation" is now active.');

    const triggerAnalysis = (document: TextDocument): void => {
        if (document) {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                analyzeAndFold(document);
            }, 500);
        }
    };

    const disposable = workspace.onDidChangeTextDocument((event) => {
        if (!isProcessing) {
            triggerAnalysis(event.document);
        }
    });

    const openDisposable = workspace.onDidOpenTextDocument((document) => {
        // Run immediately for newly opened documents
        analyzeAndFold(document);
    });

    const activeEditorDisposable = window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            // Run immediately when switching files
            analyzeAndFold(editor.document);
        }
    });

    // Track when user manually unfolds
    const visibleRangeDisposable = window.onDidChangeTextEditorVisibleRanges((event) => {
        if (isProcessing) return; // Skip if we're processing

        const editor = event.textEditor;
        const document = editor.document;
        const docUri = document.uri.toString();

        // Skip non-supported files
        const supportedLanguages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
        if (!supportedLanguages.includes(document.languageId)) {
            return;
        }

        // Get the set of manually unfolded lines for this document
        if (!manuallyUnfolded.has(docUri)) {
            manuallyUnfolded.set(docUri, new Set<number>());
        }
        const manuallyUnfoldedLines = manuallyUnfolded.get(docUri) || new Set<number>();
        const previousSize = manuallyUnfoldedLines.size;

        // Find function calls in this document
        const result = findFunctionCalls(
            document.getText(),
            workspace.getConfiguration('collapse-automation').get<string[]>('alwaysFold', []),
        );

        // Check which ones are now visible (unfolded) or folded
        for (const call of result.multiLine) {
            if (call.endLine > call.startLine) {
                const middleLine = call.startLine + 1;
                const isNowVisible = event.visibleRanges.some(
                    (range) => range.start.line <= middleLine && range.end.line >= middleLine,
                );

                if (isNowVisible && !manuallyUnfoldedLines.has(call.startLine)) {
                    // This was unfolded, remember it
                    manuallyUnfoldedLines.add(call.startLine);
                    const lineText = document.lineAt(call.startLine).text.trim();
                    outputChannel.appendLine(
                        `- User manually unfolded ${call.pattern} at line ${call.startLine + 1}: ${lineText.substring(0, 50)}...`,
                    );
                } else if (!isNowVisible && manuallyUnfoldedLines.has(call.startLine)) {
                    // This was folded back by user, remove from manually unfolded
                    manuallyUnfoldedLines.delete(call.startLine);
                    const lineText = document.lineAt(call.startLine).text.trim();
                    outputChannel.appendLine(
                        `- User manually folded back ${call.pattern} at line ${call.startLine + 1}: ${lineText.substring(0, 50)}...`,
                    );
                }
            }
        }

        // Log summary if anything changed
        if (manuallyUnfoldedLines.size !== previousSize) {
            outputChannel.appendLine(`- Total manually unfolded functions: ${manuallyUnfoldedLines.size}`);
        }
    });

    // Register the manual command
    const commandDisposable = commands.registerCommand('collapse-automation.activate', () => {
        if (window.activeTextEditor) {
            // Clear timeout to run immediately
            if (timeout) {
                clearTimeout(timeout);
            }
            analyzeAndFold(window.activeTextEditor.document, true); // true = manual command
        } else {
            window.showInformationMessage('No active editor found');
        }
    });

    // Register the collapse all command (like @collapse but manual)
    const collapseAllDisposable = commands.registerCommand('collapse-automation.collapseAll', async () => {
        const editor = window.activeTextEditor;
        if (!editor) {
            window.showInformationMessage('No active editor found');
            return;
        }

        const document = editor.document;

        // Save current cursor position
        const savedSelections = editor.selections.map((sel) => new Selection(sel.anchor, sel.active));

        outputChannel.appendLine(`\n=== MANUAL COLLAPSE ALL at ${new Date().toISOString()} ===`);
        outputChannel.appendLine(`Document: ${document.uri.fsPath}`);

        // Execute collapse all
        await commands.executeCommand('editor.foldAll');

        const config = workspace.getConfiguration('collapse-automation');
        const collapseLevel = config.get<number>('collapseLevel', 1);
        const neverFold = config.get<string[]>('neverFold', []);

        // Apply collapse level
        if (collapseLevel > 0) {
            outputChannel.appendLine(`- Applying collapse level ${collapseLevel}`);
            // VS Code doesn't have unfoldLevel command, so we need to unfold recursively
            for (let i = 0; i < collapseLevel; i++) {
                await commands.executeCommand('editor.unfoldRecursively');
            }
        }

        // Apply neverFold patterns
        if (neverFold.length > 0) {
            const text = document.getText();
            const lines = text.split('\n');
            const unfoldPositions: Position[] = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                for (const pattern of neverFold) {
                    try {
                        if (new RegExp(pattern).test(line)) {
                            unfoldPositions.push(new Position(i, 0));
                            break;
                        }
                    } catch (e) {
                        outputChannel.appendLine(
                            `- ERROR: Invalid regex pattern '${pattern}': ${(e as Error).message}`,
                        );
                    }
                }
            }

            if (unfoldPositions.length > 0) {
                editor.selections = unfoldPositions.map((pos) => new Selection(pos, pos));
                await commands.executeCommand('editor.unfold');
            }
        }

        // Restore cursor position
        editor.selections = savedSelections;

        outputChannel.appendLine(`=== MANUAL COLLAPSE ALL COMPLETED ===\n`);
    });

    context.subscriptions.push(
        disposable,
        openDisposable,
        activeEditorDisposable,
        visibleRangeDisposable,
        commandDisposable,
        collapseAllDisposable,
    );

    // Analyze current active editor on activation
    if (window.activeTextEditor) {
        triggerAnalysis(window.activeTextEditor.document);
    }
}

async function analyzeAndFold(document: TextDocument, isManualCommand: boolean = false): Promise<void> {
    // Skip output channels to prevent recursion
    if (
        document.uri.scheme === 'output' ||
        document.uri.fsPath.includes('extension-output') ||
        document.uri.fsPath.includes('Collapse Automation')
    ) {
        return;
    }

    // Only analyze JS/JSX/TS/TSX files
    const supportedLanguages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
    if (!supportedLanguages.includes(document.languageId)) {
        return;
    }

    // Ensure we have an active editor for this document
    const editor = window.activeTextEditor;
    if (!editor || editor.document !== document) {
        outputChannel.appendLine('- No active editor for this document, skipping');
        return;
    }

    // Save current cursor position
    const savedSelections = editor.selections.map((sel) => new Selection(sel.anchor, sel.active));

    // If manual command, clear the manually unfolded list for this document
    if (isManualCommand) {
        manuallyUnfolded.delete(document.uri.toString());
        outputChannel.appendLine('- Manual command: cleared manually unfolded list');
    }

    outputChannel.appendLine(`\n=== ANALYZE START at ${new Date().toISOString()} ===`);
    outputChannel.appendLine(`Document: ${document.uri.fsPath}`);
    outputChannel.appendLine(`isProcessing was: ${isProcessing}`);
    isProcessing = true;
    outputChannel.appendLine(`isProcessing now: ${isProcessing}`);

    const config = workspace.getConfiguration('collapse-automation');
    const alwaysFold = config.get<string[]>('alwaysFold', []);
    const neverFold = config.get<string[]>('neverFold', []);
    const collapseLevel = config.get<number>('collapseLevel', 1);
    const enableCollapsePragma = config.get<boolean>('enableCollapsePragma', true);

    outputChannel.appendLine(`- Config: alwaysFold: [${alwaysFold.join(', ')}] (length: ${alwaysFold.length})`);
    outputChannel.appendLine(`- Config: neverFold: [${neverFold.join(', ')}] (length: ${neverFold.length})`);
    outputChannel.appendLine(`- Config: collapseLevel: ${collapseLevel}`);
    outputChannel.appendLine(`- Config: enableCollapsePragma: ${enableCollapsePragma}`);

    // Check if features should be disabled
    const shouldSkip = (!enableCollapsePragma || alwaysFold.length === 0) && alwaysFold.length === 0;
    if (shouldSkip) {
        outputChannel.appendLine('- SKIPPING: No active folding rules (alwaysFold is empty and pragma disabled)');
        isProcessing = false;
        outputChannel.appendLine(`=== ANALYZE END (skipped) ===\n`);
        return;
    }

    const text = document.getText();
    const lines = text.split('\n');
    outputChannel.appendLine(`- Document has ${lines.length} lines`);

    const hasCollapsePragma = enableCollapsePragma && lines.some((line) => line.includes('// @collapse'));
    outputChannel.appendLine(`- Has @collapse pragma: ${hasCollapsePragma}`);

    if (hasCollapsePragma) {
        outputChannel.appendLine("- ACTION: Found '@collapse' pragma. Will apply folding rules.");
        outputChannel.appendLine('- EXECUTING: editor.foldAll');
        await commands.executeCommand('editor.foldAll');
        outputChannel.appendLine('- COMPLETED: editor.foldAll');

        if (collapseLevel > 0) {
            outputChannel.appendLine(`- EXECUTING: unfold recursively ${collapseLevel} times`);
            for (let i = 0; i < collapseLevel; i++) {
                await commands.executeCommand('editor.unfoldRecursively');
            }
            outputChannel.appendLine(`- COMPLETED: unfold recursively`);
        }
        const unfoldPositions: Position[] = [];
        if (neverFold.length > 0) {
            outputChannel.appendLine(`- Checking neverFold patterns...`);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                for (const pattern of neverFold) {
                    try {
                        if (new RegExp(pattern).test(line)) {
                            outputChannel.appendLine(
                                `  - Line ${i + 1} matches neverFold pattern '${pattern}': ${line.substring(0, 50)}...`,
                            );
                            unfoldPositions.push(new Position(i, 0));
                            break;
                        }
                    } catch (e) {
                        outputChannel.appendLine(
                            `  - ERROR: Invalid regex pattern '${pattern}': ${(e as Error).message}`,
                        );
                    }
                }
            }
        }
        if (unfoldPositions.length > 0) {
            outputChannel.appendLine(`- EXECUTING: editor.unfold for ${unfoldPositions.length} positions`);
            editor.selections = unfoldPositions.map((pos) => new Selection(pos, pos));
            await commands.executeCommand('editor.unfold');
            outputChannel.appendLine(`- COMPLETED: editor.unfold`);
        }
    } else if (alwaysFold.length > 0) {
        outputChannel.appendLine("- No '@collapse' pragma found. Checking for 'alwaysFold' patterns.");

        // Use AST to find all function calls
        outputChannel.appendLine(`- Parsing document with AST to find function calls...`);
        const result = findFunctionCalls(document.getText(), alwaysFold);

        outputChannel.appendLine(`- Found ${result.multiLine.length} multi-line function calls`);
        if (result.singleLine > 0) {
            outputChannel.appendLine(
                `- Found ${result.singleLine} single-line function calls (skipped - cannot be folded)`,
            );
        }

        if (result.multiLine.length === 0) {
            outputChannel.appendLine('- No multi-line function calls found to fold');
        } else {
            const functionCalls = result.multiLine;
            // Log all found function calls
            for (const call of functionCalls) {
                const startLineText = lines[call.startLine].trim();
                outputChannel.appendLine(
                    `  - ${call.pattern} at lines ${call.startLine + 1}-${call.endLine + 1}: ${startLineText.substring(0, 50)}...`,
                );
            }

            outputChannel.appendLine(`- Will fold ${functionCalls.length} function calls`);

            // Get or create the set of manually unfolded lines for this document
            const docUri = document.uri.toString();
            if (!manuallyUnfolded.has(docUri)) {
                manuallyUnfolded.set(docUri, new Set<number>());
            }
            const manuallyUnfoldedLines = manuallyUnfolded.get(docUri) || new Set<number>();

            // Save currently folded imports before unfolding all
            const foldedImports: number[] = [];
            let inImportBlock = false;
            let importStartLine = -1;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmedLine = line.trim();

                // Check if this starts an import statement
                if (
                    !inImportBlock &&
                    (trimmedLine.startsWith('import ') ||
                        (trimmedLine.startsWith('const ') && trimmedLine.includes('= require(')) ||
                        trimmedLine.startsWith('require(') ||
                        (trimmedLine.startsWith('export ') && trimmedLine.includes(' from ')))
                ) {
                    inImportBlock = true;
                    importStartLine = i;

                    // Check if it's a single-line import
                    if (trimmedLine.includes(';') || trimmedLine.endsWith(')')) {
                        inImportBlock = false;

                        // Check if this import is folded
                        const middleLine = i + 1;
                        const isFolded = !editor.visibleRanges.some(
                            (range) => range.start.line <= middleLine && range.end.line >= middleLine,
                        );
                        if (isFolded) {
                            foldedImports.push(i);
                            outputChannel.appendLine(
                                `  - Saving folded import at line ${i + 1}: ${trimmedLine.substring(0, 50)}...`,
                            );
                        }
                    }
                } else if (inImportBlock && (trimmedLine.includes(';') || trimmedLine.endsWith('}'))) {
                    // End of multi-line import
                    inImportBlock = false;

                    // Check if this multi-line import is folded
                    if (importStartLine >= 0) {
                        const middleLine = importStartLine + 1;
                        const isFolded = !editor.visibleRanges.some(
                            (range) => range.start.line <= middleLine && range.end.line >= i,
                        );
                        if (isFolded) {
                            foldedImports.push(importStartLine);
                            outputChannel.appendLine(
                                `  - Saving folded multi-line import at line ${importStartLine + 1}`,
                            );
                        }
                    }
                }

                // Stop checking after we hit non-import code (optimization)
                if (
                    !inImportBlock &&
                    !trimmedLine.startsWith('import') &&
                    !trimmedLine.startsWith('const') &&
                    !trimmedLine.startsWith('export') &&
                    !trimmedLine.startsWith('//') &&
                    trimmedLine.length > 0 &&
                    !trimmedLine.startsWith('*') &&
                    !trimmedLine.startsWith('/*')
                ) {
                    // We've reached actual code, no more imports expected at top level
                    break;
                }
            }

            // Unfold all first to ensure clean state
            outputChannel.appendLine(`- EXECUTING: editor.unfoldAll to ensure clean state`);
            await commands.executeCommand('editor.unfoldAll');
            outputChannel.appendLine(`- COMPLETED: editor.unfoldAll`);

            // Small delay to ensure VS Code processed the unfold
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Re-fold imports that were previously folded
            if (foldedImports.length > 0) {
                outputChannel.appendLine(`- Re-folding ${foldedImports.length} imports that were previously folded`);
                for (const importLine of foldedImports) {
                    editor.selection = new Selection(importLine, 0, importLine, 0);
                    await commands.executeCommand('editor.fold');
                    await new Promise((resolve) => setTimeout(resolve, 10));
                }
            }

            // Fold each function call at its start line
            let foldedCount = 0;
            let skippedManual = 0;
            let skippedAlreadyFolded = 0;

            for (const call of functionCalls) {
                try {
                    // Check if user manually unfolded this
                    if (!isManualCommand && manuallyUnfoldedLines.has(call.startLine)) {
                        outputChannel.appendLine(
                            `  - Skipped ${call.pattern} at line ${call.startLine + 1}: manually unfolded by user`,
                        );
                        skippedManual++;
                        continue;
                    }

                    // Check if already folded
                    const middleLine = call.startLine + 1;
                    const isFolded = !editor.visibleRanges.some(
                        (range) => range.start.line <= middleLine && range.end.line >= middleLine,
                    );
                    if (!isManualCommand && isFolded) {
                        outputChannel.appendLine(
                            `  - Skipped ${call.pattern} at line ${call.startLine + 1}: already folded`,
                        );
                        skippedAlreadyFolded++;
                        continue;
                    }

                    // Position cursor at the start of the function call
                    editor.selection = new Selection(call.startLine, 0, call.startLine, 0);
                    // Fold the function call
                    await commands.executeCommand('editor.fold');
                    foldedCount++;

                    // Remove from manually unfolded if we just folded it
                    manuallyUnfoldedLines.delete(call.startLine);

                    await new Promise((resolve) => setTimeout(resolve, 10));
                } catch (e) {
                    outputChannel.appendLine(
                        `  - Failed to fold ${call.pattern} at line ${call.startLine + 1}: ${(e as Error).message}`,
                    );
                }
            }

            // Restore cursor position
            editor.selections = savedSelections;

            outputChannel.appendLine(
                `- Folding completed: ${foldedCount} folded, ${skippedAlreadyFolded} already folded, ${skippedManual} manually unfolded by user`,
            );
        }
    } else {
        outputChannel.appendLine('- No folding rules to apply (no pragma and alwaysFold is empty)');
    }

    // Restore cursor position
    if (savedSelections && savedSelections.length > 0) {
        editor.selections = savedSelections;
    }

    isProcessing = false;
    outputChannel.appendLine(`- isProcessing reset to: ${isProcessing}`);
    outputChannel.appendLine(`=== ANALYZE END ===\n`);
}

export function deactivate(): void {
    if (timeout) {
        clearTimeout(timeout);
    }
}
