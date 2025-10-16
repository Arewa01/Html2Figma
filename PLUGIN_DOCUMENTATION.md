# HTML to Figma Plugin Documentation

## Overview

The HTML to Figma Plugin allows you to convert entire websites into Figma designs with pixel-perfect accuracy. Simply provide a website URL, and the plugin will scrape the content and recreate it as native Figma components.

## Features

- **Complete Website Conversion**: Convert entire web pages to Figma designs
- **Pixel-Perfect Accuracy**: Maintains original layout, colors, fonts, and spacing
- **Native Figma Components**: Creates editable text, frames, and shapes
- **Asset Handling**: Processes images, fonts, and background elements
- **Responsive Design Support**: Capture websites at different viewport sizes
- **Error Handling**: Comprehensive error reporting and retry functionality

## Installation

### Prerequisites
1. Figma Desktop App or Figma in browser
2. Backend service deployed (see Backend Setup section)

### Plugin Installation
1. Download the plugin files (`manifest.json`, `code.js`, `ui.html`)
2. In Figma, go to **Plugins** → **Development** → **Import plugin from manifest**
3. Select the `manifest.json` file
4. The plugin will appear in your **Plugins** → **Development** menu

## Usage

### Basic Conversion
1. Open the plugin from **Plugins** → **Development** → **HTML to Figma Converter**
2. Enter a website URL (must start with `http://` or `https://`)
3. Select viewport size:
   - **Desktop**: 1200x800px
   - **Tablet**: 768x1024px  
   - **Mobile**: 375x667px
4. Click **Convert Website**
5. Wait for the conversion to complete

### Supported Websites
- Static websites and landing pages
- E-commerce sites
- Blogs and content sites
- Marketing pages
- Simple web applications

### Limitations
- JavaScript-heavy single-page applications may not render correctly
- Some websites block automated access
- Very large websites may hit processing limits
- Dynamic content (animations, videos) will be captured as static elements

## Backend Setup

The plugin requires a backend service to handle website scraping. The backend is built with Node.js and can be deployed to various platforms.

### Deployment Options

#### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to the `backend` directory
3. Run `vercel --prod`
4. Follow the prompts to deploy
5. Update the `BACKEND_URL` in `code.js` with your deployment URL

#### Option 2: Railway
1. Connect your GitHub repository to Railway
2. Deploy the `backend` directory
3. Update the `BACKEND_URL` in `code.js`

#### Option 3: AWS Lambda
1. Use the Serverless Framework
2. Configure `serverless.yml`
3. Deploy with `serverless deploy`

#### Option 4: Local Development
1. Navigate to `backend` directory
2. Run `npm install`
3. Run `npm start`
4. Use `http://localhost:3000` as the backend URL

### Backend Configuration
Update the `BACKEND_URL` in `code.js`:
```javascript
const CONFIG = {
    BACKEND_URL: 'https://your-deployment-url.vercel.app',
    // ... other config
};
```

## Configuration

### Environment Switching
To switch between development and production:

1. **Development Mode** (local backend):
   ```javascript
   BACKEND_URL: 'http://localhost:3000'
   ```

2. **Production Mode** (deployed backend):
   ```javascript
   BACKEND_URL: 'https://your-deployment-url.vercel.app'
   ```

### Performance Tuning
Adjust these settings in `code.js` for better performance:

```javascript
const CONFIG = {
    REQUEST_TIMEOUT: 60000, // Increase for slow websites
    MAX_RETRIES: 2, // Number of retry attempts
    PERFORMANCE: {
        NODE_BATCH_SIZE: 15, // Nodes created per batch
        BATCH_DELAY: 20, // Delay between batches (ms)
    }
};
```

## Troubleshooting

### Common Issues

#### "Backend service not available"
- **Cause**: Backend service is not running or URL is incorrect
- **Solution**: 
  1. Check if backend is deployed and accessible
  2. Verify `BACKEND_URL` in `code.js`
  3. Test backend health endpoint: `GET /health`

#### "Website took too long to load"
- **Cause**: Website is slow or has heavy content
- **Solution**:
  1. Try a simpler page first
  2. Increase `REQUEST_TIMEOUT` in config
  3. Check if website is responsive

#### "Website not found or unreachable"
- **Cause**: Invalid URL or website is down
- **Solution**:
  1. Verify URL format (include `http://` or `https://`)
  2. Check if website is accessible in browser
  3. Try a different website

#### "Conversion failed partially"
- **Cause**: Some elements couldn't be processed
- **Solution**:
  1. Check the created elements - partial conversion may still be useful
  2. Try a different viewport size
  3. Some complex CSS may not be fully supported

#### Plugin doesn't appear in Figma
- **Cause**: Installation issue or manifest problems
- **Solution**:
  1. Ensure all files (`manifest.json`, `code.js`, `ui.html`) are in the same directory
  2. Check manifest.json syntax
  3. Try reimporting the plugin

### Performance Issues

#### Slow conversion
- Reduce viewport size for faster processing
- Try simpler websites first
- Check backend deployment region (closer is faster)

#### Memory issues
- Close other Figma files
- Restart Figma if needed
- Try smaller websites

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid URL provided" | URL format is incorrect | Use full URL with protocol |
| "Network Connection Error" | Can't reach backend | Check internet and backend status |
| "Request Timeout" | Website took too long | Try simpler page or increase timeout |
| "Website Not Found" | URL doesn't exist | Verify URL is correct |
| "Content Processing Error" | Scraping failed | Website may block automation |

## API Reference

### Backend Endpoints

#### Health Check
```
GET /health
```
Returns service status and timestamp.

#### Scrape Website
```
POST /scrape
Content-Type: application/json

{
  "url": "https://example.com",
  "viewport": {
    "width": 1200,
    "height": 800
  },
  "timeout": 60000
}
```

Returns website data with elements, styles, and assets.

### Plugin Messages

The plugin uses these message types for UI communication:

- `convert-website`: Start conversion process
- `test-backend`: Check backend connectivity  
- `progress`: Update conversion progress
- `complete`: Conversion finished successfully
- `error`: Conversion failed with error details

## Development

### Local Development Setup
1. Clone the repository
2. Install backend dependencies: `cd backend && npm install`
3. Start backend: `npm start`
4. Import plugin in Figma using development mode
5. Update `BACKEND_URL` to `http://localhost:3000`

### Testing
- Backend tests: `cd backend && npm test`
- Plugin tests: `npm test`
- Manual testing with various websites

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

## Security and Privacy

- **No Data Storage**: The plugin doesn't store any website data
- **Temporary Processing**: Scraped content is processed in memory only
- **CORS Protection**: Backend includes CORS and rate limiting
- **Safe Scraping**: Uses headless browser in sandbox environment

## License

This plugin is released under the MIT License. See LICENSE file for details.

## Support

For issues and questions:
1. Check this documentation first
2. Review common troubleshooting steps
3. Test with a simple website (like example.com)
4. Check browser console for error details

## Changelog

### Version 1.0.0
- Initial release
- Complete website conversion
- Responsive viewport support
- Error handling and retry logic
- Performance optimizations
