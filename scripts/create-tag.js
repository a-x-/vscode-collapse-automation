#!/usr/bin/env bun
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get current version
const version = packageJson.version;

// Create git tag
const tagName = `v${version}`;
const tagResult = spawnSync('git', ['tag', tagName], { encoding: 'utf8' });

if (tagResult.status === 0) {
    console.log(`Git tag ${tagName} created successfully`);
} else {
    console.error(`Failed to create git tag: ${tagResult.stderr}`);
    process.exit(1);
}