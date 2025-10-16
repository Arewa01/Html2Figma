# Vercel Deployment Troubleshooting

## Common Vercel Configuration Issues

### Issue 1: "The `name` property is deprecated"
**Solution:** The `name` property has been removed from `vercel.json`. Use project settings in Vercel dashboard instead.

### Issue 2: "The `functions` property cannot be used with `builds`"
**Solution:** Choose one approach:

#### Option A: Use Builds (Default)
```json
{
    "version": 2,
    "builds": [
        {
            "src": "server.js",
            "use": "@vercel/node",
            "config": {
                "maxLambdaSize": "50mb"
            }
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "/server.js"
        }
    ]
}
```

#### Option B: Use Functions (Alternative)
```json
{
    "version": 2,
    "functions": {
        "server.js": {
            "runtime": "@vercel/node@3",
            "maxDuration": 60
        }
    },
    "routes": [
        {
            "src": "/(.*)",
            "dest": "/server.js"
        }
    ]
}
```

## Quick Fix Steps

1. **If deployment fails with default config:**
   ```bash
   cd backend
   mv vercel.json vercel-builds.json
   mv vercel-functions.json vercel.json
   vercel --prod
   ```

2. **Check deployment logs:**
   ```bash
   vercel logs
   ```

3. **Test the deployed service:**
   ```bash
   curl https://your-deployment-url.vercel.app/health
   ```

## Puppeteer-Specific Issues

### Issue: "Puppeteer executable not found"
**Solution:** Vercel automatically handles Puppeteer in serverless functions. Ensure you're using the correct runtime.

### Issue: "Function size too large"
**Solution:** The config includes `maxLambdaSize: "50mb"` to handle Puppeteer's size requirements.

### Issue: "Function timeout"
**Solution:** Functions are configured with 60-second timeout. For slower websites, consider:
- Using Vercel Pro for longer timeouts
- Optimizing scraping logic
- Implementing request queuing

## Alternative Deployment Platforms

If Vercel continues to have issues:

### Railway
```bash
# Connect GitHub repo to Railway
# Deploy backend directory automatically
```

### AWS Lambda (Serverless Framework)
```yaml
# serverless.yml
service: html-to-figma-backend
provider:
  name: aws
  runtime: nodejs18.x
  timeout: 60
functions:
  scrape:
    handler: server.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
```

### Render
```yaml
# render.yaml
services:
  - type: web
    name: html-to-figma-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
```

## Testing Deployment

After successful deployment:

1. **Health check:**
   ```bash
   curl https://your-url/health
   ```

2. **Scraping test:**
   ```bash
   curl -X POST https://your-url/scrape \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com","viewport":{"width":1200,"height":800}}'
   ```

3. **Run test script:**
   ```bash
   node ../test-deployment.js
   ```

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Puppeteer on Vercel:** https://vercel.com/guides/using-puppeteer-with-vercel
- **Serverless Functions:** https://vercel.com/docs/functions/serverless-functions
