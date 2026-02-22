// src/components/ExperimentConfig/ClientDynamismConfig.js
import React from 'react';

const clientTypes = ['fast', 'normal', 'slow'];
const parameters = [
  { key: 'participation_rate', label: 'Participation Rate' },
  { key: 'proportion', label: 'Proportion' },
];

const typeColors = {
  fast: '#e53935',
  normal: '#ff9800',
  slow: '#1e88e5',
};

const typeSizes = {
  fast: 7,
  normal: 5,
  slow: 3,
};

const ClientDynamismConfig = ({ clientDynamismConfig, setExperimentConfig }) => {
  const handleInputChange = (clientType, field, value) => {
    const updatedConfig = {
      ...clientDynamismConfig,
      [clientType]: {
        ...clientDynamismConfig[clientType],
        [field]: value
      }
    };
    setExperimentConfig('clientDynamismConfig', updatedConfig);
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
            <svg width={typeSizes[type] * 2 + 2} height={typeSizes[type] * 2 + 2}>
              <circle cx={typeSizes[type] + 1} cy={typeSizes[type] + 1} r={typeSizes[type]} fill={typeColors[type]} />
            </svg>
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
              value={clientDynamismConfig[type][param.key]}
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

export default ClientDynamismConfig;
