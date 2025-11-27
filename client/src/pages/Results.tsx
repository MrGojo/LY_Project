import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Results.css';

interface SegmentationData {
  success: boolean;
  filename: string;
  imagePath?: string;
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
}

const Results: React.FC = () => {
  const [data, setData] = useState<SegmentationData | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get data from sessionStorage
    const storedData = sessionStorage.getItem('segmentationData');
    if (!storedData) {
      navigate('/upload');
      return;
    }

    try {
      const parsedData: SegmentationData = JSON.parse(storedData);
      setData(parsedData);
      
      // Try to load the original image
      // For now, we'll use a placeholder or try to load from the dataset
      // In production, you'd want to serve the image from the backend
      setLoading(false);
    } catch (error) {
      console.error('Error parsing data:', error);
      navigate('/upload');
    }
  }, [navigate]);

  useEffect(() => {
    if (data && canvasRef.current) {
      drawSegmentation();
    }
  }, [data]);

  const drawSegmentation = async () => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Load image from backend
    if (data.imagePath) {
      // Ensure the path starts with /api/images
      const imageUrl = data.imagePath.startsWith('/api/images') 
        ? data.imagePath 
        : `/api/images${data.imagePath}`;
      img.src = imageUrl;
    } else {
      // Fallback to placeholder
      img.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" fill="#e2e8f0"/>
          <text x="128" y="128" text-anchor="middle" fill="#718096" font-size="14">Brain Scan Image</text>
        </svg>
      `);
    }
    
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Draw segmentation regions
      data.segmentation.regions.forEach((region) => {
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
            
            // Fill with semi-transparent color
            ctx.fillStyle = 'rgba(66, 153, 225, 0.4)';
            ctx.fill();
            
            // Stroke with solid color
            ctx.strokeStyle = '#4299e1';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      });
    };
    
    img.onerror = () => {
      // If image fails to load, draw placeholder
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

  if (!data) {
    return null;
  }

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
                <span className="detail-value">{data.filename}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">File Size:</span>
                <span className="detail-value">{data.segmentation.size} bytes</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Regions Detected:</span>
                <span className="detail-value">{data.segmentation.regions.length}</span>
              </div>

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
};

export default Results;

