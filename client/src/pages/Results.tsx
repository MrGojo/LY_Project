import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Results.css';

interface Coordinate {
  x: number;
  y: number;
}

interface HippocampusCoordinates {
  regionIndex: number;
  coordinates: Coordinate[];
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
  center: {
    x: number;
    y: number;
  };
}

interface Slide {
  slideNumber: number;
  filename: string;
  imagePath: string;
  processedImagePath?: string;
  hasHippocampus: boolean;
  coordinates: HippocampusCoordinates[];
  regionCount: number;
}

interface Patient {
  patientId: number;
  totalSlides: number;
  firstSlideWithHippocampus: number | null;
  lastSlideWithHippocampus: number | null;
  slidesWithHippocampusCount: number;
  slides: Slide[];
}

interface SingleImageData {
  success: boolean;
  filename: string;
  imagePath?: string;
  processedImagePath?: string;
  segmentation: {
    filename: string;
    size: string;
    regions: Array<{
      shape_attributes: {
        name: string;
        all_points_x: number[];
        all_points_y: number[];
      };
      region_attributes: {
        class: string;
      };
    }>;
  };
  coordinates?: HippocampusCoordinates[];
  patientId?: number | null;
  slideNumber?: number | null;
}

interface FolderData {
  success: boolean;
  totalImages: number;
  invalidImages?: Array<{
    filename: string;
    reason: string;
  }>;
  patients: Patient[];
}

const Results: React.FC = () => {
  const [singleData, setSingleData] = useState<SingleImageData | null>(null);
  const [folderData, setFolderData] = useState<FolderData | null>(null);
  const [uploadMode, setUploadMode] = useState<'single' | 'folder'>('single');
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get data from sessionStorage
    const storedData = sessionStorage.getItem('segmentationData');
    const mode = sessionStorage.getItem('uploadMode') || 'single';
    
    if (!storedData) {
      navigate('/upload');
      return;
    }

    try {
      const parsedData = JSON.parse(storedData);
      setUploadMode(mode as 'single' | 'folder');
      
      if (mode === 'single') {
        setSingleData(parsedData as SingleImageData);
      } else {
        setFolderData(parsedData as FolderData);
        // Set first slide with hippocampus as default
        if (parsedData.patients && parsedData.patients.length > 0) {
          const firstPatient = parsedData.patients[0];
          const firstSlideWithHippo = firstPatient.slides.find((s: Slide) => s.hasHippocampus);
          if (firstSlideWithHippo) {
            setSelectedSlide(firstSlideWithHippo);
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error parsing data:', error);
      navigate('/upload');
    }
  }, [navigate]);

  useEffect(() => {
    if (uploadMode === 'single' && singleData && canvasRef.current) {
      drawSingleSegmentation();
    } else if (uploadMode === 'folder' && selectedSlide && canvasRef.current) {
      drawSlideSegmentation(selectedSlide);
    }
  }, [singleData, selectedSlide, uploadMode]);

  const drawSingleSegmentation = async () => {
    if (!singleData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const primaryImagePath = singleData.processedImagePath || singleData.imagePath;
    if (primaryImagePath) {
      const normalizedPath = primaryImagePath.startsWith('/api/')
        ? primaryImagePath
        : primaryImagePath.startsWith('/')
          ? primaryImagePath
          : `/${primaryImagePath}`;
      img.src = normalizedPath;
    } else {
      img.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" fill="#e2e8f0"/>
          <text x="128" y="128" text-anchor="middle" fill="#718096" font-size="14">Brain Scan Image</text>
        </svg>
      `);
    }
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      singleData.segmentation.regions.forEach((region) => {
        if (region.shape_attributes.name === 'polygon') {
          const pointsX = region.shape_attributes.all_points_x;
          const pointsY = region.shape_attributes.all_points_y;

          if (pointsX.length > 0 && pointsY.length > 0) {
            ctx.beginPath();
            ctx.moveTo(pointsX[0], pointsY[0]);
            
            for (let i = 1; i < pointsX.length; i++) {
              ctx.lineTo(pointsX[i], pointsY[i]);
            }
            
            ctx.closePath();
            ctx.fillStyle = 'rgba(66, 153, 225, 0.4)';
            ctx.fill();
            ctx.strokeStyle = '#4299e1';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      });
    };
    
    img.onerror = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#718096';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Image not available', canvas.width / 2, canvas.height / 2);
    };
  };

  const drawSlideSegmentation = async (slide: Slide) => {
    if (!slide || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const primaryImagePath = slide.processedImagePath || slide.imagePath;
    if (primaryImagePath) {
      const normalizedPath = primaryImagePath.startsWith('/api/')
        ? primaryImagePath
        : primaryImagePath.startsWith('/')
          ? primaryImagePath
          : `/${primaryImagePath}`;
      img.src = normalizedPath;
    } else {
      img.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" fill="#e2e8f0"/>
          <text x="128" y="128" text-anchor="middle" fill="#718096" font-size="14">Brain Scan Image</text>
        </svg>
      `);
    }
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      slide.coordinates.forEach((coord) => {
        if (coord.coordinates.length > 0) {
          ctx.beginPath();
          ctx.moveTo(coord.coordinates[0].x, coord.coordinates[0].y);
          
          for (let i = 1; i < coord.coordinates.length; i++) {
            ctx.lineTo(coord.coordinates[i].x, coord.coordinates[i].y);
          }
          
          ctx.closePath();
          ctx.fillStyle = 'rgba(66, 153, 225, 0.4)';
          ctx.fill();
          ctx.strokeStyle = '#4299e1';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    };
    
    img.onerror = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#718096';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Image not available', canvas.width / 2, canvas.height / 2);
    };
  };

  if (loading) {
    return (
      <div className="results-container">
        <div className="loading-spinner">Loading results...</div>
      </div>
    );
  }

  // Render folder upload results
  if (uploadMode === 'folder' && folderData) {
    return (
      <div className="results-container">
        <header className="results-header">
          <div className="logo-section">
            <div className="logo-icon">🧠</div>
            <div className="logo-text">
              <h1>HippoCare AI</h1>
              <p>Precision Radiotherapy</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="new-upload-btn" onClick={() => navigate('/upload')}>
              New Upload
            </button>
            <button className="home-btn" onClick={() => navigate('/')}>
              Home
            </button>
          </div>
        </header>

        <main className="results-main">
          <div className="results-card">
            <h2>Patient Folder Analysis</h2>
            <p className="results-subtitle">
              Analysis of {folderData.totalImages} slide(s) from {folderData.patients.length} patient(s)
            </p>

            {folderData.patients.map((patient) => (
              <div key={patient.patientId} className="patient-section">
                <div className="patient-header">
                  <h3>Patient ID: {patient.patientId}</h3>
                  <div className="patient-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Slides:</span>
                      <span className="stat-value">{patient.totalSlides}</span>
                    </div>
                    {patient.firstSlideWithHippocampus !== null && (
                      <>
                        <div className="stat-item">
                          <span className="stat-label">First Slide with Hippocampus:</span>
                          <span className="stat-value highlight">{patient.firstSlideWithHippocampus}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Last Slide with Hippocampus:</span>
                          <span className="stat-value highlight">{patient.lastSlideWithHippocampus}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Slides with Detection:</span>
                          <span className="stat-value">{patient.slidesWithHippocampusCount}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="results-content folder-results">
                  <div className="visualization-section">
                    <div className="canvas-container">
                      <canvas ref={canvasRef} className="segmentation-canvas" />
                      <div className="legend">
                        <div className="legend-item">
                          <div className="legend-color"></div>
                          <span>Hippocampus Region</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>Slide Details</h4>
                    <div className="slides-list">
                      {patient.slides.map((slide) => (
                        <div
                          key={slide.slideNumber}
                          className={`slide-item ${slide.hasHippocampus ? 'has-hippocampus' : ''} ${selectedSlide?.slideNumber === slide.slideNumber ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedSlide(slide);
                          }}
                        >
                          <div className="slide-header">
                            <span className="slide-number">Slide {slide.slideNumber}</span>
                            {slide.hasHippocampus && (
                              <span className="hippocampus-badge">Hippocampus Detected</span>
                            )}
                          </div>
                          {slide.hasHippocampus && (
                            <div className="slide-coordinates">
                              <strong>Coordinates ({slide.regionCount} region{slide.regionCount !== 1 ? 's' : ''}):</strong>
                              {slide.coordinates.map((coord, idx) => (
                                <div key={idx} className="coordinate-group">
                                  <div className="coord-info">
                                    <span>Region {coord.regionIndex}:</span>
                                    <span>Center: ({coord.center.x.toFixed(1)}, {coord.center.y.toFixed(1)})</span>
                                    <span>Bounding Box: [{coord.boundingBox.minX}, {coord.boundingBox.minY}] to [{coord.boundingBox.maxX}, {coord.boundingBox.maxY}]</span>
                                  </div>
                                  <details className="coord-details">
                                    <summary>View All Points</summary>
                                    <div className="points-list">
                                      {coord.coordinates.map((point, pIdx) => (
                                        <span key={pIdx} className="point-item">
                                          ({point.x}, {point.y})
                                        </span>
                                      ))}
                                    </div>
                                  </details>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {folderData.invalidImages && folderData.invalidImages.length > 0 && (
              <div className="warning-box">
                <h4>Invalid Images ({folderData.invalidImages.length})</h4>
                <p className="warning-note">
                  These images were not found in the dataset and could not be processed.
                </p>
                <ul>
                  {folderData.invalidImages.map((img, idx) => (
                    <li key={idx}>{img.filename}: {img.reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="info-box">
              <h4>Clinical Notes</h4>
              <p>
                The highlighted regions indicate the hippocampus, which should be avoided 
                during radiation therapy to protect patient memory functions. The first and 
                last slide numbers indicate the range where the hippocampus is present. Use 
                this information to plan radiation treatment accordingly.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render single image results
  if (uploadMode === 'single' && singleData) {
    return (
      <div className="results-container">
        <header className="results-header">
          <div className="logo-section">
            <div className="logo-icon">🧠</div>
            <div className="logo-text">
              <h1>HippoCare AI</h1>
              <p>Precision Radiotherapy</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="new-upload-btn" onClick={() => navigate('/upload')}>
              New Upload
            </button>
            <button className="home-btn" onClick={() => navigate('/')}>
              Home
            </button>
          </div>
        </header>

        <main className="results-main">
          <div className="results-card">
            <h2>Segmentation Results</h2>
            <p className="results-subtitle">
              Hippocampus region highlighted in blue
            </p>

            <div className="results-content">
              <div className="visualization-section">
                <div className="canvas-container">
                  <canvas ref={canvasRef} className="segmentation-canvas" />
                  <div className="legend">
                    <div className="legend-item">
                      <div className="legend-color"></div>
                      <span>Hippocampus Region</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Analysis Details</h3>
                
                <div className="detail-item">
                  <span className="detail-label">Filename:</span>
                  <span className="detail-value">{singleData.filename}</span>
                </div>

                {singleData.patientId && (
                  <div className="detail-item">
                    <span className="detail-label">Patient ID:</span>
                    <span className="detail-value">{singleData.patientId}</span>
                  </div>
                )}

                {singleData.slideNumber && (
                  <div className="detail-item">
                    <span className="detail-label">Slide Number:</span>
                    <span className="detail-value">{singleData.slideNumber}</span>
                  </div>
                )}

                <div className="detail-item">
                  <span className="detail-label">File Size:</span>
                  <span className="detail-value">{singleData.segmentation.size} bytes</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Regions Detected:</span>
                  <span className="detail-value">{singleData.segmentation.regions.length}</span>
                </div>

                {singleData.coordinates && singleData.coordinates.length > 0 && (
                  <div className="coordinates-section">
                    <h4>Hippocampus Coordinates</h4>
                    {singleData.coordinates.map((coord, idx) => (
                      <div key={idx} className="coordinate-group">
                        <div className="coord-info">
                          <span><strong>Region {coord.regionIndex}:</strong></span>
                          <span>Center: ({coord.center.x.toFixed(1)}, {coord.center.y.toFixed(1)})</span>
                          <span>Bounding Box: [{coord.boundingBox.minX}, {coord.boundingBox.minY}] to [{coord.boundingBox.maxX}, {coord.boundingBox.maxY}]</span>
                          <span>Size: {coord.boundingBox.width.toFixed(1)} × {coord.boundingBox.height.toFixed(1)} pixels</span>
                        </div>
                        <details className="coord-details">
                          <summary>View All Points</summary>
                          <div className="points-list">
                            {coord.coordinates.map((point, pIdx) => (
                              <span key={pIdx} className="point-item">
                                ({point.x}, {point.y})
                              </span>
                            ))}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}

                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value success">✓ Successfully Processed</span>
                </div>

                <div className="info-box">
                  <h4>Clinical Notes</h4>
                  <p>
                    The highlighted regions indicate the hippocampus, which should be avoided 
                    during radiation therapy to protect patient memory functions. Use this 
                    visualization to plan radiation treatment accordingly.
                  </p>
                </div>

                <div className="action-buttons">
                  <button className="download-btn">
                    Download Results
                  </button>
                  <button className="print-btn">
                    Print Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default Results;
