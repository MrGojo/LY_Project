import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Upload.css';

const MAX_SLIDES = 400;

const limitFiles = (selectedFiles: File[], setError: (message: string | null) => void) => {
  if (selectedFiles.length > MAX_SLIDES) {
    setError(`You selected ${selectedFiles.length} slides. Only the first ${MAX_SLIDES} will be processed.`);
    return selectedFiles.slice(0, MAX_SLIDES);
  }
  return selectedFiles;
};

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<'single' | 'folder'>('folder');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
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

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const limitedFiles = limitFiles(selectedFiles, setError);
      if (selectedFiles.length <= MAX_SLIDES) {
        setError(null);
      }
      setFiles(limitedFiles);
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (uploadMode === 'single') {
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
    } else {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        const limitedFiles = limitFiles(droppedFiles, setError);
        if (droppedFiles.length <= MAX_SLIDES) {
          setError(null);
        }
        setFiles(limitedFiles);
        setPreview(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadMode === 'single') {
      if (!file) {
        setError('Please select a file first');
        return;
      }

      if (files.length > MAX_SLIDES) {
        setError(`Please upload at most ${MAX_SLIDES} slides at once.`);
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
        sessionStorage.setItem('uploadMode', 'single');
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
    } else {
      // Folder upload mode
      if (files.length === 0) {
        setError('Please select files from a patient folder');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('images', file);
        });

        const response = await axios.post('/api/upload-folder', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Store results in sessionStorage and navigate to results page
        sessionStorage.setItem('segmentationData', JSON.stringify(response.data));
        sessionStorage.setItem('uploadMode', 'folder');
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
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFiles = () => {
    setFiles([]);
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
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
            Upload a single image or an entire patient folder (up to {MAX_SLIDES} slides)
          </p>

          {/* Upload Mode Toggle */}
          <div className="upload-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${uploadMode === 'single' ? 'active' : ''}`}
              onClick={() => {
                setUploadMode('single');
                setFile(null);
                setFiles([]);
                setPreview(null);
                setError(null);
              }}
            >
              Single Image
            </button>
            <button
              type="button"
              className={`mode-btn ${uploadMode === 'folder' ? 'active' : ''}`}
              onClick={() => {
                setUploadMode('folder');
                setFile(null);
                setFiles([]);
                setPreview(null);
                setError(null);
              }}
            >
              Patient Folder
            </button>
          </div>

          <form onSubmit={handleSubmit} className="upload-form">
            <div
              className="drop-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {uploadMode === 'single' ? (
                preview ? (
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
                )
              ) : (
                files.length > 0 ? (
                  <div className="files-preview-container">
                    <div className="files-list">
                      <h4>Selected Files ({files.length})</h4>
                      <div className="files-grid">
                        {files.slice(0, 10).map((file, index) => (
                          <div key={index} className="file-item">
                            {file.name}
                          </div>
                        ))}
                        {files.length > 10 && (
                          <div className="file-item more-files">
                            +{files.length - 10} more files
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={handleRemoveFiles}
                    >
                      Remove All
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
                      Drag and drop patient folder files here, or click to browse
                    </p>
                    <p className="drop-zone-hint">
                      Select multiple files (up to {MAX_SLIDES} slides) from a patient folder
                    </p>
                    <input
                      ref={folderInputRef}
                      type="file"
                      id="folder-input"
                      accept=".jpg,.jpeg,.png,.dcm,.nii,.nii.gz"
                      multiple
                      onChange={handleFolderChange}
                      className="file-input"
                    />
                    <label htmlFor="folder-input" className="browse-btn">
                      Browse Folder
                    </label>
                  </div>
                )
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
              disabled={(uploadMode === 'single' ? !file : files.length === 0) || loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                uploadMode === 'single' ? 'Analyze Image' : `Analyze ${files.length} Slide${files.length !== 1 ? 's' : ''}`
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Upload;

