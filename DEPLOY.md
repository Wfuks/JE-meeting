# Deployment Guide - Render.com + JSONbin

This app is configured to deploy on **Render.com** (free tier) with data storage on **JSONbin.io** (free).

## Setup Steps

### 1. Create JSONbin Account & Bin

1. Go to https://jsonbin.io
2. Sign up (free account)
3. Create a new bin - save the **Bin ID**
4. Go to Account Settings → find your **Master Key**
5. Save both values somewhere safe

### 2. Connect to Render.com

1. Go to https://render.com
2. Sign up with GitHub (easy!)
3. Click "New Web Service"
4. Connect your GitHub repository: `Wfuks/JE-meeting`
5. Fill in the form:
   - **Name**: `je-meeting` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### 3. Add Environment Variables in Render

In the Render dashboard, scroll down to "Environment Variables" and add:

```
JSONBIN_API_KEY = <your-jsonbin-master-key>
JSONBIN_BIN_ID = <your-jsonbin-bin-id>
GEMINI_API_KEY = <your-gemini-api-key>
NODE_ENV = production
```

### 4. Deploy!

Click "Create Web Service" and Render will automatically:
- Pull your code from GitHub
- Install dependencies
- Build the project
- Deploy it live 🚀

Your app will be live at: `https://je-meeting.onrender.com` (or similar)

## Important Notes

- **Free Tier Limits**: 
  - Render auto-spins down after 15 minutes of inactivity (takes ~30 seconds to start back up)
  - JSONbin has generous free limits
  
- **To update your app**: Just push to GitHub and Render auto-redeploys

- **Troubleshooting**: Check Render's logs if something doesn't work

## Local Development

To test locally before deploying:

1. Copy `.env.local` and fill in your values:
   ```bash
   cp .env.local.example .env.local
   ```

2. Install and run:
   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:3000
