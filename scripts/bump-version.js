#!/usr/bin/env bun
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Parse current version
const [major, minor, patch] = packageJson.version.split('.').map(Number);

// Check if --minor flag is provided
const isMinor = process.argv.includes('--minor');

// Increment version
let newVersion;
if (isMinor) {
    newVersion = `${major}.${minor + 1}.0`;
} else {
    newVersion = `${major}.${minor}.${patch + 1}`;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, '\t')}\n`);

console.log(`Version bumped from ${major}.${minor}.${patch} to ${newVersion}`);

// Create git tag
const tagName = `v${newVersion}`;
const tagResult = spawnSync('git', ['tag', tagName], { encoding: 'utf8' });

if (tagResult.status === 0) {
    console.log(`Git tag ${tagName} created successfully`);
} else {
    console.error(`Failed to create git tag: ${tagResult.stderr}`);
}
