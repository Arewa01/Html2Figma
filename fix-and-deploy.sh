#!/bin/bash

echo "🔧 HTML to Figma Backend - Complete Fix and Deploy"
echo "=================================================="

echo "📋 Issue: Version conflicts with chrome-aws-lambda"
echo "🔧 Solution: Switch to modern @sparticuz/chromium"
echo ""

cd backend

echo "🧹 Step 1: Clean installation..."
./clean-install.sh

echo ""
echo "🔍 Step 2: Verify chromium setup locally..."
if node verify-chrome-lambda.js; then
    echo "✅ Local verification passed!"
else
    echo "❌ Local verification failed - check dependencies"
    exit 1
fi

echo ""
echo "🚀 Step 3: Deploy to Vercel..."
if vercel --prod; then
    echo "✅ Deployment successful!"
    
    cd ..
    
    echo ""
    echo "🧪 Step 4: Test deployment..."
    sleep 5
    
    if node test-deployment.js; then
        echo ""
        echo "🎉 SUCCESS! Complete fix deployed and tested!"
        echo "✅ All systems operational"
        echo ""
        echo "📋 What was fixed:"
        echo "   - Replaced chrome-aws-lambda with @sparticuz/chromium"
        echo "   - Fixed version conflicts"
        echo "   - Updated Puppeteer configuration"
        echo "   - Verified serverless compatibility"
        echo ""
        echo "🚀 Plugin is now ready for use in Figma!"
    else
        echo ""
        echo "❌ Tests failed after deployment"
        echo "Check the test output above for details"
        exit 1
    fi
else
    echo "❌ Deployment failed"
    echo "Check the error messages above"
    exit 1
fi
