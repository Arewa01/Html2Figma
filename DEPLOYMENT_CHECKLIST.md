# Deployment Checklist

Complete this checklist to successfully deploy and configure the HTML to Figma Plugin.

## ✅ Pre-Deployment Checklist

- [ ] **Node.js installed** (version 16+)
- [ ] **Figma Desktop App** installed
- [ ] **Git** installed (if cloning repository)
- [ ] **Vercel account** created (or alternative platform)
- [ ] **Plugin files** downloaded/cloned

## ✅ Backend Deployment

### Option 1: Vercel (Recommended)
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login to Vercel: `vercel login`
- [ ] Navigate to backend: `cd backend`
- [ ] Deploy: `vercel --prod`
- [ ] **Copy deployment URL** (e.g., `https://html-to-figma-backend-xyz.vercel.app`)

### Option 2: Railway
- [ ] Connect GitHub repository to Railway
- [ ] Deploy `backend` directory
- [ ] **Copy deployment URL**

### Option 3: Local Development
- [ ] Navigate to backend: `cd backend`
- [ ] Install dependencies: `npm install`
- [ ] Start server: `npm start`
- [ ] **Use URL:** `http://localhost:3000`

## ✅ Plugin Configuration

- [ ] **Update Backend URL** in `code.js`:
  ```javascript
  BACKEND_URL: 'https://your-actual-deployment-url.vercel.app',
  ```

- [ ] **Verify configuration** by checking the URL format:
  - ✅ Starts with `http://` or `https://`
  - ✅ No trailing slash
  - ✅ Accessible in browser

## ✅ Figma Plugin Installation

- [ ] **Open Figma Desktop App**
- [ ] **Go to:** Plugins → Development → Import plugin from manifest
- [ ] **Select:** `manifest.json` file from plugin directory
- [ ] **Verify:** Plugin appears in Plugins → Development menu

## ✅ Testing & Verification

### Backend Testing
- [ ] **Health check:** Visit `https://your-url/health` in browser
- [ ] **Should return:** JSON with `"status": "OK"`
- [ ] **Run test script:** `node test-deployment.js`
- [ ] **All tests pass** (or at least health and scrape tests)

### Plugin Testing
- [ ] **Open plugin** in Figma
- [ ] **Test URL:** `https://example.com`
- [ ] **Select viewport:** Desktop (1200x800)
- [ ] **Click:** "Convert Website"
- [ ] **Verify:** Creates Figma elements successfully

### End-to-End Testing
- [ ] **Test simple website:** example.com
- [ ] **Test complex website:** A real website with images and styling
- [ ] **Test different viewports:** Desktop, Tablet, Mobile
- [ ] **Verify error handling:** Try invalid URL

## ✅ Documentation & Maintenance

- [ ] **Read documentation:** `PLUGIN_DOCUMENTATION.md`
- [ ] **Bookmark URLs:**
  - Backend health: `https://your-url/health`
  - Vercel dashboard (if using Vercel)
- [ ] **Save configuration:** Note backend URL for future reference

## 🚨 Common Issues & Solutions

### Backend Issues
- **404 Error:** Backend not deployed or wrong URL
  - ✅ **Solution:** Redeploy backend, verify URL
- **Timeout Error:** Backend taking too long to respond
  - ✅ **Solution:** Check backend logs, try simpler website
- **CORS Error:** Cross-origin request blocked
  - ✅ **Solution:** Verify CORS configuration in backend

### Plugin Issues
- **Plugin not visible:** Import failed
  - ✅ **Solution:** Check manifest.json syntax, reimport
- **Network error:** Can't reach backend
  - ✅ **Solution:** Verify backend URL in code.js
- **Conversion fails:** Website can't be processed
  - ✅ **Solution:** Try different website, check backend logs

## 📋 Final Verification

Before marking deployment complete, verify:

- [ ] ✅ **Backend deployed** and accessible
- [ ] ✅ **Plugin installed** in Figma
- [ ] ✅ **Configuration updated** with correct backend URL
- [ ] ✅ **Test conversion works** with example.com
- [ ] ✅ **Error handling works** with invalid URL
- [ ] ✅ **Documentation reviewed**

## 🎉 Deployment Complete!

Once all items are checked:

1. **Plugin is ready for use**
2. **Share with team members** (they'll need to import the plugin too)
3. **Monitor backend usage** through your deployment platform
4. **Keep documentation handy** for troubleshooting

## 📞 Support

If you encounter issues:
1. **Review this checklist** - ensure all steps completed
2. **Run test script:** `node test-deployment.js`
3. **Check documentation:** `PLUGIN_DOCUMENTATION.md`
4. **Test with simple websites first**

---

**Deployment Status:** 
- [ ] 🔄 In Progress
- [ ] ✅ Complete and Tested
- [ ] ❌ Issues Found (see troubleshooting section)
