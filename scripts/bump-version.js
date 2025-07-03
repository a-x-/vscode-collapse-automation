#!/usr/bin/env bun
const fs = require('node:fs');
const path = require('node:path');

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
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 4)}\n`);

console.log(`Version bumped from ${major}.${minor}.${patch} to ${newVersion}`);
