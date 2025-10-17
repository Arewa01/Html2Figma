#!/bin/bash

echo "🔧 Complete Chrome AWS Lambda Fix for Vercel"
echo "============================================"

cd backend

echo "🧹 Step 1: Complete cleanup..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Step 2: Install ONLY correct packages..."
npm install puppeteer-core@10.4.0 chrome-aws-lambda@10.1.0 express@4.18.2 cors@2.8.5 helmet@7.1.0 express-rate-limit@7.1.5 node-fetch@3.3.2

echo "🔍 Step 3: Verify installation..."
echo "Installed packages:"
npm list --depth=0 | grep -E "(puppeteer|chrome)"

echo ""
echo "🧪 Step 4: Test chrome-aws-lambda locally..."
if node test-chrome-lambda.js; then
    echo ""
    echo "✅ Local test passed!"
    
    echo ""
    echo "🚀 Step 5: Deploy to Vercel..."
    if vercel --prod; then
        echo ""
        echo "✅ Deployment successful!"
        
        cd ..
        
        echo "🧪 Step 6: Test deployed backend..."
        sleep 5
        
        if node test-deployment.js; then
            echo ""
            echo "🎉 COMPLETE SUCCESS!"
            echo "✅ Chrome AWS Lambda working on Vercel"
            echo "✅ All tests passed"
            echo ""
            echo "🚀 Plugin is ready for production!"
        else
            echo ""
            echo "⚠️  Deployment succeeded but tests failed"
            echo "💡 Check Vercel logs: vercel logs"
            echo "🔍 Manual test: curl https://your-url/health"
        fi
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo ""
    echo "❌ Local test failed - fix dependencies first"
    exit 1
fi
