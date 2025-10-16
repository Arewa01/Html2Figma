#!/bin/bash

# HTML to Figma Plugin Deployment Script
# This script helps deploy the backend service and configure the plugin

set -e

echo "🚀 HTML to Figma Plugin Deployment Script"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: Please run this script from the plugin root directory"
    exit 1
fi

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: Backend directory not found"
    exit 1
fi

echo "📋 Deployment Options:"
echo "1. Deploy to Railway (Recommended - better Puppeteer support)"
echo "2. Deploy to Vercel"
echo "3. Configure for local development"
echo "4. Test current configuration"

read -p "Choose an option (1-4): " choice

case $choice in
    1)
        echo "🚂 Railway Deployment Instructions:"
        echo "1. Go to https://railway.app and sign up"
        echo "2. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "3. Connect your GitHub repository"
        echo "4. Select the 'backend' directory as the root"
        echo "5. Railway will automatically detect and deploy the Node.js app"
        echo "6. Copy the deployment URL (e.g., https://your-app.railway.app)"
        echo "7. Update BACKEND_URL in code.js with the Railway URL"
        echo ""
        echo "✅ Railway automatically handles Puppeteer dependencies!"
        ;;
        
    2)
        echo "🔧 Deploying to Vercel..."
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            echo "📦 Installing Vercel CLI..."
            npm install -g vercel
        fi
        
        # Navigate to backend and deploy
        cd backend
        echo "🚀 Starting Vercel deployment..."
        
        # Try deployment with default config
        if vercel --prod; then
            echo "✅ Deployment complete!"
        else
            echo "⚠️  Default deployment failed, trying alternative configuration..."
            mv vercel.json vercel-builds.json
            mv vercel-functions.json vercel.json
            if vercel --prod; then
                echo "✅ Deployment complete with alternative configuration!"
            else
                echo "❌ Deployment failed with both configurations"
                echo "Please check Vercel logs and try manual deployment"
                exit 1
            fi
        fi
        
        echo "📝 Please update the BACKEND_URL in code.js with your deployment URL"
        echo "   Example: BACKEND_URL: 'https://your-app.vercel.app'"
        ;;
        
    3)
        echo "💻 Configuring for local development..."
        
        # Install backend dependencies
        cd backend
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing backend dependencies..."
            npm install
        fi
        
        # Update configuration
        cd ..
        sed -i.bak 's|BACKEND_URL: .*|BACKEND_URL: '\''http://localhost:3000'\'',|' code.js
        
        echo "✅ Configuration updated for local development"
        echo "🏃 To start the backend server:"
        echo "   cd backend && npm start"
        ;;
        
    4)
        echo "🧪 Testing current configuration..."
        
        # Extract current backend URL from code.js
        BACKEND_URL=$(grep "BACKEND_URL:" code.js | sed "s/.*BACKEND_URL: *['\"]\\([^'\"]*\\)['\"].*/\\1/")
        echo "📍 Current backend URL: $BACKEND_URL"
        
        # Test health endpoint
        echo "🔍 Testing backend connectivity..."
        if curl -s -f "$BACKEND_URL/health" > /dev/null; then
            echo "✅ Backend is accessible and healthy"
            
            # Test scrape endpoint
            echo "🔍 Testing scrape functionality..."
            RESPONSE=$(curl -s -X POST "$BACKEND_URL/scrape" \
                -H "Content-Type: application/json" \
                -d '{"url": "https://example.com", "viewport": {"width": 1200, "height": 800}}')
            
            if echo "$RESPONSE" | grep -q '"success":true'; then
                echo "✅ Scraping functionality is working"
            else
                echo "⚠️  Scraping test failed, but backend is accessible"
            fi
        else
            echo "❌ Backend is not accessible"
            echo "   Please check the URL and ensure the service is running"
        fi
        ;;
        
    *)
        echo "❌ Invalid option selected"
        exit 1
        ;;
esac

echo ""
echo "📚 Next Steps:"
echo "1. Test the plugin in Figma"
echo "2. Try converting a simple website (like https://example.com)"
echo "3. Check the documentation in PLUGIN_DOCUMENTATION.md"
echo ""
echo "🎉 Deployment process complete!"
