// src/utils/helpers.js

export const fetchConfig = async (setConfigData) => {
  try {
    const response = await fetch('http://localhost:5001/config');
    const configData = await response.json();
    console.log('Configuration data:', configData);
    setConfigData(configData);
  } catch (error) {
    console.error('Error fetching configuration:', error);
  }
};

export const fetchDatasets = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/datasets');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Available datasets:', data);

    // Restituisce i dataset come oggetto con chiavi 'generici' e 'clinici'
    return {
      generici: data.generici || [],
      clinici: data.clinici || [],
    };
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return {
      generici: [],
      clinici: [],
    };
  }
};

export const fetchStatus = async (
  setStatus,
  setIsTraining,
  setResults,
  setClientParticipation,
  setClientDataDistribution,
  setClientTrainingTimes,
  setCentralizedResult
) => {
  try {
    const response = await fetch('http://localhost:5001/status');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data received from server');
    }

    console.log('Full status data received:', data);

    // Ensure roc_curve_data and confusion_matrix from top-level state
    // are injected into the last federated result for the frontend useEffect
    let accuracyData = data.accuracy_data || [];
    if (accuracyData.length > 0 && (data.roc_curve_data || data.confusion_matrix)) {
      const lastFederatedIdx = accuracyData.map((item, i) => ({ ...item, _idx: i }))
        .filter(item => Number(item.round) > 0)
        .pop();
      if (lastFederatedIdx !== undefined) {
        const idx = lastFederatedIdx._idx;
        if (data.roc_curve_data && !accuracyData[idx].roc_curve_data) {
          accuracyData[idx].roc_curve_data = data.roc_curve_data;
        }
        if (data.confusion_matrix && !accuracyData[idx].confusion_matrix) {
          accuracyData[idx].confusion_matrix = data.confusion_matrix;
        }
      }
    }

    setStatus(data.status || 'Idle');
    setIsTraining(data.status === 'Running');
    setResults(accuracyData);
    setClientParticipation(data.client_participation || {});
    setClientDataDistribution(data.client_data_distribution || {});
    setClientTrainingTimes(data.client_training_times || {});

    if (typeof setCentralizedResult === 'function') {
      setCentralizedResult(data.centralized_metrics || {});
    }
  } catch (error) {
    console.error('Error fetching status:', error);
  }
};

export const formatDatasetName = (dataset) => {
  const names = {
    mnist: 'MNIST',
    fashion_mnist: 'Fashion MNIST',
    cifar10: 'CIFAR-10',
    cifar100: 'CIFAR-100',
    svhn: 'SVHN',
    chest_xray: 'Chest X-Ray',
    isic: 'ISIC',
  };
  return names[dataset] || dataset;
};

export const configureExperiment = async (experimentConfig) => {
  try {
    console.log('Configuration payload:', experimentConfig);

    const response = await fetch('http://localhost:5001/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(experimentConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    console.log('System configured successfully.');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error configuring experiment:', error);
    throw error; // Re-throw the error to prevent starting the experiment
  }
};

export const startExperiment = async (payload) => {
  try {
    const response = await fetch('http://localhost:5001/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    console.log('Experiment started:', data);
  } catch (error) {
    console.error('Error starting experiment:', error);
    throw error;
  }
};

export const stopExperiment = async () => {
  try {
    const response = await fetch('http://localhost:5001/stop', {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Experiment stopped:', data);
  } catch (error) {
    console.error('Error stopping experiment:', error);
    throw error;
  }
};
