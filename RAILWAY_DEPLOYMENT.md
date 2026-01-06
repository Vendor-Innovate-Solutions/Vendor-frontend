# Railway Deployment Guide

## Overview
This project is configured for deployment on Railway with Next.js 15.

## Prerequisites
- Railway account ([railway.app](https://railway.app))
- GitHub repository connected
- Node.js 20+ (handled by Railway)

## Deployment Files
- `railway.toml` - Railway platform configuration
- `railway.json` - Alternative JSON configuration
- `nixpacks.toml` - Build configuration
- `.env.production` - Production environment variables

## Environment Variables
Set these in Railway Dashboard:

### Required Variables
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
```

### Optional Variables
```
PORT=3000
```

## Deployment Steps

### Method 1: Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Method 2: GitHub Integration
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository
5. Railway will auto-detect Next.js and deploy

### Method 3: Railway Dashboard
1. Login to Railway
2. New Project → Deploy from GitHub
3. Select repository
4. Add environment variables
5. Deploy

## Build Configuration

### package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Railway Auto-Detection
Railway automatically detects:
- Next.js framework
- Node.js 20
- Build command: `npm run build`
- Start command: `npm start`

## Post-Deployment

### Verify Deployment
1. Check build logs in Railway dashboard
2. Visit the deployed URL
3. Test authentication flows
4. Verify API connectivity

### Custom Domain (Optional)
1. Go to Settings → Domains in Railway
2. Add custom domain
3. Update DNS records as shown
4. Wait for SSL certificate

## Troubleshooting

### Build Failures
```bash
# Check logs
railway logs

# Rebuild
railway up --detach
```

### Environment Issues
- Verify all env variables are set
- Check API_URL is correct
- Ensure HTTPS for production

### Port Issues
Railway auto-assigns PORT variable. Next.js uses it automatically.

## Monitoring

### Railway Dashboard
- View logs: `railway logs`
- Check metrics: CPU, Memory, Network
- Monitor deployments

### Health Checks
Railway automatically monitors your app and restarts on failure.

## Scaling

### Vertical Scaling
Upgrade plan in Railway for more resources:
- CPU cores
- Memory
- Network bandwidth

### Horizontal Scaling
Consider these patterns:
- CDN for static assets
- Load balancing (Railway Pro)
- Database connection pooling

## CI/CD

Railway provides automatic deployments:
- Push to main → Auto deploy
- Pull requests → Preview deployments
- Rollback available in dashboard

## Security

### Production Checklist
- [ ] Environment variables set
- [ ] API_URL uses HTTPS
- [ ] Remove console.logs
- [ ] Enable CORS properly
- [ ] Set secure headers

### Next.js Security
Already configured:
- Automatic HTTPS
- Security headers
- XSS protection
- CSRF protection

## Cost Optimization

### Free Tier
Railway provides:
- $5 free credit monthly
- 500 hours execution time
- Shared CPU/Memory

### Tips
- Use edge caching
- Optimize images
- Minimize API calls
- Use static generation

## Backup & Recovery

### Automatic Backups
Railway keeps deployment history:
- Rollback from dashboard
- Download build artifacts
- View previous deployments

### Manual Backup
```bash
# Export environment variables
railway vars

# Download logs
railway logs > backup.log
```

## Support

### Railway Resources
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### Project Issues
- Check build logs first
- Verify environment variables
- Test locally with production build
- Review Next.js documentation

## Quick Commands

```bash
# View logs
railway logs

# Open app
railway open

# Check status
railway status

# List variables
railway vars

# Add variable
railway vars set KEY=value

# Restart service
railway restart
```

## Architecture

```
GitHub Push
    ↓
Railway Detects Change
    ↓
Run npm ci
    ↓
Run npm run build
    ↓
Start with npm start
    ↓
Deploy to Railway Edge
    ↓
HTTPS URL Generated
```

## Performance

### Optimizations Applied
- Next.js automatic optimizations
- Image optimization
- Code splitting
- Tree shaking
- Minification

### Monitoring
Check Railway dashboard for:
- Response times
- Memory usage
- CPU usage
- Error rates

---

**Last Updated**: January 6, 2026  
**Railway Version**: Latest  
**Next.js Version**: 15.3.3
