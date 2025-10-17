# HTML to Figma Plugin

A Figma plugin that converts websites into Figma designs by scraping HTML content and recreating it as native Figma components.

## Quick Start

### 1. Start Backend Server
```bash
cd backend
npm install
npm start
```
The backend will run on `http://localhost:5000`

### 2. Install Plugin in Figma
1. Open Figma Desktop App
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Select the `manifest.json` file from this project
4. The plugin will appear in your Plugins menu

### 3. Use the Plugin
1. Open the plugin in Figma
2. Enter a website URL (e.g., `https://example.com`)
3. Select viewport size (Desktop/Tablet/Mobile)
4. Click **Convert Website**
5. The plugin will create Figma elements matching the website design

## Project Structure

```
├── manifest.json          # Figma plugin configuration
├── code.js                # Main plugin logic
├── ui.html                # Plugin user interface
├── backend/               # Backend scraping service
│   ├── server.js          # Express server with Puppeteer
│   └── package.json       # Backend dependencies
└── tests/                 # Test files
```

## Requirements

- **Figma Desktop App**
- **Node.js** (version 18+)
- **Chrome/Chromium** (for Puppeteer)

## Testing

Test the backend:
```bash
node test-deployment.js
```

## License

MIT License
