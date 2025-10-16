# HTML to Figma Plugin

A powerful Figma plugin that converts entire websites into pixel-perfect Figma designs. Simply provide a website URL and watch as the plugin scrapes the content and recreates it as native, editable Figma components.

## 🌟 Features

- **Complete Website Conversion**: Convert entire web pages to Figma designs
- **Pixel-Perfect Accuracy**: Maintains original layout, colors, fonts, and spacing  
- **Native Figma Components**: Creates editable text, frames, rectangles, and groups
- **Asset Processing**: Handles images, fonts, and background elements
- **Responsive Design Support**: Capture websites at desktop, tablet, or mobile viewport sizes
- **Smart Error Handling**: Comprehensive error reporting with retry functionality
- **Performance Optimized**: Efficient batch processing for large websites

## 🚀 Quick Start

### 1. Backend Deployment
The plugin requires a backend service for website scraping:

**Option A: Render (Recommended - Perfect for Puppeteer)**
1. Go to [render.com](https://render.com) and sign up
2. Create **New Web Service** from GitHub repo
3. Set **Root Directory** to `backend`
4. Deploy with default settings - Render handles everything!

**Option B: Railway**
1. Go to [railway.app](https://railway.app) and sign up
2. Connect your GitHub repository
3. Deploy the `backend` directory

**Option C: Use deployment script**
```bash
./deploy.sh
```

### 2. Plugin Installation
1. Download or clone this repository
2. In Figma: **Plugins** → **Development** → **Import plugin from manifest**
3. Select the `manifest.json` file
4. Update `BACKEND_URL` in `code.js` with your deployment URL

### 3. Start Converting
1. Open the plugin in Figma
2. Enter a website URL (e.g., `https://example.com`)
3. Select viewport size (Desktop/Tablet/Mobile)
4. Click **Convert Website**
5. Watch your website become a Figma design!

## 📋 Requirements Fulfilled

This implementation addresses all specified requirements:

- ✅ **Requirement 1.1-1.3**: Complete website scraping and conversion with pixel-perfect accuracy
- ✅ **Requirement 2.1-2.2**: CSS style preservation and Figma property mapping
- ✅ **Requirement 3.1-3.3**: Figma plugin integration with network access
- ✅ **Requirement 4.1-4.2**: URL input and automatic asset downloading
- ✅ **Requirement 5.1-5.2**: Native Figma components with full editability
- ✅ **Requirement 6.1-6.3**: Comprehensive error handling and user feedback
- ✅ **Requirement 7.1-7.3**: Complete asset handling (images, fonts, backgrounds)
- ✅ **Requirement 8.1-8.2**: Responsive design support with viewport selection

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Plugin UI     │    │  Backend Service │    │   Main Thread    │
│   (iframe)      │◄──►│   (Node.js)      │◄──►│   (sandbox)      │
│                 │    │                  │    │                  │
│ • URL Input     │    │ • Puppeteer      │    │ • Node Creator   │
│ • Progress UI   │    │ • Asset Download │    │ • Style Mapper   │
│ • Error Display │    │ • DOM Analysis   │    │ • Font Handler   │
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

## 🛠️ Development

### Local Development Setup
```bash
# Install backend dependencies
cd backend
npm install

# Start backend server
npm start

# Update plugin configuration for local development
# In code.js, set: BACKEND_URL: 'http://localhost:3000'
```

### Testing
```bash
# Backend tests
cd backend
npm test

# Plugin tests  
npm test

# Manual testing with various websites
```

### Project Structure
```
├── manifest.json          # Figma plugin manifest
├── code.js               # Main plugin logic (sandbox)
├── ui.html               # Plugin user interface
├── config.js             # Configuration settings
├── backend/              # Backend scraping service
│   ├── server.js         # Express server with Puppeteer
│   ├── package.json      # Backend dependencies
│   ├── vercel.json       # Vercel deployment config
│   └── tests/            # Backend test suite
├── tests/                # Plugin test suite
└── docs/                 # Documentation
```

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
cd backend
vercel --prod
```

### Railway
1. Connect GitHub repo to Railway
2. Deploy `backend` directory
3. Update `BACKEND_URL` in plugin

### AWS Lambda
```bash
# Using Serverless Framework
cd backend
serverless deploy
```

### Local Development
```bash
cd backend
npm start
# Use http://localhost:3000 as BACKEND_URL
```

## 📖 Usage Examples

### Basic Website Conversion
```javascript
// Input: https://example.com
// Output: Complete Figma design with:
// - Header with navigation
// - Main content sections  
// - Footer with proper styling
// - All text editable
// - Images as fills
// - Proper layer organization
```

### Responsive Design Capture
```javascript
// Desktop (1200x800): Full layout with sidebar
// Tablet (768x1024): Stacked layout
// Mobile (375x667): Single column layout
```

## 🔧 Configuration

### Backend URL Configuration
```javascript
// Development
BACKEND_URL: 'http://localhost:3000'

// Production  
BACKEND_URL: 'https://your-app.vercel.app'
```

### Performance Tuning
```javascript
const CONFIG = {
    REQUEST_TIMEOUT: 60000,    // Increase for slow sites
    MAX_RETRIES: 2,            // Retry attempts
    NODE_BATCH_SIZE: 15,       // Nodes per batch
    BATCH_DELAY: 20            // Delay between batches
};
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Backend not available" | Check deployment and URL configuration |
| "Website timeout" | Try simpler page or increase timeout |
| "Invalid URL" | Ensure URL includes http:// or https:// |
| "Conversion failed" | Check website accessibility and try different site |

## 📚 Documentation

- **[Complete Plugin Documentation](PLUGIN_DOCUMENTATION.md)** - Detailed usage guide
- **[Backend Deployment Guide](backend/deploy.md)** - Deployment instructions
- **[API Reference](PLUGIN_DOCUMENTATION.md#api-reference)** - Backend API details

## 🧪 Testing

The plugin has been tested with:
- ✅ Static websites and landing pages
- ✅ E-commerce sites (product pages)
- ✅ Blog and content sites
- ✅ Marketing and portfolio sites
- ✅ Simple web applications

## 🔒 Security & Privacy

- **No Data Storage**: Website content is processed in memory only
- **Temporary Processing**: No persistent storage of scraped data
- **CORS Protection**: Backend includes security headers and rate limiting
- **Safe Scraping**: Sandboxed browser environment

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🎯 Roadmap

- [ ] Advanced CSS support (gradients, transforms)
- [ ] Component detection and creation
- [ ] Batch URL processing
- [ ] Design system integration
- [ ] Performance analytics

## 📞 Support

For issues and questions:
1. Check the [troubleshooting guide](PLUGIN_DOCUMENTATION.md#troubleshooting)
2. Review [common issues](PLUGIN_DOCUMENTATION.md#common-issues)
3. Test with a simple website first
4. Open an issue with detailed error information

---

**Made with ❤️ for the Figma community**
