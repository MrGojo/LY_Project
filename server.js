const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Load dataset information
const DATASET_PATH = path.join(__dirname, 'Nanavati_model (1)', 'images');
const TEST_JSON_PATH = path.join(__dirname, 'Nanavati_model (1)', 'test.json');
const TRAIN_JSON_PATH = path.join(__dirname, 'Nanavati_model (1)', 'train.json');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client build
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Serve dataset images
app.use('/api/images', express.static(DATASET_PATH));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|dcm|nii|nii\.gz/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream';
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG) and medical files (DICOM, NIfTI) are allowed!'));
    }
  }
});

let testData = {};
let trainData = {};
let datasetImages = new Set();

// Load JSON data
function loadDataset() {
  try {
    if (fs.existsSync(TEST_JSON_PATH)) {
      const testContent = fs.readFileSync(TEST_JSON_PATH, 'utf8');
      testData = JSON.parse(testContent);
      Object.keys(testData).forEach(key => {
        const filename = testData[key].filename;
        datasetImages.add(filename);
        // Also add without size suffix
        const baseKey = filename.replace(/\.jpg\d+$/, '');
        datasetImages.add(baseKey);
      });
    }
    
    if (fs.existsSync(TRAIN_JSON_PATH)) {
      const trainContent = fs.readFileSync(TRAIN_JSON_PATH, 'utf8');
      trainData = JSON.parse(trainContent);
      Object.keys(trainData).forEach(key => {
        const filename = trainData[key].filename;
        datasetImages.add(filename);
        const baseKey = filename.replace(/\.jpg\d+$/, '');
        datasetImages.add(baseKey);
      });
    }
    
    console.log(`Loaded ${datasetImages.size} dataset images`);
  } catch (error) {
    console.error('Error loading dataset:', error);
  }
}

// Calculate image hash for matching
function calculateImageHash(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// Find matching image in dataset
function findMatchingImage(filename, fileBuffer) {
  // First try exact filename match
  const normalizedFilename = filename.toLowerCase();
  
  // Check test folder first
  const testPath = path.join(DATASET_PATH, 'test', normalizedFilename);
  if (fs.existsSync(testPath)) {
    return normalizedFilename;
  }
  
  // Check train folder
  const trainPath = path.join(DATASET_PATH, 'train', normalizedFilename);
  if (fs.existsSync(trainPath)) {
    return normalizedFilename;
  }
  
  // Try exact match in dataset set
  const exactMatch = Array.from(datasetImages).find(img => 
    img.toLowerCase() === normalizedFilename
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Try to find by base name (without extension)
  const baseName = path.basename(normalizedFilename, path.extname(normalizedFilename));
  const patternMatch = Array.from(datasetImages).find(img => {
    const imgBase = path.basename(img.toLowerCase(), '.jpg');
    return imgBase === baseName;
  });
  
  if (patternMatch) {
    return patternMatch;
  }
  
  // Try partial match
  const partialMatch = Array.from(datasetImages).find(img => {
    const imgLower = img.toLowerCase();
    return imgLower.includes(baseName) || baseName.includes(path.basename(imgLower, '.jpg'));
  });
  
  return partialMatch || null;
}

// Get segmentation data for an image
function getSegmentationData(filename) {
  const normalizedFilename = filename.toLowerCase();
  
  // Search in test data
  for (const key in testData) {
    const data = testData[key];
    if (data.filename && data.filename.toLowerCase() === normalizedFilename) {
      return data;
    }
    // Also check if key contains the filename
    if (key.toLowerCase().includes(normalizedFilename.replace('.jpg', ''))) {
      return data;
    }
  }
  
  // Search in train data
  for (const key in trainData) {
    const data = trainData[key];
    if (data.filename && data.filename.toLowerCase() === normalizedFilename) {
      return data;
    }
    if (key.toLowerCase().includes(normalizedFilename.replace('.jpg', ''))) {
      return data;
    }
  }
  
  return null;
}

// API Routes
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = req.file.originalname;
    const fileBuffer = req.file.buffer;
    
    // Find matching image in dataset
    const matchedImage = findMatchingImage(filename, fileBuffer);
    
    if (!matchedImage) {
      return res.status(400).json({ 
        error: 'Image not found in dataset',
        message: 'Please use an image from the specified dataset. The uploaded image does not match any image in our database.'
      });
    }
    
    // Get segmentation data
    const segmentationData = getSegmentationData(matchedImage);
    
    if (!segmentationData) {
      return res.status(404).json({ 
        error: 'Segmentation data not found',
        message: 'Image found but segmentation data is missing.'
      });
    }
    
    // Determine if image is in test or train folder
    const testImagePath = path.join(DATASET_PATH, 'test', matchedImage);
    const trainImagePath = path.join(DATASET_PATH, 'train', matchedImage);
    let imagePath = '';
    
    if (fs.existsSync(testImagePath)) {
      imagePath = `/api/images/test/${matchedImage}`;
    } else if (fs.existsSync(trainImagePath)) {
      imagePath = `/api/images/train/${matchedImage}`;
    } else {
      // Fallback: try to find in either folder
      imagePath = `/api/images/test/${matchedImage}`;
    }
    
    // Return success with segmentation data and image path
    res.json({
      success: true,
      filename: matchedImage,
      imagePath: imagePath,
      segmentation: segmentationData,
      message: 'Image processed successfully'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
});

// Get list of available dataset images (for reference)
app.get('/api/dataset-info', (req, res) => {
  res.json({
    totalImages: datasetImages.size,
    message: 'Dataset loaded successfully'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// Initialize
loadDataset();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dataset loaded with ${datasetImages.size} images`);
});

