// src/components/ExperimentConfig/ClientHeterogeneityConfig.js
import React from 'react';

const ClientHeterogeneityConfig = ({ clientTypeConfig, setExperimentConfig }) => {
  const handleInputChange = (clientType, field, value) => {
    console.log('Updating client type:', clientType, field, value); // Debug log
    
    const updatedConfig = {
      ...clientTypeConfig,
      [clientType]: {
        ...clientTypeConfig[clientType],
        [field]: value
      }
    };
    
    setExperimentConfig('clientTypeConfig', updatedConfig);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    transition: 'all 0.2s ease'
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

  const clientTypes = ['strong', 'medium', 'weak'];
  const parameters = ['computational_power', 'network_speed', 'proportion'];

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {clientTypes.map(clientType => (
        <div key={clientType}>
          <h4 style={{ 
            color: '#2c3e50', 
            marginBottom: '15px',
            textTransform: 'capitalize'
          }}>
            {clientType} Clients
          </h4>
          <div style={{ display: 'grid', gap: '15px' }}>
            {parameters.map(param => (
              <div key={`${clientType}-${param}`} style={parameterBoxStyle}>
                <label style={labelStyle}>
                  {param.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </label>
                <input
                  type="number"
                  value={clientTypeConfig[clientType][param]}
                  onChange={(e) => handleInputChange(
                    clientType,
                    param,
                    parseFloat(e.target.value)
                  )}
                  style={inputStyle}
                  step="0.1"
                  min="0"
                  max="1"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientHeterogeneityConfig;