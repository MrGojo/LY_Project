# Push to GitHub - Complete Commands

## ✅ Already Done:
- ✅ Git repository initialized
- ✅ Files added and committed

## Next Steps:

### Step 1: Create GitHub Repository

**Go to GitHub and create a new repository:**
1. Visit: https://github.com/new
2. Repository name: `hippocare-ai` (or your preferred name)
3. Description: "HippoCare AI - Precision Radiotherapy Hippocampal Segmentation"
4. Choose **Public** or **Private**
5. **IMPORTANT:** Do NOT check "Initialize with README" (we already have files)
6. Click **"Create repository"**

### Step 2: Copy the Repository URL

After creating the repo, GitHub will show you a URL like:
```
https://github.com/YOUR_USERNAME/hippocare-ai.git
```

### Step 3: Run These Commands (Replace YOUR_USERNAME)

```powershell
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/hippocare-ai.git

# Rename branch to main (if not already)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Complete Command Block (Copy & Paste)

**Replace `YOUR_USERNAME` with your actual GitHub username:**

```powershell
git remote add origin https://github.com/YOUR_USERNAME/hippocare-ai.git
git branch -M main
git push -u origin main
```

## If You Get Authentication Errors:

### Option 1: Use Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` permissions
3. Use the token as password when pushing

### Option 2: Use SSH (Recommended for future)
```powershell
# Change remote to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/hippocare-ai.git
git push -u origin main
```

## Verify Push

After pushing, visit your repository on GitHub:
```
https://github.com/YOUR_USERNAME/hippocare-ai
```

You should see all your files there!

## Notes:
- The dataset files (images and large JSON files) are excluded via .gitignore
- Only the code and documentation are pushed to GitHub
- If you need the dataset files, consider using Git LFS or a separate repository

