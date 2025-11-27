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
  limits: { fileSize: 50 * 1024 * 1024, files: 300 }, // 50MB per file, max 300 files
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
  
  // Search in test data - use exact filename match only
  for (const key in testData) {
    const data = testData[key];
    if (data.filename && data.filename.toLowerCase() === normalizedFilename) {
      return data;
    }
  }
  
  // Search in train data - use exact filename match only
  for (const key in trainData) {
    const data = trainData[key];
    if (data.filename && data.filename.toLowerCase() === normalizedFilename) {
      return data;
    }
  }
  
  return null;
}

// Extract patient ID and slide number from filename
// Pattern: image_{patientId}_{slideNumber}.jpg
function parseFilename(filename) {
  const match = filename.match(/image_(\d+)_(\d+)\.jpg/i);
  if (match) {
    return {
      patientId: parseInt(match[1]),
      slideNumber: parseInt(match[2]),
      originalFilename: filename
    };
  }
  return null;
}

// Extract coordinates from segmentation data
function extractCoordinates(segmentationData) {
  if (!segmentationData || !segmentationData.regions) {
    return [];
  }
  
  return segmentationData.regions.map((region, index) => {
    if (region.shape_attributes && region.shape_attributes.name === 'polygon') {
      const pointsX = region.shape_attributes.all_points_x || [];
      const pointsY = region.shape_attributes.all_points_y || [];
      
      // Calculate bounding box
      const minX = Math.min(...pointsX);
      const maxX = Math.max(...pointsX);
      const minY = Math.min(...pointsY);
      const maxY = Math.max(...pointsY);
      
      return {
        regionIndex: index + 1,
        coordinates: pointsX.map((x, i) => ({ x, y: pointsY[i] })),
        boundingBox: {
          minX,
          maxX,
          minY,
          maxY,
          width: maxX - minX,
          height: maxY - minY
        },
        center: {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2
        }
      };
    }
    return null;
  }).filter(coord => coord !== null);
}

// API Routes
// Single file upload (backward compatibility)
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
    
    // Extract coordinates
    const coordinates = extractCoordinates(segmentationData);
    const parsed = parseFilename(matchedImage);
    
    // Return success with segmentation data and image path
    res.json({
      success: true,
      filename: matchedImage,
      imagePath: imagePath,
      segmentation: segmentationData,
      coordinates: coordinates,
      patientId: parsed ? parsed.patientId : null,
      slideNumber: parsed ? parsed.slideNumber : null,
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

// Multiple file upload (patient folder)
app.post('/api/upload-folder', upload.array('images', 300), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process all uploaded files
    const processedImages = [];
    const invalidImages = [];
    
    for (const file of req.files) {
      const filename = file.originalname;
      const fileBuffer = file.buffer;
      
      // Find matching image in dataset
      const matchedImage = findMatchingImage(filename, fileBuffer);
      
      if (!matchedImage) {
        invalidImages.push({
          filename: filename,
          reason: 'Image not found in dataset'
        });
        continue;
      }
      
      // Get segmentation data
      const segmentationData = getSegmentationData(matchedImage);
      
      // Filter silently: skip images without segmentation data (no hippocampus detected)
      if (!segmentationData) {
        continue;
      }
      
      // Parse filename to get patient ID and slide number
      const parsed = parseFilename(matchedImage);
      if (!parsed) {
        invalidImages.push({
          filename: filename,
          reason: 'Invalid filename format'
        });
        continue;
      }
      
      // Determine image path
      const testImagePath = path.join(DATASET_PATH, 'test', matchedImage);
      const trainImagePath = path.join(DATASET_PATH, 'train', matchedImage);
      let imagePath = '';
      
      if (fs.existsSync(testImagePath)) {
        imagePath = `/api/images/test/${matchedImage}`;
      } else if (fs.existsSync(trainImagePath)) {
        imagePath = `/api/images/train/${matchedImage}`;
      } else {
        imagePath = `/api/images/test/${matchedImage}`;
      }
      
      // Extract coordinates
      const coordinates = extractCoordinates(segmentationData);
      const hasHippocampus = coordinates.length > 0;
      
      processedImages.push({
        filename: matchedImage,
        imagePath: imagePath,
        patientId: parsed.patientId,
        slideNumber: parsed.slideNumber,
        segmentation: segmentationData,
        coordinates: coordinates,
        hasHippocampus: hasHippocampus
      });
    }
    
    // Check if any images were successfully processed
    if (processedImages.length === 0) {
      return res.status(400).json({
        error: 'No valid images found',
        message: 'None of the uploaded images matched the dataset. Please use images from the specified dataset.',
        invalidImages: invalidImages
      });
    }
    
    // Group images by patient ID
    const patients = {};
    processedImages.forEach(img => {
      const patientId = img.patientId;
      if (!patients[patientId]) {
        patients[patientId] = {
          patientId: patientId,
          images: [],
          slidesWithHippocampus: [],
          firstSlide: null,
          lastSlide: null,
          totalSlides: 0
        };
      }
      patients[patientId].images.push(img);
      if (img.hasHippocampus) {
        patients[patientId].slidesWithHippocampus.push(img.slideNumber);
      }
    });
    
    // Process each patient to find first/last slide and organize data
    const patientResults = Object.values(patients).map(patient => {
      // Sort images by slide number
      patient.images.sort((a, b) => a.slideNumber - b.slideNumber);
      patient.totalSlides = patient.images.length;
      
      // Find first and last slide with hippocampus
      if (patient.slidesWithHippocampus.length > 0) {
        patient.slidesWithHippocampus.sort((a, b) => a - b);
        patient.firstSlide = patient.slidesWithHippocampus[0];
        patient.lastSlide = patient.slidesWithHippocampus[patient.slidesWithHippocampus.length - 1];
      }
      
      // Create detailed slide information
      const slides = patient.images.map(img => ({
        slideNumber: img.slideNumber,
        filename: img.filename,
        imagePath: img.imagePath,
        hasHippocampus: img.hasHippocampus,
        coordinates: img.coordinates,
        regionCount: img.coordinates.length
      }));
      
      return {
        patientId: patient.patientId,
        totalSlides: patient.totalSlides,
        firstSlideWithHippocampus: patient.firstSlide,
        lastSlideWithHippocampus: patient.lastSlide,
        slidesWithHippocampusCount: patient.slidesWithHippocampus.length,
        slides: slides
      };
    });
    
    // Return results (only include invalidImages if there are truly invalid images - not in dataset)
    res.json({
      success: true,
      totalImages: processedImages.length,
      invalidImages: invalidImages.length > 0 ? invalidImages : undefined,
      patients: patientResults,
      message: `Processed ${processedImages.length} image(s) with hippocampus detection from ${patientResults.length} patient(s)`
    });
    
  } catch (error) {
    console.error('Upload folder error:', error);
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

