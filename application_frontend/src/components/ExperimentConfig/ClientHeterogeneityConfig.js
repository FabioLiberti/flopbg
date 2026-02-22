// src/components/ExperimentConfig/ClientHeterogeneityConfig.js
import React from 'react';

const clientTypes = ['strong', 'medium', 'weak'];
const parameters = [
  { key: 'computational_power', label: 'Computational Power' },
  { key: 'network_speed', label: 'Network Speed' },
  { key: 'proportion', label: 'Proportion' },
];

const typeColors = {
  strong: '#e53935',
  medium: '#43a047',
  weak: '#1e88e5',
};

const ClientHeterogeneityConfig = ({ clientTypeConfig, setExperimentConfig }) => {
  const handleInputChange = (clientType, field, value) => {
    const updatedConfig = {
      ...clientTypeConfig,
      [clientType]: {
        ...clientTypeConfig[clientType],
        [field]: value
      }
    };
    setExperimentConfig('clientTypeConfig', updatedConfig);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '140px repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '8px',
        alignItems: 'center',
      }}>
        <div />
        {clientTypes.map(type => (
          <div key={type} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '0.85rem',
            color: typeColors[type],
            textTransform: 'capitalize',
            padding: '6px 0',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            borderBottom: `3px solid ${typeColors[type]}`,
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: typeColors[type],
            }} />
            {type}
          </div>
        ))}
      </div>

      {/* Parameter rows */}
      {parameters.map(param => (
        <div key={param.key} style={{
          display: 'grid',
          gridTemplateColumns: '140px repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '6px',
          alignItems: 'center',
        }}>
          <label style={{
            fontSize: '0.82rem',
            color: '#555',
            fontWeight: '500',
          }}>
            {param.label}
          </label>
          {clientTypes.map(type => (
            <input
              key={`${type}-${param.key}`}
              type="number"
              value={clientTypeConfig[type][param.key]}
              onChange={(e) => handleInputChange(type, param.key, parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '7px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                fontSize: '0.85rem',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
              step="0.1"
              min="0"
              max="1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ClientHeterogeneityConfig;
