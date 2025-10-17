#!/bin/bash

echo "🚀 HTML to Figma Plugin - Clean Vercel Deployment"
echo "================================================="

echo "✅ Clean Configuration:"
echo "   - Streamlined server.js (Vercel-optimized)"
echo "   - @sparticuz/chromium (modern, compatible)"
echo "   - puppeteer-core (latest version)"
echo "   - No hybrid logic, no local testing issues"
echo ""

cd backend

echo "🧹 Clean installation..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔍 Verifying dependencies..."
npm list --depth=0 | grep -E "(puppeteer|chromium)"

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
        echo "🎉 COMPLETE SUCCESS!"
        echo "✅ Clean server.js working perfectly"
        echo "✅ @sparticuz/chromium working on Vercel"
        echo "✅ All tests passed"
        echo ""
        echo "🚀 Plugin is ready for production!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Import plugin in Figma"
        echo "2. Test with https://example.com"
        echo "3. Enjoy converting websites to Figma!"
    else
        echo ""
        echo "⚠️  Deployment succeeded but tests failed"
        echo "💡 Try manual testing:"
        echo "   curl https://your-vercel-url/health"
    fi
else
    echo "❌ Deployment failed"
    echo "Check error messages above"
    exit 1
fi
