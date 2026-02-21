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
    console.log('Full status data received:', data);
    
    // Verifica la presenza dei dati necessari
    if (!data.accuracy_data || data.accuracy_data.length === 0) {
      console.warn('Missing or empty accuracy_data');
    }  

    if (!data.roc_curve_data) {
      console.warn('Missing roc_curve_data');
    } else {
      console.log('ROC curve data received:', data.roc_curve_data);
    }
    if (!data.confusion_matrix) {
      console.warn('Missing confusion_matrix');
    } else {
      console.log('Confusion matrix received:', data.confusion_matrix);
    }


    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data received from server');
    }
    
    // Verifica la presenza dei dati necessari
    if (!data.roc_curve_data) console.warn('Missing roc_curve_data');
    if (!data.confusion_matrix) console.warn('Missing confusion_matrix');
    if (!data.client_participation) console.warn('Missing client_participation data');
    if (!data.client_data_distribution) console.warn('Missing client_data_distribution data');
    if (!data.client_training_times) console.warn('Missing client_training_times data');
    
    setStatus(data.status || 'Idle');
    setIsTraining(data.status === 'Running');
    setResults(data.accuracy_data || []);
    setClientParticipation(data.client_participation || {});
    setClientDataDistribution(data.client_data_distribution || {});
    setClientTrainingTimes(data.client_training_times || {});

    if (typeof setCentralizedResult === 'function') {
      setCentralizedResult(data.centralized_metrics || {});
    } else {
      console.warn('setCentralizedResult is not a function');
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
