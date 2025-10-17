#!/bin/bash

echo "🔧 HTML to Figma Plugin - Vercel Deployment (Chrome Fixed)"
echo "=========================================================="

echo "✅ Fixed Configuration:"
echo "   - Using puppeteer-core (not regular puppeteer)"
echo "   - Using chrome-aws-lambda for serverless Chrome"
echo "   - Proper executablePath configuration"
echo ""

cd backend

echo "🧹 Cleaning up conflicting packages..."
npm uninstall puppeteer @sparticuz/chromium

echo "📦 Installing correct dependencies..."
npm install

echo "🔍 Verifying dependencies..."
echo "Current packages:"
npm list --depth=0 | grep -E "(puppeteer|chrome)"

echo ""
echo "🚀 Deploying to Vercel..."
if vercel --prod; then
    echo ""
    echo "✅ Deployment successful!"
    
    cd ..
    
    echo "🧪 Testing deployment..."
    sleep 5
    
    if node test-deployment.js; then
        echo ""
        echo "🎉 SUCCESS! Vercel deployment with Chrome working!"
        echo "✅ All tests passed"
        echo ""
        echo "📋 What was fixed:"
        echo "   - Switched to puppeteer-core + chrome-aws-lambda"
        echo "   - Proper executablePath from chromium.executablePath"
        echo "   - Removed conflicting packages"
        echo ""
        echo "🚀 Plugin is ready for Figma!"
    else
        echo ""
        echo "❌ Tests failed - check output above"
        echo "💡 Try checking Vercel logs: vercel logs"
    fi
else
    echo "❌ Deployment failed"
    echo "Check error messages above"
    exit 1
fi
