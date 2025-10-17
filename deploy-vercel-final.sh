#!/bin/bash

echo "🚀 HTML to Figma Plugin - Final Vercel Deployment"
echo "================================================="

echo "🔧 Using compatible versions:"
echo "   - puppeteer-core@^10.4.0 (compatible with chrome-aws-lambda)"
echo "   - chrome-aws-lambda@^10.1.0"
echo "   - --legacy-peer-deps flag for installation"
echo ""

cd backend

echo "🧹 Complete cleanup..."
./complete-fix.sh

if [ $? -eq 0 ]; then
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
            echo "🎉 SUCCESS! Vercel deployment working with Chrome!"
            echo "✅ All tests passed"
            echo ""
            echo "📋 Final configuration:"
            echo "   - Compatible puppeteer-core version"
            echo "   - chrome-aws-lambda working"
            echo "   - Legacy peer deps handling conflicts"
            echo ""
            echo "🚀 Plugin is ready for production use!"
        else
            echo ""
            echo "❌ Tests failed - but deployment succeeded"
            echo "💡 Check the backend URL and try manual testing"
        fi
    else
        echo "❌ Deployment failed"
        echo "Check error messages above"
        exit 1
    fi
else
    echo "❌ Installation failed"
    echo "Check error messages above"
    exit 1
fi
