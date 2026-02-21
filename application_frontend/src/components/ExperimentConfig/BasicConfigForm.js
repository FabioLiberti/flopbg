// src/components/ExperimentConfig/BasicConfigForm.js
const BasicConfigForm = ({ experimentConfig, setExperimentConfig }) => {
    const handleInputChange = (field, value) => {
      setExperimentConfig(field, value);
    };
   
    const inputStyle = {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'white',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#3498db'
      }
    };
   
    const parameterBoxStyle = {
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #ddd'
    };
   
    const labelStyle = {
      display: 'block',
      marginBottom: '8px',
      color: '#2c3e50',
      fontWeight: '500'
    };
   
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
      }}>
        {/* Number of Rounds */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Number of Rounds
          </label>
          <input
            type="number"
            value={experimentConfig.numRounds}
            onChange={(e) => handleInputChange('numRounds', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
        </div>
   
        {/* Number of Clients */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Number of Clients
          </label>
          <input
            type="number"
            value={experimentConfig.numClients}
            onChange={(e) => handleInputChange('numClients', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
        </div>
   
        {/* Local Epochs */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Local Epochs
          </label>
          <input
            type="number"
            value={experimentConfig.localEpochs}
            onChange={(e) => handleInputChange('localEpochs', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
        </div>
   
        {/* Batch Size */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Batch Size
          </label>
          <input
            type="number"
            value={experimentConfig.batchSize}
            onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
        </div>
   
        {/* Learning Rate */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Learning Rate
          </label>
          <input
            type="number"
            value={experimentConfig.learningRate}
            onChange={(e) => handleInputChange('learningRate', parseFloat(e.target.value))}
            style={inputStyle}
            step="0.001"
            min="0"
          />
        </div>
   
        {/* Mu */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Mu
          </label>
          <input
            type="number"
            value={experimentConfig.mu}
            onChange={(e) => handleInputChange('mu', parseFloat(e.target.value))}
            style={inputStyle}
            step="0.1"
            min="0"
          />
        </div>
   
        {/* Quantization Bits */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Quantization Bits
          </label>
          <input
            type="number"
            value={experimentConfig.quantizationBits}
            onChange={(e) => handleInputChange('quantizationBits', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
        </div>
   
        {/* Global Participation Rate */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Global Participation Rate
          </label>
          <input
            type="number"
            value={experimentConfig.globalParticipationRate}
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
   
   export default BasicConfigForm;