# Repository Guide - What to Include/Exclude

## ✅ Files to INCLUDE in Repository

### Core Plugin Files
- `manifest.json` - Figma plugin configuration
- `code.js` - Main plugin logic
- `ui.html` - Plugin user interface
- `config.js` - Configuration settings

### Backend Source Code
- `backend/server.js` - Express server
- `backend/package.json` - Dependencies
- `backend/render.yaml` - Render deployment config
- `backend/vercel.json` - Vercel deployment config
- `backend/railway.json` - Railway deployment config

### Documentation
- `README.md` - Project overview
- `INSTALLATION.md` - Setup instructions
- `PLUGIN_DOCUMENTATION.md` - Usage guide
- `RENDER_DEPLOYMENT.md` - Deployment guide
- All other `.md` documentation files

### Configuration Files
- `.gitignore` - Git ignore rules
- `package.json` - Root project config
- `vitest.config.js` - Test configuration

### Tests
- `tests/` directory - All test files
- `backend/tests/` - Backend-specific tests

### Scripts
- `deploy.sh` - Deployment scripts
- `*.sh` files - Utility scripts

## ❌ Files to EXCLUDE from Repository

### Dependencies
- `node_modules/` - NPM packages (auto-installed)
- `package-lock.json` - Lock files (can cause conflicts)
- `yarn.lock` - Yarn lock files

### Environment & Secrets
- `.env` - Environment variables
- `.env.local` - Local environment
- Any files with API keys or secrets

### Build & Cache
- `dist/` - Build outputs
- `build/` - Compiled files
- `.cache/` - Cache directories
- `coverage/` - Test coverage reports

### Deployment Artifacts
- `.vercel/` - Vercel deployment data
- `.netlify/` - Netlify deployment data
- `.railway/` - Railway deployment data

### IDE & OS Files
- `.vscode/` - VS Code settings (optional)
- `.DS_Store` - macOS system files
- `Thumbs.db` - Windows system files

### Logs & Temporary
- `*.log` - Log files
- `tmp/` - Temporary directories
- `temp/` - Temporary files

### Puppeteer Downloads
- `.local-chromium/` - Chrome binaries
- `.cache/puppeteer/` - Puppeteer cache

## 🔍 Current Repository Status

### Files Currently Tracked (Good ✅)
```
✅ manifest.json
✅ code.js
✅ ui.html
✅ README.md
✅ backend/server.js
✅ backend/package.json
✅ All documentation files
✅ Test files
✅ Configuration files
```

### Files That Should Be Ignored (Check ❌)
```
❌ backend/node_modules/ (if present)
❌ backend/package-lock.json (if present)
❌ backend/.vercel/ (if present)
❌ .DS_Store files (if present)
❌ Any .env files (if present)
```

## 🧹 Cleaning Up Repository

### Remove Files That Shouldn't Be Tracked
```bash
# Remove from git tracking (but keep locally)
git rm --cached backend/package-lock.json
git rm --cached -r backend/node_modules/
git rm --cached -r backend/.vercel/
git rm --cached .DS_Store

# Commit the removal
git commit -m "Remove files that shouldn't be tracked"
```

### Verify .gitignore is Working
```bash
# Check what files git sees
git status

# Should not show ignored files
# If it does, they need to be removed from tracking
```

## 📋 Best Practices

### Before Committing
1. **Check git status** - Review what's being added
2. **Verify no secrets** - No API keys, passwords, tokens
3. **Remove build artifacts** - No compiled or generated files
4. **Clean dependencies** - No node_modules or lock files

### Repository Structure
```
html-to-figma-plugin/
├── .gitignore              ✅ Include
├── README.md               ✅ Include
├── manifest.json           ✅ Include
├── code.js                 ✅ Include
├── ui.html                 ✅ Include
├── backend/
│   ├── server.js           ✅ Include
│   ├── package.json        ✅ Include
│   ├── render.yaml         ✅ Include
│   ├── node_modules/       ❌ Exclude (.gitignore)
│   └── .vercel/            ❌ Exclude (.gitignore)
├── tests/                  ✅ Include
├── docs/                   ✅ Include
└── node_modules/           ❌ Exclude (.gitignore)
```

## 🔒 Security Considerations

### Never Commit
- API keys or tokens
- Database passwords
- Private keys or certificates
- User data or personal information
- Deployment secrets

### Use Environment Variables
```bash
# Good: Use environment variables
BACKEND_URL=process.env.BACKEND_URL

# Bad: Hardcode secrets
API_KEY="sk-1234567890abcdef"
```

## ✅ Repository Health Check

Run this checklist before pushing:

- [ ] No `node_modules/` directories tracked
- [ ] No `.env` files with secrets
- [ ] No deployment artifacts (`.vercel/`, etc.)
- [ ] No OS-specific files (`.DS_Store`)
- [ ] No build outputs or cache directories
- [ ] All source code and documentation included
- [ ] `.gitignore` is comprehensive and working

A clean repository makes collaboration easier and deployment more reliable! 🚀
