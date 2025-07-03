import * as path from 'node:path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-extensions', // Disable other extensions during testing
                '--disable-workspace-trust', // Disable workspace trust prompts
                '--skip-welcome', // Skip welcome page
                '--skip-release-notes', // Skip release notes
                '--disable-telemetry', // Disable telemetry
                '--disable-updates', // Disable update checks
                '--disable-crash-reporter', // Disable crash reporter
            ],
            // Set environment variables to suppress warnings
            extensionTestsEnv: {
                ...process.env,
                VSCODE_SKIP_PRELAUNCH: '1',
                NODE_NO_WARNINGS: '1',
            },
        });
    } catch (err) {
        console.error('Failed to run tests', err);
        process.exit(1);
    }
}

main();
