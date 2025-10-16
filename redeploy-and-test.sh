#!/bin/bash

# Redeploy and Test Script for Vercel Puppeteer Fix

echo "🚀 Redeploying HTML to Figma Backend with Chrome AWS Lambda Fix"
echo "=============================================================="

# Navigate to backend directory
cd backend

echo "📦 Current dependencies:"
echo "- puppeteer-core: $(npm list puppeteer-core --depth=0 2>/dev/null | grep puppeteer-core || echo 'Not found')"
echo "- chrome-aws-lambda: $(npm list chrome-aws-lambda --depth=0 2>/dev/null | grep chrome-aws-lambda || echo 'Not found')"
echo ""

# Check if regular puppeteer is installed (should not be)
if npm list puppeteer --depth=0 2>/dev/null | grep -q puppeteer; then
    echo "⚠️  WARNING: Regular 'puppeteer' package found - this may cause conflicts"
    echo "   Consider removing it: npm uninstall puppeteer"
    echo ""
fi

echo "🔧 Redeploying to Vercel..."
if vercel --prod; then
    echo "✅ Deployment successful!"
    echo ""
    
    # Go back to root directory for testing
    cd ..
    
    echo "🧪 Testing deployment..."
    echo "Running test script in 5 seconds..."
    sleep 5
    
    if node test-deployment.js; then
        echo ""
        echo "🎉 SUCCESS! All tests passed!"
        echo "✅ Backend is fully functional with Puppeteer support"
        echo ""
        echo "📋 Next steps:"
        echo "1. Import plugin in Figma (Plugins → Development → Import plugin from manifest)"
        echo "2. Test website conversion with a simple site like https://example.com"
        echo "3. Verify all functionality works as expected"
    else
        echo ""
        echo "❌ Tests failed. Check the output above for details."
        echo "💡 Common issues:"
        echo "   - Chrome AWS Lambda not working properly"
        echo "   - Network connectivity issues"
        echo "   - Vercel function timeout"
        echo ""
        echo "🔍 Debug steps:"
        echo "1. Check Vercel logs: vercel logs"
        echo "2. Test health endpoint manually in browser"
        echo "3. Review server.js chrome-aws-lambda configuration"
    fi
else
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi

echo ""
echo "📚 Documentation:"
echo "- Vercel Puppeteer Fix: backend/VERCEL_PUPPETEER_FIX.md"
echo "- Current Status: CURRENT_STATUS.md"
echo "- Installation Guide: INSTALLATION.md"
