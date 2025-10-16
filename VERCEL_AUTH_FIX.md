# Vercel Authentication Protection Fix

## Issue: HTTP 401 "Authentication Required"

If your deployed backend returns a 401 error with "Authentication Required", this means Vercel's Deployment Protection is enabled.

## Quick Fix Steps

### Option 1: Disable via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Find your `html-to-figma-backend` project

2. **Access Project Settings:**
   - Click on your project
   - Go to "Settings" tab
   - Navigate to "Deployment Protection"

3. **Disable Authentication:**
   - Find "Vercel Authentication" setting
   - Change from "All Deployments" to "Disabled" or "Only Preview Deployments"
   - Save changes

4. **Redeploy:**
   ```bash
   cd backend
   vercel --prod
   ```

### Option 2: Use Environment Variable

Add to your `vercel.json`:
```json
{
    "env": {
        "VERCEL_DEPLOYMENT_PROTECTION_BYPASS": "false"
    }
}
```

### Option 3: Alternative Deployment

If authentication issues persist, try a different platform:

#### Railway (No authentication by default)
```bash
# Connect GitHub repo to Railway
# Deploy automatically
```

#### Render (Public by default)
```bash
# Connect GitHub repo to Render
# Deploy with public access
```

## Testing After Fix

1. **Test health endpoint:**
   ```bash
   curl https://your-deployment-url/health
   ```
   Should return: `{"status":"OK",...}`

2. **Run test script:**
   ```bash
   node test-deployment.js
   ```

3. **Test in browser:**
   Visit `https://your-deployment-url/health` directly

## Why This Happens

Vercel's Deployment Protection is a security feature that:
- Protects preview deployments from unauthorized access
- Can be accidentally enabled for production deployments
- Requires authentication for all requests

For public APIs like our scraping service, this protection should be disabled.

## Prevention

To avoid this in future deployments:
1. Check deployment protection settings before deploying
2. Use the test script after each deployment
3. Consider using Railway or Render for simpler public API deployment

## Alternative: Use Bypass Token

If you must keep authentication enabled:

1. **Get bypass token from Vercel dashboard**
2. **Update plugin to include token:**
   ```javascript
   const response = await fetch(`${CONFIG.BACKEND_URL}/scrape?x-vercel-protection-bypass=${BYPASS_TOKEN}`, {
       // ... rest of request
   });
   ```

However, this is not recommended for public plugins.

## Support

If issues persist:
1. Check Vercel documentation on deployment protection
2. Try deploying to Railway or Render instead
3. Verify the backend works locally first
