# Network Access Configuration

## Overview

The HTML to Figma Plugin requires network access to communicate with the backend scraping service. Figma requires explicit domain permissions in the `manifest.json` file.

## Current Allowed Domains

The plugin is pre-configured to work with these platforms:

- **Vercel**: `https://*.vercel.app`
- **Railway**: `https://*.railway.app`
- **Render**: `https://*.render.com`
- **Heroku**: `https://*.herokuapp.com`
- **Netlify**: `https://*.netlify.app`
- **AWS**: `https://*.amazonaws.com`, `https://*.cloudfront.net`
- **Local Development**: `http://localhost:3000`, `http://localhost:8000`, `http://127.0.0.1:3000`
- **Testing**: `https://example.com`

## Adding Custom Domains

If you deploy your backend to a different platform or custom domain:

### 1. Update manifest.json

Add your domain to the `allowedDomains` array:

```json
{
    "networkAccess": {
        "allowedDomains": [
            "https://*.vercel.app",
            "https://*.railway.app",
            "https://your-custom-domain.com",
            "https://*.your-platform.com"
        ]
    }
}
```

### 2. Reimport Plugin

After updating the manifest:
1. Go to **Plugins** → **Development** → **Import plugin from manifest**
2. Select the updated `manifest.json` file
3. Figma will reload the plugin with new permissions

## Domain Format Rules

### ✅ Valid Formats
- `https://example.com` - Specific domain
- `https://*.example.com` - All subdomains
- `http://localhost:3000` - Local development with port
- `https://api.example.com` - Specific subdomain

### ❌ Invalid Formats
- `*` - Wildcard not allowed
- `http://*` - Protocol wildcards not allowed
- `example.com` - Must include protocol
- `https://*.com` - Too broad, not allowed

## Common Deployment Platforms

### Vercel
- **Pattern**: `https://*.vercel.app`
- **Example**: `https://my-backend-abc123.vercel.app`
- **Status**: ✅ Pre-configured

### Railway
- **Pattern**: `https://*.railway.app`
- **Example**: `https://my-backend-production.railway.app`
- **Status**: ✅ Pre-configured

### Render
- **Pattern**: `https://*.render.com`
- **Example**: `https://my-backend.onrender.com`
- **Status**: ✅ Pre-configured

### AWS Lambda (API Gateway)
- **Pattern**: `https://*.amazonaws.com`
- **Example**: `https://abc123.execute-api.us-east-1.amazonaws.com`
- **Status**: ✅ Pre-configured

### Heroku
- **Pattern**: `https://*.herokuapp.com`
- **Example**: `https://my-backend.herokuapp.com`
- **Status**: ✅ Pre-configured

### Custom Domain
- **Pattern**: `https://your-domain.com`
- **Example**: `https://api.mycompany.com`
- **Status**: ❌ Requires manual addition

## Troubleshooting Network Issues

### Error: "Network request blocked"
**Cause**: Backend domain not in allowedDomains list
**Solution**: Add your backend domain to manifest.json and reimport plugin

### Error: "CORS error"
**Cause**: Backend doesn't allow requests from Figma
**Solution**: Update backend CORS configuration to include `https://www.figma.com`

### Error: "Connection refused"
**Cause**: Backend service is not running or accessible
**Solution**: 
1. Check backend deployment status
2. Test backend health endpoint in browser
3. Verify backend URL in plugin configuration

## Security Considerations

### Why Domain Restrictions?
- **Security**: Prevents plugins from accessing arbitrary websites
- **Privacy**: Limits data exposure to approved services
- **Performance**: Reduces unnecessary network requests

### Best Practices
- **Minimal Permissions**: Only add domains you actually use
- **HTTPS Preferred**: Use HTTPS domains when possible
- **Specific Domains**: Avoid overly broad patterns when possible

## Testing Network Access

### 1. Test Backend Connectivity
```bash
# Test your backend health endpoint
curl https://your-backend-url/health
```

### 2. Test from Plugin
1. Open plugin in Figma
2. Check browser console for network errors
3. Try converting a simple website

### 3. Verify CORS
```bash
# Test CORS headers
curl -H "Origin: https://www.figma.com" https://your-backend-url/health
```

## Quick Setup for Common Platforms

### For Vercel Deployment
```json
"allowedDomains": ["https://*.vercel.app"]
```

### For Railway Deployment
```json
"allowedDomains": ["https://*.railway.app"]
```

### For Local Development
```json
"allowedDomains": ["http://localhost:3000"]
```

### For Multiple Platforms
```json
"allowedDomains": [
    "https://*.vercel.app",
    "https://*.railway.app",
    "http://localhost:3000"
]
```

## Support

If you need help configuring network access:
1. Check the deployment platform documentation
2. Verify your backend URL format
3. Test backend accessibility in browser
4. Review Figma plugin network access documentation
