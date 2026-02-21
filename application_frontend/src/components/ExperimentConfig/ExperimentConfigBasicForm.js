// src/components/ExperimentConfig/ExperimentConfigBasicForm.js
import React from 'react';

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  color: '#2c3e50',
  fontWeight: '500'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  transition: 'all 0.2s ease'
};

const ExperimentConfigBasicForm = ({ 
  configData, 
  datasets, 
  experimentConfig, 
  setExperimentConfig 
}) => {
  const {
    datasetName,
    numRounds,
    numClients,
    localEpochs,
    batchSize,
    learningRate,
    mu,
    quantizationBits,
    globalParticipationRate,
  } = experimentConfig;

  const handleInputChange = (field, value) => {
    setExperimentConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div>
        <label style={labelStyle}>Dataset</label>
        <select
          value={datasetName}
          onChange={(e) => handleInputChange('datasetName', e.target.value)}
          style={inputStyle}
        >
          <option value="">Select Dataset</option>
          {datasets.map(dataset => (
            <option key={dataset.name} value={dataset.name}>
              {dataset.display_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Number of Rounds</label>
        <input
          type="number"
          value={numRounds}
          onChange={(e) => handleInputChange('numRounds', parseInt(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Number of Clients</label>
        <input
          type="number"
          value={numClients}
          onChange={(e) => handleInputChange('numClients', parseInt(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Local Epochs</label>
        <input
          type="number"
          value={localEpochs}
          onChange={(e) => handleInputChange('localEpochs', parseInt(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Batch Size</label>
        <input
          type="number"
          value={batchSize}
          onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Learning Rate</label>
        <input
          type="number"
          value={learningRate}
          onChange={(e) => handleInputChange('learningRate', parseFloat(e.target.value))}
          style={inputStyle}
          step="0.001"
        />
      </div>

      <div>
        <label style={labelStyle}>Mu</label>
        <input
          type="number"
          value={mu}
          onChange={(e) => handleInputChange('mu', parseFloat(e.target.value))}
          style={inputStyle}
          step="0.1"
        />
      </div>

      <div>
        <label style={labelStyle}>Quantization Bits</label>
        <input
          type="number"
          value={quantizationBits}
          onChange={(e) => handleInputChange('quantizationBits', parseInt(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Global Participation Rate</label>
        <input
          type="number"
          value={globalParticipationRate}
          onChange={(e) => handleInputChange('globalParticipationRate', parseFloat(e.target.value))}
          style={inputStyle}
          step="0.1"
          min="0"
          max="1"
        />
      </div>
    </div>
  );
};

export default ExperimentConfigBasicForm;