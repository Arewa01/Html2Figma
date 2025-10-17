#!/bin/bash

echo "🔧 Complete Chrome AWS Lambda Fix"
echo "================================="

# Remove everything and start fresh
echo "🧹 Complete cleanup..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Installing compatible versions..."
npm install --legacy-peer-deps

echo "🔍 Verifying installation..."
npm list --depth=0 | grep -E "(puppeteer|chrome)"

echo ""
echo "✅ Installation complete!"
echo "📋 Installed versions:"
echo "   - puppeteer-core: $(npm list puppeteer-core --depth=0 2>/dev/null | grep puppeteer-core || echo 'Not found')"
echo "   - chrome-aws-lambda: $(npm list chrome-aws-lambda --depth=0 2>/dev/null | grep chrome-aws-lambda || echo 'Not found')"
