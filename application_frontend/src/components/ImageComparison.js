// src/components/ImageComparison.js

import React, { useState, useEffect } from 'react';

function ImageComparison({ datasetName, isTraining }) {
  const [realImages, setRealImages] = useState([]);
  const [realLabels, setRealLabels] = useState([]);
  const [predictedLabels, setPredictedLabels] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch images after training has completed
    if (isTraining) {
      return;
    }

    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:5001/api/images?dataset_name=${encodeURIComponent(datasetName)}&num_images=10`
        );
        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Data received from /api/images:', data);

        if (response.ok) {
            if (data && Array.isArray(data.real_images) && Array.isArray(data.predicted_labels)) {
              setRealImages(data.real_images);
              setRealLabels(data.real_labels || []);
              setPredictedLabels(data.predicted_labels);
          } else {
            console.error('Invalid data structure received:', data);
            setError('No images found');
          }
        } else {
          console.error('Server responded with error:', data);
          setError(data.message || 'Error fetching images');
        }
      } catch (error) {
        console.error('Error fetching images:', error);
        setError('Error fetching images');
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [datasetName, isTraining]);

  if (isTraining) {
    return <p>Images will be available after training completes.</p>;
  }

  if (isLoading) {
    return <p>Loading images...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!Array.isArray(realImages) || realImages.length === 0) {
    return <p>No images available. Run an experiment first.</p>;
  }

  return (
    <div className="image-comparison">
      <h3>Real vs Predicted Images - Dataset: {datasetName}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {realImages.map((imageData, index) => (
          <div key={index} style={{ margin: '10px', textAlign: 'center' }}>
            <img
              src={`data:image/${imageData.format.toLowerCase()};base64,${imageData.data}`}
              alt={`${index}`}
              style={{ width: '150px' }}
            />
            <p>Real Label: {realLabels[index] || 'N/A'}</p>
            <p>Predicted Label: {predictedLabels[index] || 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageComparison;
