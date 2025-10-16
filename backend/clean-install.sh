#!/bin/bash

echo "🧹 Cleaning up Puppeteer dependencies..."

# Remove node_modules and package-lock.json for clean install
rm -rf node_modules
rm -f package-lock.json

# Remove any conflicting puppeteer packages
npm uninstall puppeteer chrome-aws-lambda

echo "📦 Installing correct dependencies..."
npm install

echo "✅ Clean installation complete!"
echo ""
echo "📋 Installed packages:"
npm list --depth=0 | grep -E "(puppeteer|chromium)"
