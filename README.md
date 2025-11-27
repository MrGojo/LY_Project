# HippoCare AI - Precision Radiotherapy

A web application for automated hippocampal segmentation from brain MRI scans using deep learning. This tool helps doctors identify the hippocampus region to avoid during radiation therapy, protecting patient memory functions.

## Features

- **Instant Results**: Reduce manual planning time from hours to minutes
- **Clinical Precision**: Consistent, reproducible segmentations
- **Memory Protection**: Safeguard vital memory functions from radiation damage
- **Dataset Validation**: Ensures only approved images from the dataset are processed

## Project Structure

```
Hippocampus/
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # Page components
│       │   ├── Home.tsx     # Landing page
│       │   ├── Upload.tsx   # File upload page
│       │   └── Results.tsx  # Results display page
│       └── App.tsx          # Main app with routing
├── server.js               # Express backend server
├── package.json            # Backend dependencies
└── Nanavati_model (1)/    # Dataset and model files
    ├── images/
    │   ├── test/           # Test dataset images
    │   └── train/          # Training dataset images
    ├── test.json           # Test dataset annotations
    └── train.json          # Training dataset annotations
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

**Option 1: Install all dependencies (Recommended):**
```bash
npm install
```
This will automatically install both backend and frontend dependencies.

**Option 2: Install separately:**

1. **Install backend dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

**For PowerShell users:**
```powershell
npm install
cd client; npm install; cd ..
```

### Running the Application

**Option 1: Run both frontend and backend together:**
```bash
npm run dev
```

**Option 2: Run separately:**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

1. **Landing Page**: Visit the home page to learn about the application
2. **Upload**: Click "Get Started" and upload a brain scan image
3. **Validation**: The system checks if the image matches the dataset
4. **Results**: View the segmentation results with hippocampus regions highlighted

## API Endpoints

- `POST /api/upload` - Upload and process an image
- `GET /api/dataset-info` - Get dataset information
- `GET /api/health` - Health check endpoint
- `GET /api/images/*` - Serve dataset images

## Image Matching

The system validates uploaded images against the dataset:
- Exact filename matching
- Base name matching (without extension)
- Partial matching for similar filenames

If an image doesn't match the dataset, an error message is displayed asking the user to use an image from the specified dataset.

## Future Enhancements

- Integration with actual Mask R-CNN model for real-time processing
- Support for DICOM and NIfTI file formats
- Export functionality for segmentation results
- User authentication and patient records
- Batch processing capabilities

## Technologies Used

- **Frontend**: React, TypeScript, React Router, Axios
- **Backend**: Node.js, Express, Multer
- **Styling**: CSS3 with modern gradients and animations

## Notes

- Currently uses pre-computed segmentation data from JSON files
- Images must match the dataset for processing
- The system is designed to easily integrate with a real ML model in the future

## License

This project is for medical research and clinical use.

