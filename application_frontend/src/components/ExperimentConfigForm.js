// src/components/ExperimentConfigForm.js

import React, { useEffect } from 'react';

const ExperimentConfigForm = ({
  configData,
  datasets,
  experimentConfig,
  setExperimentConfig,
  startExperiment,
  stopExperiment,
  isTraining,
  status,
}) => {
  // Use useEffect to set default values from configData on mount
  useEffect(() => {
    if (configData) {
      setExperimentConfig((prevConfig) => ({
        ...prevConfig,
        numRounds: configData.global_epochs || prevConfig.numRounds,
        numClients: configData.num_clients || prevConfig.numClients,
        localEpochs: configData.local_epochs || prevConfig.localEpochs,
        batchSize: configData.batch_size || prevConfig.batchSize,
        learningRate: configData.learning_rate || prevConfig.learningRate,
        mu: configData.mu || prevConfig.mu,
        quantizationBits:
          configData.quantization_bits || prevConfig.quantizationBits,
        clientTypeConfig:
          configData.client_types || prevConfig.clientTypeConfig,
        clientDynamismConfig:
          configData.client_dynamism || prevConfig.clientDynamismConfig,
        globalParticipationRate:
          configData.global_participation_rate ||
          prevConfig.globalParticipationRate,
      }));
    }
  }, [configData, setExperimentConfig]);

  const handleInputChange = (key, value) => {
    if (experimentConfig[key] !== value) {
      setExperimentConfig({
        ...experimentConfig,
        [key]: value,
      });
    }
  };

  const handleClientTypeChange = (type, key, value) => {
    setExperimentConfig({
      ...experimentConfig,
      clientTypeConfig: {
        ...experimentConfig.clientTypeConfig,
        [type]: {
          ...experimentConfig.clientTypeConfig[type],
          [key]: value,
        },
      },
    });
  };

  const handleClientDynamismChange = (type, key, value) => {
    setExperimentConfig({
      ...experimentConfig,
      clientDynamismConfig: {
        ...experimentConfig.clientDynamismConfig,
        [type]: {
          ...experimentConfig.clientDynamismConfig[type],
          [key]: value,
        },
      },
    });
  };

  const validateClientProportions = () => {
    const clientTypes = Object.values(experimentConfig.clientTypeConfig || {});
    const clientDynamism = Object.values(
      experimentConfig.clientDynamismConfig || {}
    );

    const sumTypeProportions = clientTypes.reduce(
      (sum, type) => sum + (parseFloat(type.proportion) || 0),
      0
    );
    const sumDynamismProportions = clientDynamism.reduce(
      (sum, type) => sum + (parseFloat(type.proportion) || 0),
      0
    );

    return (
      Math.abs(sumTypeProportions - 1) < 0.001 &&
      Math.abs(sumDynamismProportions - 1) < 0.001
    );
  };

  return (
    <div>
      <h2>Configure Experiment</h2>
      {/* Dataset Selection */}
      <label>
        Dataset Name:
        {Array.isArray(datasets) && datasets.length > 0 ? (
          <select
            name="datasetName"
            value={experimentConfig.datasetName}
            onChange={(e) =>
              handleInputChange('datasetName', e.target.value)
            }
          >
            {datasets.map((dataset) => (
              <option key={dataset.name} value={dataset.name}>
                {dataset.display_name} ({dataset.name})
              </option>
            ))}
          </select>
        ) : (
          <span>Loading datasets...</span>
        )}
      </label>
      <br />
      {/* Number of Rounds */}
      <label>
        Number of Rounds:
        <input
          type="number"
          name="numRounds"
          value={experimentConfig.numRounds}
          onChange={(e) =>
            handleInputChange(
              'numRounds',
              e.target.value === '' ? '' : parseInt(e.target.value)
            )
          }
          min="1"
          required
        />
      </label>
      <br />
      {/* Number of Clients */}
      <label>
        Number of Clients:
        <input
          type="number"
          name="numClients"
          value={experimentConfig.numClients}
          onChange={(e) =>
            handleInputChange(
              'numClients',
              e.target.value === '' ? '' : parseInt(e.target.value)
            )
          }
          min="1"
          required
        />
      </label>
      <br />
      {/* Local Epochs */}
      <label>
        Local Epochs:
        <input
          type="number"
          name="localEpochs"
          value={experimentConfig.localEpochs}
          onChange={(e) =>
            handleInputChange(
              'localEpochs',
              e.target.value === '' ? '' : parseInt(e.target.value)
            )
          }
          min="1"
          required
        />
      </label>
      <br />
      {/* Batch Size */}
      <label>
        Batch Size:
        <input
          type="number"
          name="batchSize"
          value={experimentConfig.batchSize}
          onChange={(e) =>
            handleInputChange(
              'batchSize',
              e.target.value === '' ? '' : parseInt(e.target.value)
            )
          }
          min="1"
          required
        />
      </label>
      <br />
      {/* Learning Rate */}
      <label>
        Learning Rate:
        <input
          type="number"
          name="learningRate"
          value={experimentConfig.learningRate}
          onChange={(e) =>
            handleInputChange(
              'learningRate',
              e.target.value === '' ? '' : parseFloat(e.target.value)
            )
          }
          min="0.0001"
          max="1.0"
          step="0.0001"
          required
        />
      </label>
      <br />
      {/* Mu */}
      <label>
        Mu (FedProx Penalty):
        <input
          type="number"
          name="mu"
          value={experimentConfig.mu}
          onChange={(e) =>
            handleInputChange(
              'mu',
              e.target.value === '' ? '' : parseFloat(e.target.value)
            )
          }
          min="0.0"
          max="1.0"
          step="0.01"
          required
        />
      </label>
      <br />
      {/* Quantization Bits */}
      <label>
        Quantization Bits:
        <input
          type="number"
          name="quantizationBits"
          value={experimentConfig.quantizationBits}
          onChange={(e) =>
            handleInputChange(
              'quantizationBits',
              e.target.value === '' ? '' : parseInt(e.target.value)
            )
          }
          min="1"
          max="32"
          required
        />
      </label>
      <br />
      {/* Global Participation Rate */}
      <label>
        Global Participation Rate:
        <input
          type="number"
          name="globalParticipationRate"
          value={experimentConfig.globalParticipationRate}
          onChange={(e) =>
            handleInputChange(
              'globalParticipationRate',
              e.target.value === '' ? '' : parseFloat(e.target.value)
            )
          }
          min="0.0"
          max="1.0"
          step="0.1"
          required
        />
      </label>
      <br />
      {/* Client Types Configuration (Heterogeneity) */}
      <h3>Client Types Configuration (Heterogeneity)</h3>
      {experimentConfig.clientTypeConfig &&
        Object.keys(experimentConfig.clientTypeConfig).map((type) => (
          <div
            key={type}
            style={{
              border: '1px solid black',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <h4>{type.charAt(0).toUpperCase() + type.slice(1)} Client</h4>
            <label>
              Computational Power:
              <input
                type="number"
                name={`computational_power_${type}`}
                value={
                  experimentConfig.clientTypeConfig[type].computational_power
                }
                onChange={(e) =>
                  handleClientTypeChange(
                    type,
                    'computational_power',
                    parseFloat(e.target.value)
                  )
                }
                min="0.0"
                max="1.0"
                step="0.1"
                required
              />
            </label>
            <br />
            <label>
              Network Speed:
              <input
                type="number"
                name={`network_speed_${type}`}
                value={
                  experimentConfig.clientTypeConfig[type].network_speed
                }
                onChange={(e) =>
                  handleClientTypeChange(
                    type,
                    'network_speed',
                    parseFloat(e.target.value)
                  )
                }
                min="0.0"
                max="1.0"
                step="0.1"
                required
              />
            </label>
            <br />
            <label>
              Proportion:
              <input
                type="number"
                name={`proportion_${type}`}
                value={experimentConfig.clientTypeConfig[type].proportion}
                onChange={(e) =>
                  handleClientTypeChange(
                    type,
                    'proportion',
                    parseFloat(e.target.value)
                  )
                }
                min="0.0"
                max="1.0"
                step="0.1"
                required
              />
            </label>
          </div>
        ))}
      {/* Client Dynamism Configuration */}
      <h3>Client Dynamism Configuration</h3>
      {experimentConfig.clientDynamismConfig &&
        Object.keys(experimentConfig.clientDynamismConfig).map((type) => (
          <div
            key={type}
            style={{
              border: '1px solid black',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <h4>{type.charAt(0).toUpperCase() + type.slice(1)} Client</h4>
            <label>
              Participation Rate:
              <input
                type="number"
                name={`participation_rate_${type}`}
                value={
                  experimentConfig.clientDynamismConfig[type]
                    .participation_rate
                }
                onChange={(e) =>
                  handleClientDynamismChange(
                    type,
                    'participation_rate',
                    parseFloat(e.target.value)
                  )
                }
                min="0.0"
                max="1.0"
                step="0.1"
                required
              />
            </label>
            <br />
            <label>
              Proportion:
              <input
                type="number"
                name={`dynamism_proportion_${type}`}
                value={
                  experimentConfig.clientDynamismConfig[type].proportion
                }
                onChange={(e) =>
                  handleClientDynamismChange(
                    type,
                    'proportion',
                    parseFloat(e.target.value)
                  )
                }
                min="0.0"
                max="1.0"
                step="0.1"
                required
              />
            </label>
          </div>
        ))}
      <button
        onClick={startExperiment}
        disabled={status === 'Running' || !validateClientProportions()}
      >
        Start Experiment
      </button>
      {isTraining && (
        <p>Training in progress... (Addestramento in esecuzione)</p>
      )}
      {status === 'Running' && (
        <button onClick={stopExperiment}>Stop Experiment</button>
      )}
    </div>
  );
};

export default ExperimentConfigForm;

