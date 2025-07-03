const path = require('node:path');
const Mocha = require('mocha');

// Register TypeScript support
require('esbuild-register/dist/node').register({
    target: 'node16',
    format: 'cjs',
});

function run() {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 10000,
        reporter: 'tap',
    });

    // Override console.log to fix undefined symbols
    const originalLog = console.log;
    console.log = (...args) => {
        const fixed = args.map((arg) => (typeof arg === 'string' ? arg.replace(/undefined/g, '✓') : arg));
        originalLog.apply(console, fixed);
    };

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((c, e) => {
        const glob = require('glob');

        glob('**/**.test.ts', { cwd: testsRoot }, (err, files) => {
            if (err) {
                return e(err);
            }

            // Add files to the test suite
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run((failures) => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }
        });
    });
}

module.exports = { run };
