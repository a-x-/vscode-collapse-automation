const vscode = require("vscode");
const { parse } = require("@typescript-eslint/typescript-estree");

let outputChannel;
let timeout = null;
let isProcessing = false;

/**
 * Find function calls matching the pattern using AST and return their locations
 * @param {string} text - The full document text
 * @param {string[]} patterns - The patterns to match (e.g., ["logger.info", "logger.error"])
 * @returns {Array<{pattern: string, startLine: number, endLine: number}>} - Array of matches with line numbers
 */
function findFunctionCalls(text, patterns) {
	const matches = [];
	
	try {
		// Parse the entire document
		const ast = parse(text, {
			ecmaVersion: 'latest',
			sourceType: 'module',
			jsx: true,
			errorOnUnknownASTType: false,
			range: true,
			loc: true
		});
		
		// Walk the AST to find matching call expressions
		function walkNode(node) {
			if (!node || typeof node !== 'object') return;
			
			// Check if this is a matching member expression call
			if (node.type === 'CallExpression' && node.callee && node.loc) {
				if (node.callee.type === 'MemberExpression' &&
				    node.callee.object && node.callee.property) {
					// Check each pattern
					for (const pattern of patterns) {
						if (!pattern.includes('.')) continue;
						
						const [objectName, methodName] = pattern.split('.');
						
						if (node.callee.object.type === 'Identifier' && 
						    node.callee.object.name === objectName &&
						    node.callee.property.type === 'Identifier' &&
						    node.callee.property.name === methodName) {
							// Found a match, check if it's multi-line
							const startLine = node.loc.start.line - 1; // Convert to 0-based
							const endLine = node.loc.end.line - 1;
							
							if (startLine !== endLine) {
								matches.push({
									pattern,
									startLine,
									endLine
								});
							}
						}
					}
				}
			}
			
			// Recursively check all child nodes
			for (const key in node) {
				if (key !== 'parent' && node[key]) {
					if (Array.isArray(node[key])) {
						for (const child of node[key]) {
							walkNode(child);
						}
					} else if (typeof node[key] === 'object') {
						walkNode(node[key]);
					}
				}
			}
		}
		
		walkNode(ast);
	} catch (e) {
		outputChannel.appendLine(`- ERROR parsing document for AST: ${e.message}`);
	}
	
	return matches;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	outputChannel = vscode.window.createOutputChannel("Collapse Automation");
	outputChannel.appendLine('Extension "collapse-automation" is now active.');

	const triggerAnalysis = (document) => {
		if (document) {
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(() => {
				analyzeAndFold(document);
			}, 500);
		}
	};

	const disposable = vscode.workspace.onDidChangeTextDocument(event => {
		if (!isProcessing) {
			triggerAnalysis(event.document);
		}
	});

	const openDisposable = vscode.workspace.onDidOpenTextDocument(document => {
		// Run immediately for newly opened documents
		analyzeAndFold(document);
	});
	
	const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			// Run immediately when switching files
			analyzeAndFold(editor.document);
		}
	});
	
	// Register the manual command
	const commandDisposable = vscode.commands.registerCommand('collapse-automation.activate', () => {
		if (vscode.window.activeTextEditor) {
			// Clear timeout to run immediately
			if (timeout) {
				clearTimeout(timeout);
			}
			analyzeAndFold(vscode.window.activeTextEditor.document);
		} else {
			vscode.window.showInformationMessage('No active editor found');
		}
	});

	context.subscriptions.push(disposable, openDisposable, activeEditorDisposable, commandDisposable);

	// Analyze current active editor on activation
	if (vscode.window.activeTextEditor) {
		triggerAnalysis(vscode.window.activeTextEditor.document);
	}
}

async function analyzeAndFold(document) {
	// Skip output channels to prevent recursion
	if (document.uri.scheme === 'output' || 
	    document.uri.fsPath.includes('extension-output') ||
	    document.uri.fsPath.includes('Collapse Automation')) {
		return;
	}
	
	// Only analyze JS/JSX/TS/TSX files
	const supportedLanguages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
	if (!supportedLanguages.includes(document.languageId)) {
		return;
	}
	
	// Ensure we have an active editor for this document
	const editor = vscode.window.activeTextEditor;
	if (!editor || editor.document !== document) {
		outputChannel.appendLine("- No active editor for this document, skipping");
		return;
	}
	
	outputChannel.appendLine(`\n=== ANALYZE START at ${new Date().toISOString()} ===`);
	outputChannel.appendLine(`Document: ${document.uri.fsPath}`);
	outputChannel.appendLine(`isProcessing was: ${isProcessing}`);
	isProcessing = true;
	outputChannel.appendLine(`isProcessing now: ${isProcessing}`);
	
	const config = vscode.workspace.getConfiguration('collapse-automation');
	const alwaysFold = config.get('alwaysFold', []);
	const neverFold = config.get('neverFold', []);
	const collapseLevel = config.get('collapseLevel', 1);
	const enableCollapsePragma = config.get('enableCollapsePragma', true);

	outputChannel.appendLine(`- Config: alwaysFold: [${alwaysFold.join(", ")}] (length: ${alwaysFold.length})`);
	outputChannel.appendLine(`- Config: neverFold: [${neverFold.join(", ")}] (length: ${neverFold.length})`);
	outputChannel.appendLine(`- Config: collapseLevel: ${collapseLevel}`);
	outputChannel.appendLine(`- Config: enableCollapsePragma: ${enableCollapsePragma}`);
	
	// Check if features should be disabled
	const shouldSkip = (!enableCollapsePragma || alwaysFold.length === 0) && alwaysFold.length === 0;
	if (shouldSkip) {
		outputChannel.appendLine("- SKIPPING: No active folding rules (alwaysFold is empty and pragma disabled)");
		isProcessing = false;
		outputChannel.appendLine(`=== ANALYZE END (skipped) ===\n`);
		return;
	}

	const text = document.getText();
	const lines = text.split('\n');
	outputChannel.appendLine(`- Document has ${lines.length} lines`);
	
	const hasCollapsePragma = enableCollapsePragma && lines.some(line => line.includes('// @collapse'));
	outputChannel.appendLine(`- Has @collapse pragma: ${hasCollapsePragma}`);

	if (hasCollapsePragma) {
		outputChannel.appendLine("- ACTION: Found '@collapse' pragma. Will apply folding rules.");
		outputChannel.appendLine("- EXECUTING: editor.foldAll");
		await vscode.commands.executeCommand('editor.foldAll');
		outputChannel.appendLine("- COMPLETED: editor.foldAll");
		
		if (collapseLevel > 0) {
			outputChannel.appendLine(`- EXECUTING: editor.unfoldLevel${collapseLevel}`);
			await vscode.commands.executeCommand(`editor.unfoldLevel${collapseLevel}`);
			outputChannel.appendLine(`- COMPLETED: editor.unfoldLevel${collapseLevel}`);
		}
		const unfoldPositions = [];
		if (neverFold.length > 0) {
			outputChannel.appendLine(`- Checking neverFold patterns...`);
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				for (const pattern of neverFold) {
					try {
						if (new RegExp(pattern).test(line)) {
							outputChannel.appendLine(`  - Line ${i + 1} matches neverFold pattern '${pattern}': ${line.substring(0, 50)}...`);
							unfoldPositions.push(new vscode.Position(i, 0));
							break;
						}
					} catch (e) {
						outputChannel.appendLine(`  - ERROR: Invalid regex pattern '${pattern}': ${e.message}`);
					}
				}
			}
		}
		if (unfoldPositions.length > 0) {
			outputChannel.appendLine(`- EXECUTING: editor.unfold for ${unfoldPositions.length} positions`);
			editor.selections = unfoldPositions.map(pos => new vscode.Selection(pos, pos));
			await vscode.commands.executeCommand('editor.unfold');
			outputChannel.appendLine(`- COMPLETED: editor.unfold`);
		}
	} else if (alwaysFold.length > 0) {
		outputChannel.appendLine("- No '@collapse' pragma found. Checking for 'alwaysFold' patterns.");
		
		// Use AST to find all function calls
		outputChannel.appendLine(`- Parsing document with AST to find function calls...`);
		const functionCalls = findFunctionCalls(document.getText(), alwaysFold);
		
		outputChannel.appendLine(`- Found ${functionCalls.length} multi-line function calls`);
		
		if (functionCalls.length === 0) {
			outputChannel.appendLine("- No multi-line function calls found to fold");
		} else {
			// Log all found function calls
			for (const call of functionCalls) {
				const startLineText = lines[call.startLine].trim();
				outputChannel.appendLine(`  - ${call.pattern} at lines ${call.startLine + 1}-${call.endLine + 1}: ${startLineText.substring(0, 50)}...`);
			}
			
			outputChannel.appendLine(`- Will fold ${functionCalls.length} function calls`);
			
			// Fold each function call at its start line
			let foldedCount = 0;
			let skippedCount = 0;
			
			// Get all visible ranges to check what's already folded
			const visibleRanges = editor.visibleRanges;
			
			for (const call of functionCalls) {
				try {
					// Check if this call is already folded by checking if its content lines are visible
					let isAlreadyFolded = false;
					if (call.endLine > call.startLine) {
						// Check if any line inside the function call (not the start line) is invisible
						const middleLine = call.startLine + 1;
						isAlreadyFolded = !visibleRanges.some(range => 
							range.start.line <= middleLine && range.end.line >= middleLine
						);
					}
					
					if (isAlreadyFolded) {
						outputChannel.appendLine(`  - Skipped ${call.pattern} at line ${call.startLine + 1}: already folded`);
						skippedCount++;
					} else {
						// Position cursor at the start of the function call
						editor.selection = new vscode.Selection(call.startLine, 0, call.startLine, 0);
						// Fold the function call
						await vscode.commands.executeCommand('editor.fold');
						foldedCount++;
						await new Promise(resolve => setTimeout(resolve, 10));
					}
				} catch (e) {
					outputChannel.appendLine(`  - Failed to fold ${call.pattern} at line ${call.startLine + 1}: ${e.message}`);
				}
			}
			
			outputChannel.appendLine(`- Folding completed: ${foldedCount} folded, ${skippedCount} already folded`);
		}
	} else {
		outputChannel.appendLine("- No folding rules to apply (no pragma and alwaysFold is empty)");
	}
	
	isProcessing = false;
	outputChannel.appendLine(`- isProcessing reset to: ${isProcessing}`);
	outputChannel.appendLine(`=== ANALYZE END ===\n`);
}

function deactivate() {
	if (timeout) {
		clearTimeout(timeout);
	}
}

module.exports = {
	activate,
	deactivate,
};
