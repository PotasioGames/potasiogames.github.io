# Deploying Potasio Games Website

## Prerequisites
- A GitHub account.
- Git installed on your computer.

## Steps to Deploy

1. **Create a New Repository on GitHub**
   - Name it `potasio-games-web` (or whatever you prefer).
   - Make it **Public**.

2. **Initialize Git and Push**
   Open your terminal in this folder (`potasio-games-web`) and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/potasio-games-web.git
   git push -u origin main
   ```
   *(Replace `YOUR_USERNAME` with your actual GitHub username)*

3. **Enable GitHub Pages**
   - Go to your repository **Settings** on GitHub.
   - Click on **Pages** in the left sidebar.
   - Under **Source**, select `Deploy from a branch`.
   - Select `main` branch and `/ (root)` folder.
   - Click **Save**.

4. **Verify Deployment**
   - Wait about 1-2 minutes.
   - GitHub will show you the live URL (e.g., `https://yourusername.github.io/potasio-games-web/`).
   - Use this URL in your Google Play Store listing and AdMob console.

## Updating app-ads.txt
1. Open `app-ads.txt` in this folder.
2. Replace `pub-xxxxxxxxxxxxxxxx` with your actual AdMob Publisher ID.
3. Commit and push the changes:
   ```bash
   git add app-ads.txt
   git commit -m "Update AdMob ID"
   git push
   ```
