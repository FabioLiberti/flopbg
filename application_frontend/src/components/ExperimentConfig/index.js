// application_frontend/src/components/ExperimentConfig/index.js
import React from 'react';
import BasicConfigForm from './BasicConfigForm';
import ClientHeterogeneityConfig from './ClientHeterogeneityConfig';
import ClientDynamismConfig from './ClientDynamismConfig';

const ExperimentConfig = ({ 
  configData, 
  experimentConfig, 
  setExperimentConfig,
  isTraining,
  status,
  handleStartExperiment,
  handleStopExperiment 
}) => {
  return (
    <div>
      <BasicConfigForm
        experimentConfig={experimentConfig}
        setExperimentConfig={setExperimentConfig}
      />
      
      <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
        <ClientHeterogeneityConfig 
          configData={configData}
          clientTypeConfig={experimentConfig.clientTypeConfig}
          setExperimentConfig={setExperimentConfig}
        />
        <ClientDynamismConfig 
          configData={configData}
          clientDynamismConfig={experimentConfig.clientDynamismConfig}
          setExperimentConfig={setExperimentConfig}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button
          onClick={handleStartExperiment}
          disabled={isTraining}
          style={{
            padding: '12px 24px',
            backgroundColor: isTraining ? '#ccc' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isTraining ? 'not-allowed' : 'pointer'
          }}
        >
          Start Experiment
        </button>
        <button
          onClick={handleStopExperiment}
          disabled={!isTraining}
          style={{
            padding: '12px 24px',
            backgroundColor: !isTraining ? '#ccc' : '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isTraining ? 'not-allowed' : 'pointer'
          }}
        >
          Stop Experiment
        </button>
      </div>
    </div>
  );
};

export default ExperimentConfig;