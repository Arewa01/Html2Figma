# Render Deployment Troubleshooting

## Common Issues and Solutions

### Issue: "No render.yaml found on main branch"

**Cause**: Render can't find the configuration file

**Solutions**:

#### Option 1: Use Manual Setup (Easiest)
1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"** (not Blueprint)
3. Connect your GitHub repository
4. Manual configuration:
   - **Name**: `html-to-figma-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Starter`

#### Option 2: Fix render.yaml Location
1. Ensure `render.yaml` is in the **root directory** of your repository
2. Commit and push to main branch:
   ```bash
   git add render.yaml
   git commit -m "Add render.yaml for deployment"
   git push origin main
   ```
3. Try Blueprint deployment again

#### Option 3: Use Backend Directory render.yaml
1. In Render dashboard, select **"Web Service"**
2. Set **Root Directory** to `backend`
3. Render will find `backend/render.yaml`

### Issue: Build Fails

**Common Causes**:
- Missing `package.json` in root directory
- Node.js version compatibility
- Missing dependencies

**Solutions**:
1. **Check Build Logs** in Render dashboard
2. **Verify package.json** exists in backend directory
3. **Test locally**:
   ```bash
   cd backend
   npm install
   npm start
   ```

### Issue: Service Won't Start

**Common Causes**:
- Port configuration issues
- Missing environment variables
- Application crashes on startup

**Solutions**:
1. **Check Service Logs** in Render dashboard
2. **Verify Health Check**: Service should respond to `/health`
3. **Test locally**:
   ```bash
   cd backend
   NODE_ENV=production npm start
   curl http://localhost:3000/health
   ```

### Issue: Puppeteer Errors

**Common Causes**:
- Chrome not installed (shouldn't happen on Render)
- Memory limits exceeded
- Timeout issues

**Solutions**:
1. **Check Memory Usage** in Render dashboard
2. **Upgrade Plan** if using too much memory
3. **Verify Puppeteer Config** in server.js

## Step-by-Step Manual Deployment

If automatic deployment isn't working, use this manual process:

### 1. Create Web Service
1. Go to [render.com](https://render.com)
2. Sign up/login
3. Click **"New +"**
4. Select **"Web Service"**

### 2. Connect Repository
1. Connect your GitHub account
2. Select your repository
3. Select the **main** branch

### 3. Configure Service
```
Name: html-to-figma-backend
Root Directory: backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

### 4. Set Environment Variables
```
NODE_ENV: production
```

### 5. Choose Plan
- **Starter**: Free tier (good for testing)
- **Standard**: Paid tier (better performance)

### 6. Deploy
1. Click **"Create Web Service"**
2. Wait for build and deployment
3. Check logs for any errors

## Verification Steps

After deployment, verify everything works:

### 1. Health Check
```bash
curl https://your-app.onrender.com/health
```
Should return: `{"status":"OK",...}`

### 2. Scraping Test
```bash
curl -X POST https://your-app.onrender.com/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","viewport":{"width":1200,"height":800}}'
```

### 3. Update Plugin
1. Edit `code.js`
2. Update `BACKEND_URL` with your Render URL
3. Test in Figma

## Alternative: Railway Deployment

If Render continues to have issues, try Railway:

1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Deploy `backend` directory
4. Railway handles everything automatically

## Getting Help

### Render Support
- Check [Render Documentation](https://render.com/docs)
- Review build and service logs
- Contact Render support if needed

### Plugin Support
- Review `RENDER_DEPLOYMENT.md`
- Check `PLUGIN_DOCUMENTATION.md`
- Test backend locally first

## Success Indicators

✅ **Deployment Successful When**:
- Build completes without errors
- Service starts and stays running
- Health check returns 200 OK
- Scraping endpoint works
- Plugin can connect from Figma

The key is getting the basic web service running first, then testing the Puppeteer functionality! 🚀
