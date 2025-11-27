# Git Setup and Push Instructions

## Step 1: Initialize Git Repository

```powershell
git init
```

## Step 2: Add All Files

```powershell
git add .
```

## Step 3: Make Initial Commit

```powershell
git commit -m "Initial commit: HippoCare AI frontend and backend"
```

## Step 4: Create GitHub Repository

You have two options:

### Option A: Using GitHub Website (Recommended)
1. Go to https://github.com/new
2. Repository name: `hippocare-ai` (or any name you prefer)
3. Description: "HippoCare AI - Precision Radiotherapy Hippocampal Segmentation"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Option B: Using GitHub CLI (if installed)
```powershell
gh repo create hippocare-ai --public --source=. --remote=origin --push
```

## Step 5: Add Remote and Push

After creating the repo on GitHub, run these commands:

```powershell
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/hippocare-ai.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## All Commands in One Block (Copy and Paste)

```powershell
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: HippoCare AI frontend and backend"

# Add remote (REPLACE YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/hippocare-ai.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Note About Dataset Files

The dataset files (images and large JSON files) are excluded from git because they're too large for GitHub. If you need to include them, consider:
- Using Git LFS (Large File Storage)
- Storing them in a cloud storage service
- Creating a separate repository for the dataset

## Troubleshooting

### If you get authentication errors:
- Use a Personal Access Token instead of password
- Or set up SSH keys for GitHub

### If files are too large:
- The dataset files are already excluded in .gitignore
- If you still get errors, check file sizes: `git ls-files | ForEach-Object { Get-Item $_ | Select-Object Name, Length }`

