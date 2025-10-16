# HTML to Figma Backend Service

Backend scraping service for the HTML to Figma plugin. Uses Puppeteer to scrape websites and extract visual elements for conversion to Figma designs.

## Features

- Website scraping with Puppeteer headless browser
- Element extraction with positioning and styling
- Asset discovery (images, fonts)
- CORS support for Figma plugin integration
- Rate limiting and security middleware
- Error handling and validation

## Installation

```bash
cd backend
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on port 3000 (or PORT environment variable).

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and timestamp.

### Scrape Website
```
POST /scrape
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "viewport": {
    "width": 1200,
    "height": 800
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "url": "https://example.com",
    "viewport": { "width": 1200, "height": 800 },
    "elements": [
      {
        "id": "element-0",
        "tagName": "div",
        "textContent": "Example text",
        "bounds": { "x": 0, "y": 0, "width": 100, "height": 50 },
        "styles": {
          "backgroundColor": "rgb(255, 255, 255)",
          "color": "rgb(0, 0, 0)",
          "fontSize": 16,
          "fontFamily": "Arial, sans-serif"
        }
      }
    ],
    "assets": {
      "images": ["https://example.com/image.jpg"],
      "fonts": []
    }
  }
}
```

## Testing

Test the scraper with a sample website:

```bash
node test-scraper.js
```

Make sure the server is running first.

## Configuration

Copy `.env.example` to `.env` and adjust settings:

- `PORT` - Server port (default: 3000)
- `PUPPETEER_HEADLESS` - Run browser in headless mode
- `PUPPETEER_TIMEOUT` - Page load timeout in milliseconds
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `CORS_ORIGINS` - Allowed CORS origins

## Security Features

- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes per IP)
- CORS configuration for Figma integration
- URL validation
- Request size limits

## Error Handling

The service handles various error scenarios:

- Invalid URLs
- Network timeouts
- Connection refused
- DNS resolution failures
- Server errors

## Deployment

For production deployment:

1. Set environment variables
2. Use a process manager like PM2
3. Configure reverse proxy (nginx)
4. Set up SSL/TLS certificates
5. Monitor logs and performance

## Dependencies

- **express** - Web framework
- **puppeteer** - Headless browser automation
- **cors** - Cross-origin resource sharing
- **helmet** - Security middleware
- **express-rate-limit** - Rate limiting
