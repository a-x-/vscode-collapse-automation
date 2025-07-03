const path = require('node:path');
const { runTests } = require('@vscode/test-electron');
const os = require('node:os');
const fs = require('node:fs');

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Create a temporary directory for user data to avoid conflicts
		const tmpdir = os.tmpdir();
		const userDataDir = fs.mkdtempSync(path.join(tmpdir, 'vscode-test-user-data-'));

		// Define launch arguments
		const launchArgs = [
			'--user-data-dir',
			userDataDir
		];

		// Download VS Code, unzip it and run the integration test
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs
		});
	} catch (err) {
		console.error("Failed to run tests", err);
		process.exit(1);
	}
}

main();
