import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Upload.css';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Store results in sessionStorage and navigate to results page
      sessionStorage.setItem('segmentationData', JSON.stringify(response.data));
      navigate('/results');
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || err.response.data.error || 'Upload failed');
      } else {
        setError('Network error. Please check if the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-container">
      <header className="upload-header">
        <div className="logo-section">
          <div className="logo-icon">🧠</div>
          <div className="logo-text">
            <h1>HippoCare AI</h1>
            <p>Precision Radiotherapy</p>
          </div>
        </div>
        <button className="home-btn" onClick={() => navigate('/')}>
          Home
        </button>
      </header>

      <main className="upload-main">
        <div className="upload-card">
          <h2>Upload Brain Scan</h2>
          <p className="upload-subtitle">
            Upload a DICOM, NIfTI, or image file from the specified dataset
          </p>

          <form onSubmit={handleSubmit} className="upload-form">
            <div
              className="drop-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {preview ? (
                <div className="preview-container">
                  <img src={preview} alt="Preview" className="preview-image" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={handleRemoveFile}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="upload-icon"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="drop-zone-text">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="drop-zone-hint">
                    Supports: JPG, PNG, DICOM (.dcm), NIfTI (.nii, .nii.gz)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-input"
                    accept=".jpg,.jpeg,.png,.dcm,.nii,.nii.gz"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <label htmlFor="file-input" className="browse-btn">
                    Browse Files
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Analyze Image'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Upload;

