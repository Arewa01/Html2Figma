# Backend Deployment Guide

## Vercel Deployment

### Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Create a Vercel account at https://vercel.com
3. Login to Vercel: `vercel login`

### Deployment Steps

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Choose configuration approach:**
   - **Option A (Recommended):** Use the default `vercel.json` with builds
   - **Option B:** If builds fail, rename `vercel-functions.json` to `vercel.json`

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Follow the prompts:**
   - Set up and deploy? Yes
   - Which scope? (Select your account)
   - Link to existing project? No (for first deployment)
   - What's your project's name? html-to-figma-backend
   - In which directory is your code located? ./

5. **Note the deployment URL** (e.g., https://html-to-figma-backend.vercel.app)

### Troubleshooting Vercel Deployment

If you encounter issues with the default configuration:

1. **Authentication Protection Error (HTTP 401):**
   If you see "Authentication Required" when testing:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Go to "Deployment Protection"
   - Disable "Vercel Authentication" or set to "Only Preview Deployments"
   - Redeploy: `vercel --prod`

2. **Try the functions-based config:**
   ```bash
   mv vercel.json vercel-builds.json
   mv vercel-functions.json vercel.json
   vercel --prod
   ```

3. **Check Vercel logs:**
   ```bash
   vercel logs
   ```

4. **Common issues:**
   - **Authentication protection:** Disable in Vercel dashboard settings
   - **Puppeteer size limits:** The config includes `maxLambdaSize: "50mb"`
   - **Timeout issues:** Functions are configured with 60-second timeout
   - **Memory issues:** Vercel Pro plan may be needed for heavy scraping

### Environment Configuration

The backend is configured to work in both development and production:
- **Development**: Runs on `http://localhost:3000`
- **Production**: Runs on Vercel's serverless platform

### Testing the Deployment

Test the health endpoint:
```bash
curl https://your-deployment-url.vercel.app/health
```

Test the scrape endpoint:
```bash
curl -X POST https://your-deployment-url.vercel.app/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "viewport": {"width": 1200, "height": 800}}'
```

### Alternative Deployment Options

#### AWS Lambda (using Serverless Framework)
1. Install Serverless: `npm install -g serverless`
2. Create `serverless.yml` configuration
3. Deploy: `serverless deploy`

#### Railway
1. Connect GitHub repository to Railway
2. Set environment variables
3. Deploy automatically on push

#### Render
1. Connect GitHub repository to Render
2. Configure build and start commands
3. Deploy automatically on push

### Performance Considerations

- Serverless functions have cold start times
- Puppeteer may take longer to initialize on first request
- Consider using a dedicated server for high-volume usage
- Monitor function execution time and memory usage

### Troubleshooting

**Common Issues:**
1. **Puppeteer not working on Vercel**: Ensure proper Chrome binary configuration
2. **Timeout errors**: Increase function timeout in vercel.json
3. **Memory issues**: Monitor memory usage and optimize scraping logic
4. **CORS errors**: Verify CORS configuration includes Figma domains

**Debugging:**
- Check Vercel function logs in dashboard
- Use `vercel logs` command for real-time logs
- Test locally with `vercel dev`
