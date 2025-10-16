# HTML to Figma Plugin - Installation Guide

This guide will walk you through the complete installation and setup process for the HTML to Figma Plugin.

## 📋 Prerequisites

- **Figma Desktop App** or **Figma in Browser** (with plugin development enabled)
- **Node.js** (version 16 or higher) for backend deployment
- **Git** for cloning the repository
- **Vercel Account** (recommended) or other cloud platform for backend deployment

## 🚀 Step-by-Step Installation

### Step 1: Get the Plugin Files

#### Option A: Download from Repository
1. Download the plugin files from the repository
2. Extract to a local directory

#### Option B: Clone Repository
```bash
git clone <repository-url>
cd html-to-figma-plugin
```

### Step 2: Deploy the Backend Service

The plugin requires a backend service to handle website scraping. Choose one of the deployment options below:

#### Option A: Vercel Deployment (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy the backend:**
   ```bash
   cd backend
   vercel --prod
   ```

4. **Note your deployment URL** (e.g., `https://html-to-figma-backend-abc123.vercel.app`)

#### Option B: Use Deployment Script
```bash
./deploy.sh
# Choose option 1 for Vercel deployment
```

#### Option C: Railway Deployment
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the `backend` directory
4. Note your deployment URL

#### Option D: Local Development
```bash
cd backend
npm install
npm start
# Backend will run on http://localhost:3000
```

### Step 3: Configure the Plugin

1. **Update Backend URL:**
   Open `code.js` and update the `BACKEND_URL`:
   
   ```javascript
   const CONFIG = {
       BACKEND_URL: 'https://your-deployment-url.vercel.app', // Replace with your URL
       // ... other config
   };
   ```

2. **For Local Development:**
   ```javascript
   BACKEND_URL: 'http://localhost:3000',
   ```

3. **Network Access Configuration:**
   The plugin is pre-configured for common platforms (Vercel, Railway, Render, etc.).
   
   **If using a custom domain:**
   - Add your domain to `allowedDomains` in `manifest.json`
   - See `NETWORK_ACCESS_SETUP.md` for detailed instructions

### Step 4: Install Plugin in Figma

1. **Open Figma Desktop App** (or Figma in browser)

2. **Access Plugin Development:**
   - Go to **Plugins** → **Development** → **Import plugin from manifest**
   - Or use the keyboard shortcut: `Cmd/Ctrl + Alt + P` → **Development** → **Import plugin from manifest**

3. **Select Manifest File:**
   - Navigate to your plugin directory
   - Select the `manifest.json` file
   - Click **Open**

4. **Plugin Installation:**
   - Figma will validate and install the plugin
   - The plugin will appear in **Plugins** → **Development** → **HTML to Figma Converter**

### Step 5: Test the Installation

#### Option A: Use Test Script
```bash
node test-deployment.js
```

This will automatically test:
- Backend connectivity
- Health endpoint
- Scraping functionality
- CORS configuration

#### Option B: Manual Testing
1. **Open the plugin** in Figma
2. **Enter a test URL:** `https://example.com`
3. **Select viewport:** Desktop (1200x800)
4. **Click "Convert Website"**
5. **Verify:** Plugin creates Figma elements

### Step 6: Verify Installation

✅ **Backend Service:**
- Health endpoint responds: `GET https://your-url/health`
- Returns JSON with status "OK"

✅ **Plugin in Figma:**
- Appears in Plugins → Development menu
- UI loads without errors
- Can input URLs and select viewport sizes

✅ **End-to-End Test:**
- Successfully converts a simple website
- Creates Figma nodes with proper styling
- Shows progress updates during conversion

## 🔧 Configuration Options

### Backend URL Configuration

**Development Mode:**
```javascript
BACKEND_URL: 'http://localhost:3000'
```

**Production Mode:**
```javascript
BACKEND_URL: 'https://your-deployment-url.vercel.app'
```

### Performance Tuning

Adjust these settings in `code.js` for your needs:

```javascript
const CONFIG = {
    REQUEST_TIMEOUT: 60000,    // Increase for slow websites
    MAX_RETRIES: 2,            // Number of retry attempts
    PERFORMANCE: {
        NODE_BATCH_SIZE: 15,   // Nodes created per batch
        BATCH_DELAY: 20,       // Delay between batches (ms)
    }
};
```

## 🐛 Troubleshooting

### Common Installation Issues

#### "Plugin not appearing in Figma"
- **Solution:** Ensure all files (`manifest.json`, `code.js`, `ui.html`) are in the same directory
- **Check:** Manifest.json syntax is valid
- **Try:** Reimport the plugin

#### "Backend service not available" or "Authentication Required"
- **Solution:** Verify backend is deployed and accessible
- **Check:** Backend URL in `code.js` is correct
- **Vercel Fix:** Disable "Deployment Protection" in Vercel dashboard (see `VERCEL_AUTH_FIX.md`)
- **Test:** Visit `https://your-url/health` in browser

#### "Network errors during conversion"
- **Solution:** Check internet connection
- **Verify:** Backend service is running
- **Try:** Test with a simple website first

#### "Figma plugin development not available"
- **Solution:** Use Figma Desktop App (browser version has limitations)
- **Enable:** Plugin development in Figma settings

### Testing Your Installation

1. **Backend Health Check:**
   ```bash
   curl https://your-deployment-url/health
   ```
   Should return: `{"status":"OK","timestamp":"...","service":"HTML to Figma Backend"}`

2. **Backend Scraping Test:**
   ```bash
   curl -X POST https://your-deployment-url/scrape \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com","viewport":{"width":1200,"height":800}}'
   ```

3. **Plugin Test:**
   - Open plugin in Figma
   - Convert `https://example.com`
   - Should create header, content, and footer elements

## 📚 Next Steps

After successful installation:

1. **Read the Documentation:** Check `PLUGIN_DOCUMENTATION.md` for detailed usage
2. **Try Different Websites:** Test with various site types
3. **Explore Features:** Try different viewport sizes and complex layouts
4. **Report Issues:** Use the troubleshooting guide for any problems

## 🔄 Updating the Plugin

To update the plugin:

1. **Update Files:** Replace plugin files with new versions
2. **Redeploy Backend:** If backend changes are included
3. **Reimport Plugin:** In Figma, reimport the manifest.json
4. **Test Changes:** Verify everything works as expected

## 🆘 Getting Help

If you encounter issues:

1. **Check Troubleshooting:** Review the troubleshooting section above
2. **Test with Simple Sites:** Try `https://example.com` first
3. **Check Console:** Look for errors in browser/Figma console
4. **Verify Configuration:** Ensure backend URL is correct
5. **Test Backend:** Use the test script or manual curl commands

## 📞 Support Resources

- **Plugin Documentation:** `PLUGIN_DOCUMENTATION.md`
- **Backend Deployment:** `backend/deploy.md`
- **Test Script:** `node test-deployment.js`
- **Configuration:** `config.js`

---

**🎉 Congratulations! You're ready to convert websites to Figma designs!**
