# 🚀 Railway Deployment - Quick Start

## Prerequisites
✅ Railway account ([Sign up here](https://railway.app))  
✅ Code pushed to GitHub  
✅ Backend API deployed and accessible  

---

## 🎯 Deploy in 5 Minutes

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway auto-detects Next.js ✨

### Step 2: Set Environment Variables
Click **"Variables"** tab and add:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NODE_ENV=production
```

### Step 3: Deploy
- Railway automatically builds and deploys
- Wait 2-3 minutes for completion
- Get your live URL: `https://your-app.up.railway.app`

### Step 4: Verify
✅ Visit your app URL  
✅ Test login  
✅ Check features work  

---

## 🔧 Alternative: Railway CLI

```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Set variables
railway vars set NEXT_PUBLIC_API_URL=https://your-api.railway.app

# Deploy
railway up
```

---

## 📋 Configuration Files Included

All deployment files are ready:
- ✅ `railway.toml` - Railway configuration
- ✅ `nixpacks.toml` - Build settings
- ✅ `next.config.ts` - Next.js optimized
- ✅ `.env.production.example` - Environment template

---

## 🆘 Troubleshooting

### Build Failed?
```bash
railway logs
```
Check for missing dependencies or TypeScript errors.

### App Not Loading?
1. Verify `NEXT_PUBLIC_API_URL` is set
2. Check backend API is running
3. Review Railway logs

### API Calls Failing?
- Ensure API URL uses HTTPS
- Check CORS settings on backend
- Verify environment variables

---

## 📚 Full Documentation

- **Deployment Guide**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Complete Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Features Documentation**: [STOCK_MANAGEMENT_FEATURES.md](./STOCK_MANAGEMENT_FEATURES.md)

---

## 💡 Pro Tips

1. **Custom Domain**: Add in Settings → Domains
2. **Auto Deploys**: Push to GitHub = Auto deploy
3. **Preview URLs**: PRs get preview deployments
4. **Monitoring**: Check Railway metrics dashboard
5. **Rollback**: Click previous deployment to rollback

---

## ✅ Success!

Your app is now live at:
```
https://your-app.up.railway.app
```

**Next Steps:**
- Share URL with team
- Setup custom domain (optional)
- Enable monitoring
- Deploy backend if not done

---

Need help? Check [Railway Discord](https://discord.gg/railway) or [Railway Docs](https://docs.railway.app)

**Happy Deploying! 🎉**
