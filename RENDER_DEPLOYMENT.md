# Render Deployment Guide

## Why Render for Puppeteer?

✅ **Automatic Chrome Installation** - No configuration needed  
✅ **Full Linux Environment** - Not serverless limitations  
✅ **Better for System Dependencies** - Handles Puppeteer perfectly  
✅ **Simple Deployment** - Connect GitHub and deploy  
✅ **Free Tier Available** - Great for testing  

## Quick Deployment Steps

### 1. Prepare Repository
- ✅ Simplified `package.json` (regular puppeteer)
- ✅ Optimized `server.js` for Render
- ✅ `render.yaml` configuration included

### 2. Deploy to Render

#### Option A: Auto-Deploy with render.yaml (Recommended)
1. **Ensure render.yaml is committed** to your main branch
2. Go to [render.com](https://render.com) and sign up
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repository
5. Render will automatically detect and deploy using the render.yaml configuration

#### Option B: Manual Web Dashboard Setup
1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure deployment:
   - **Name**: `html-to-figma-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (free tier)
   - **Health Check Path**: `/health`

#### Option C: Deploy Specific Branch/Directory
If you need to deploy from a specific setup:
1. Select **"Web Service"** (not Blueprint)
2. Choose your repository and branch
3. Set **Root Directory** to `backend`
4. Use the manual configuration above

### 3. Configuration
- **Health Check**: `/health` endpoint configured
- **Environment**: Production settings applied
- **Port**: Automatically configured (10000)

### 4. Get Your URL
After deployment, you'll get a URL like:
`https://html-to-figma-backend.onrender.com`

## Update Plugin Configuration

1. **Update Backend URL in `code.js`:**
   ```javascript
   BACKEND_URL: 'https://html-to-figma-backend.onrender.com',
   ```

2. **Add Render Domain to `manifest.json`:**
   ```json
   "networkAccess": {
       "allowedDomains": [
           "https://*.onrender.com",
           // ... other domains
       ]
   }
   ```

## Testing Deployment

### 1. Health Check
```bash
curl https://your-app.onrender.com/health
```

### 2. Scraping Test
```bash
curl -X POST https://your-app.onrender.com/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","viewport":{"width":1200,"height":800}}'
```

### 3. Full Test Suite
```bash
# Update BACKEND_URL in code.js first
node test-deployment.js
```

## Render Advantages

### vs Vercel
- ✅ **No Chrome installation issues**
- ✅ **No serverless limitations**
- ✅ **Persistent environment**
- ✅ **Better for long-running processes**

### vs Railway
- ✅ **More predictable pricing**
- ✅ **Better free tier**
- ✅ **Simpler configuration**

### vs Heroku
- ✅ **Better performance**
- ✅ **More generous free tier**
- ✅ **Modern platform**

## Performance Notes

- **Cold Start**: ~10-30 seconds (better than serverless)
- **Memory**: 512MB on free tier (sufficient for Puppeteer)
- **Build Time**: ~2-3 minutes
- **Uptime**: Excellent (99.9%+)

## Troubleshooting

### Common Issues

#### Build Fails
- Check `package.json` syntax
- Ensure `npm install` works locally
- Review build logs in Render dashboard

#### Service Won't Start
- Verify `npm start` works locally
- Check environment variables
- Review service logs

#### Puppeteer Errors
- Render automatically installs Chrome
- No additional configuration needed
- Check memory usage (upgrade plan if needed)

### Debug Commands

```bash
# Check service status
curl https://your-app.onrender.com/health

# View logs in Render dashboard
# Go to your service → Logs tab

# Test locally with production config
NODE_ENV=production npm start
```

## Scaling

### Free Tier Limits
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- 512MB RAM

### Paid Plans
- Always-on service
- More memory and CPU
- Custom domains
- Better performance

## Security

- **HTTPS by default**
- **Environment variables** for secrets
- **Network isolation**
- **DDoS protection**

## Next Steps After Deployment

1. ✅ **Test all endpoints**
2. ✅ **Update plugin configuration**
3. ✅ **Test in Figma**
4. ✅ **Monitor performance**

Render is the **perfect platform** for Puppeteer applications - no configuration headaches, just works! 🚀
