# Quick Setup Guide

## For Windows PowerShell Users

### Step 1: Install Dependencies

Run these commands one at a time:

```powershell
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

Or use semicolons (PowerShell syntax):
```powershell
npm install; cd client; npm install; cd ..
```

### Step 2: Start the Application

**Option 1: Run both together (Recommended)**
```powershell
npm run dev
```

**Option 2: Run separately**

Terminal 1 (Backend):
```powershell
npm run server
```

Terminal 2 (Frontend):
```powershell
cd client
npm start
```

## Troubleshooting

### If you get "&& is not a valid statement separator"
- PowerShell doesn't support `&&` like bash does
- Use semicolons (`;`) instead, or run commands separately
- The `npm run dev` command should work fine as it uses concurrently

### If the server doesn't start
- Make sure port 5000 is not in use
- Check that Node.js is installed: `node --version`
- Verify dependencies are installed: check for `node_modules` folder

### If images don't load
- Make sure the dataset folder exists at: `Nanavati_model (1)/images/`
- Check that test.json and train.json files are present
- Verify the server is running on port 5000

## Testing the Application

1. Open http://localhost:3000 in your browser
2. Click "Get Started"
3. Upload an image from your dataset (e.g., `image_21_0.jpg` from the test folder)
4. View the segmentation results

