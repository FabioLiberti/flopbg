// src/App.js

import React, { useState, useEffect, useCallback } from 'react';
import ExperimentConfigForm from './components/ExperimentConfigForm';
import ChartMetrics from './components/ChartMetrics';
import ROCChart from './components/ROCChart';
import ConfusionMatrixChart from './components/ConfusionMatrixChart';
import ClientParticipationChart from './components/ClientParticipationChart';
import ClientDataDistributionChart from './components/ClientDataDistributionChart';
import ClientTrainingTimesChart from './components/ClientTrainingTimesChart';
import ImageComparison from './components/ImageComparison';
import GlobeVisualization from './components/GlobeVisualization';
import NodeConfiguration from './components/NodeConfiguration';
//import nodes from './data/nodes.json';
import logo1 from './assets/opbg1.png';
import logo2 from './assets/mercatorum1.jpeg';
import InfoBox from './components/InfoBox';
//import ExperimentConfig from './components/ExperimentConfig';
import BasicConfigForm from './components/ExperimentConfig/BasicConfigForm';
import ClientHeterogeneityConfig from './components/ExperimentConfig/ClientHeterogeneityConfig';
import ClientDynamismConfig from './components/ExperimentConfig/ClientDynamismConfig';
import { getRandomCity, distributeTypes, getCitiesByView } from './data/worldCities';
import USE_CASES from './data/useCases';


import {
  fetchDatasets,
  fetchStatus,
  fetchConfig,
  configureExperiment,
  startExperiment,
  stopExperiment,
} from './utils/helpers';


// Definizione delle funzioni fetchNodes e saveNodes

const fetchNodes = async () => {
  try {
    const response = await fetch('http://localhost:5001/nodes');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.nodes;
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return [];
  }
};

const saveNodes = async (nodes) => {
  try {
    const response = await fetch('http://localhost:5001/nodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nodes }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log('Nodes saved successfully');
  } catch (error) {
    console.error('Error saving nodes:', error);
  }
};

function App() {
  const [status, setStatus] = useState('Idle');
  const [isTraining, setIsTraining] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const [datasetsGenerici, setDatasetsGenerici] = useState([]);
  const [datasetsClinici, setDatasetsClinici] = useState([]);
  const [datasetName, setDatasetName] = useState('');

  const [numRounds, setNumRounds] = useState(5);
  //const [numClients, setNumClients] = useState(10);
  const [localEpochs, setLocalEpochs] = useState(1);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState(0.01);
  const [algorithm, setAlgorithm] = useState('fedavg');
  const [mu, setMu] = useState(0.0);
  const [quantizationBits, setQuantizationBits] = useState(32);
  const [globalParticipationRate, setGlobalParticipationRate] = useState(1.0);
  const [clientTypeConfig, setClientTypeConfig] = useState({
    strong: { computational_power: 1.0, network_speed: 1.0, proportion: 0.3 },
    medium: { computational_power: 0.7, network_speed: 0.7, proportion: 0.5 },
    weak: { computational_power: 0.4, network_speed: 0.5, proportion: 0.2 },
  });
  const [clientDynamismConfig, setClientDynamismConfig] = useState({
    fast: { participation_rate: 0.9, proportion: 0.3 },
    normal: { participation_rate: 0.7, proportion: 0.5 },
    slow: { participation_rate: 0.5, proportion: 0.2 },
  });

  const [centralizedResult, setCentralizedResult] = useState({});
  const [federatedResults, setFederatedResults] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState(null);
  const [lossChartData, setLossChartData] = useState(null);
  const [lossChartOptions, setLossChartOptions] = useState(null);
  const [rocChartData, setRocChartData] = useState(null);
  const [rocChartOptions, setRocChartOptions] = useState({});
  const [confusionMatrixData, setConfusionMatrixData] = useState(null);
  const [confusionMatrixOptions, setConfusionMatrixOptions] = useState({});
  const [clientParticipationData, setClientParticipationData] = useState(null);
  const [clientParticipationOptions, setClientParticipationOptions] = useState({});
  const [clientSampleCounts, setClientSampleCounts] = useState(null);
  const [clientSampleCountsOptions, setClientSampleCountsOptions] = useState({});
  const [trainingTimesData, setTrainingTimesData] = useState(null);
  const [trainingTimesOptions, setTrainingTimesOptions] = useState({});
  const [clientParticipation, setClientParticipation] = useState({});
  const [clientDataDistribution, setClientDataDistribution] = useState({});
  const [clientTrainingTimes, setClientTrainingTimes] = useState({});
  const [configData, setConfigData] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [numClients, setNumClients] = useState(0);
  const [isDataAvailable, setIsDataAvailable] = useState(false);

  // Experiment monitoring state
  const [experimentStartTime, setExperimentStartTime] = useState(null);
  const [experimentEndTime, setExperimentEndTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [nodeDistView, setNodeDistView] = useState('global');
  const [selectedUseCase, setSelectedUseCase] = useState(null);
  const [algorithmsExpanded, setAlgorithmsExpanded] = useState(false);

  // Recommendation data per dataset
  const datasetRecommendations = {
    mnist: {
      algorithm: 'fedavg',
      algorithmLabel: 'FedAvg',
      alternatives: ['DeepAFL', 'FedProx'],
      numRounds: 10, localEpochs: 1, batchSize: 32, learningRate: 0.01, mu: 0.0,
      rationale: 'Dataset semplice (28×28 grayscale, 10 classi, 60K campioni). FedAvg converge rapidamente senza bisogno di regolarizzazione aggiuntiva.'
    },
    fashion_mnist: {
      algorithm: 'fedavg',
      algorithmLabel: 'FedAvg',
      alternatives: ['FedProx', 'SCAFFOLD'],
      numRounds: 15, localEpochs: 2, batchSize: 32, learningRate: 0.01, mu: 0.0,
      rationale: 'Complessità moderata (28×28 grayscale, 10 classi). FedAvg è sufficiente; in scenari non-IID considerare FedProx o SCAFFOLD.'
    },
    cifar10: {
      algorithm: 'scaffold',
      algorithmLabel: 'SCAFFOLD',
      alternatives: ['FedProx', 'FedDyn'],
      numRounds: 30, localEpochs: 3, batchSize: 32, learningRate: 0.001, mu: 0.0,
      rationale: 'Immagini a colori (32×32, 10 classi). SCAFFOLD riduce la varianza tra client con control variates, ideale per scenari non-IID.'
    },
    cifar100: {
      algorithm: 'scaffold',
      algorithmLabel: 'SCAFFOLD',
      alternatives: ['FedDyn', 'MOON'],
      numRounds: 50, localEpochs: 3, batchSize: 64, learningRate: 0.001, mu: 0.1,
      rationale: 'Alta complessità (100 classi fine-grained). SCAFFOLD gestisce bene la varianza; FedDyn o MOON aiutano in caso di forte eterogeneità.'
    },
    svhn: {
      algorithm: 'fedavg',
      algorithmLabel: 'FedAvg',
      alternatives: ['FedNova', 'FedExP'],
      numRounds: 20, localEpochs: 2, batchSize: 64, learningRate: 0.001, mu: 0.0,
      rationale: 'Dataset grande (~600K campioni, 10 classi). La dimensione dei dati compensa l\'eterogeneità; FedAvg è efficiente.'
    },
    chest_xray: {
      algorithm: 'fedprox',
      algorithmLabel: 'FedProx',
      alternatives: ['FedDyn', 'FedDisco'],
      numRounds: 30, localEpochs: 3, batchSize: 16, learningRate: 0.0005, mu: 0.01,
      rationale: 'Classificazione binaria (polmonite), dati clinici sbilanciati tra centri. FedProx limita il drift locale con il termine prossimale.'
    },
    isic: {
      algorithm: 'feddisco',
      algorithmLabel: 'FedDisco',
      alternatives: ['SCAFFOLD', 'FedDyn'],
      numRounds: 40, localEpochs: 3, batchSize: 16, learningRate: 0.0005, mu: 0.0,
      rationale: 'Dermatologia multi-classe (9 classi), forte variabilità di distribuzione tra ospedali. FedDisco pesa l\'aggregazione in base alla discrepanza distributiva.'
    },
    brain_tumor: {
      algorithm: 'fedprox',
      algorithmLabel: 'FedProx',
      alternatives: ['MOON', 'FedDyn'],
      numRounds: 30, localEpochs: 3, batchSize: 16, learningRate: 0.0005, mu: 0.01,
      rationale: 'Imaging cerebrale (4 classi). FedProx stabilizza il training con regolarizzazione prossimale; MOON può migliorare con loss contrastiva.'
    },
    brain_tumor_mri: {
      algorithm: 'moon',
      algorithmLabel: 'MOON',
      alternatives: ['FedProx', 'FedDyn'],
      numRounds: 30, localEpochs: 3, batchSize: 16, learningRate: 0.0005, mu: 1.0,
      rationale: 'MRI cerebrale (4 classi, immagini 224×224). MOON corregge il drift locale con loss contrastiva sulle rappresentazioni, efficace per imaging medico complesso.'
    },
    retinopathy: {
      algorithm: 'feddisco',
      algorithmLabel: 'FedDisco',
      alternatives: ['SCAFFOLD', 'FedDyn'],
      numRounds: 40, localEpochs: 3, batchSize: 16, learningRate: 0.0005, mu: 0.0,
      rationale: 'Retinopatia diabetica (5 classi). Forte eterogeneità tra centri ospedalieri; FedDisco adatta i pesi di aggregazione alla discrepanza distributiva.'
    },
    skin_cancer: {
      algorithm: 'fedprox',
      algorithmLabel: 'FedProx',
      alternatives: ['FedDyn', 'DeepAFL'],
      numRounds: 30, localEpochs: 3, batchSize: 16, learningRate: 0.0005, mu: 0.01,
      rationale: 'Classificazione binaria (cancro cutaneo). Dati clinici con distribuzione eterogenea; FedProx bilancia convergenza e privacy.'
    }
  };

  const applyRecommendation = (datasetKey) => {
    const rec = datasetRecommendations[datasetKey];
    if (!rec) return;
    setAlgorithm(rec.algorithm);
    setNumRounds(rec.numRounds);
    setLocalEpochs(rec.localEpochs);
    setBatchSize(rec.batchSize);
    setLearningRate(rec.learningRate);
    setMu(rec.mu);
  };

  const handleNodesUpdate = (updatedNodes) => {
    setNodes(updatedNodes);
    setNumClients(updatedNodes.length);
    saveNodes(updatedNodes);
  };

  const handleNodeDistViewChange = (newView) => {
    setNodeDistView(newView);
    // Reassign all nodes to random cities from the selected region
    const regionCities = getCitiesByView(newView);
    if (regionCities.length === 0) return;
    setNodes(prevNodes => {
      const usedCities = [];
      const updated = prevNodes.map((node) => {
        const available = regionCities.filter(c => !usedCities.includes(c.city));
        const pool = available.length > 0 ? available : regionCities;
        const city = pool[Math.floor(Math.random() * pool.length)];
        usedCities.push(city.city);
        return {
          ...node,
          city: city.city,
          latitude: city.latitude,
          longitude: city.longitude,
        };
      });
      saveNodes(updated);
      return updated;
    });
  };

  const applyUseCase = (useCase) => {
    setSelectedUseCase(useCase.id);
    // Basic config
    setDatasetName(useCase.dataset);
    setNumRounds(useCase.basicConfig.numRounds);
    setLocalEpochs(useCase.basicConfig.localEpochs);
    setBatchSize(useCase.basicConfig.batchSize);
    setLearningRate(useCase.basicConfig.learningRate);
    setAlgorithm(useCase.basicConfig.algorithm || 'fedavg');
    setMu(useCase.basicConfig.mu);
    setQuantizationBits(useCase.basicConfig.quantizationBits);
    setGlobalParticipationRate(useCase.basicConfig.globalParticipationRate);
    // Advanced config
    setClientTypeConfig(useCase.clientTypeConfig);
    setClientDynamismConfig(useCase.clientDynamismConfig);
    // Node distribution view
    setNodeDistView(useCase.nodeDistView);
    // Nodes
    const useCaseNodes = useCase.nodes.map(n => ({ ...n }));
    setNodes(useCaseNodes);
    setNumClients(useCaseNodes.length);
    saveNodes(useCaseNodes);
  };

  // Timer effect: updates every second while configuring or training
  useEffect(() => {
    let timer = null;
    if ((isTraining || isConfiguring) && experimentStartTime) {
      timer = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - experimentStartTime) / 1000));
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isTraining, isConfiguring, experimentStartTime]);

  // Detect experiment end
  useEffect(() => {
    if (!isTraining && experimentStartTime && !experimentEndTime && results.length > 0) {
      setExperimentEndTime(Date.now());
    }
  }, [isTraining, experimentStartTime, experimentEndTime, results]);

  // Helper: format seconds as HH:MM:SS
  const formatElapsed = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  // Helper: format timestamp as date/time string
  const formatTimestamp = (ts) => {
    if (!ts) return '--';
    const d = new Date(ts);
    return d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT');
  };

  //////////////////////////////////////////////////////////////////////////// inizio 2° parte

  // Fetch datasets and status on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [datasetsData, configData, nodesData] = await Promise.all([
        //const [datasetsData, FetchedConfigData, nodesData] = await Promise.all([
          fetchDatasets(),
          fetchConfig(),
          fetchNodes(),
        ]);

        if (datasetsData) {
          setDatasetsGenerici(datasetsData.generici || []);
          setDatasetsClinici(datasetsData.clinici || []);
          if (datasetsData.generici && datasetsData.generici.length > 0) {
            setDatasetName(datasetsData.generici[0].name);
          } else if (
            datasetsData.clinici && datasetsData.clinici.length > 0) {
            setDatasetName(datasetsData.clinici[0].name);
          }
        }

        setConfigData(configData);
        //setConfigData(fetchedConfigData);
        setNodes(nodesData);

        // Set numClients based on the number of nodes
        if (nodesData && nodesData.length > 0) {
          setNumClients(nodesData.length);
        }

        setIsDataAvailable(true);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadData();

    // Set interval for periodic status updates
    const interval = setInterval(() => {
      try {
        fetchStatus(
          setStatus,
          setIsTraining,
          setResults,
          setClientParticipation,
          setClientDataDistribution,
          setClientTrainingTimes,
          setCentralizedResult
        );
      } catch (error) {
        console.error('Error fetching status in interval:', error);
      }
    }, 5000);

    // Cleanup the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Function to validate the payload
  const validatePayload = () => {
    const parsedNumRounds = parseInt(numRounds, 10);
    const parsedLocalEpochs = parseInt(localEpochs, 10);
    const parsedBatchSize = parseInt(batchSize, 10);
    const parsedLearningRate = parseFloat(learningRate);
    const parsedMu = parseFloat(mu);
    const parsedQuantizationBits = parseInt(quantizationBits, 10);
    const parsedGlobalParticipationRate = parseFloat(globalParticipationRate);

    return (
      !isNaN(parsedNumRounds) &&
      !isNaN(parsedLocalEpochs) &&
      !isNaN(parsedBatchSize) &&
      !isNaN(parsedLearningRate) &&
      !isNaN(parsedMu) &&
      !isNaN(parsedQuantizationBits) &&
      !isNaN(parsedGlobalParticipationRate)
    );
  };

  // Function to start the experiment
  const handleStartExperiment = async () => {
    // Validate the payload
    if (!validatePayload()) {
      console.error('Invalid payload: ', {
        numRounds,
        localEpochs,
        batchSize,
        learningRate,
        mu,
        quantizationBits,
        globalParticipationRate,
      });
      return;
    }

    // Reset state variables
    setStatus('Idle');
    setResults([]);
    setCentralizedResult({});
    setFederatedResults([]);
    setClientParticipation({});
    setClientDataDistribution({});
    setClientTrainingTimes({});
    setChartData(null);
    setChartOptions(null);
    setLossChartData(null);
    setLossChartOptions(null);
    setRocChartData(null);
    setRocChartOptions(null);
    setClientParticipationData(null);
    setClientParticipationOptions(null);
    setClientSampleCounts(null);
    setClientSampleCountsOptions(null);
    setTrainingTimesData(null);
    setTrainingTimesOptions(null);
    setConfusionMatrixData(null);
    setConfusionMatrixOptions(null);
    setIsTraining(false);
    setExperimentEndTime(null);
    setElapsedSeconds(0);

    // Show monitoring box immediately
    setExperimentStartTime(Date.now());
    setIsConfiguring(true);
    setStatus('Configuring...');

    try {
      // First, configure the system
      const experimentConfig = {
        dataset_name: datasetName,
        num_clients: parseInt(numClients),
        client_types: clientTypeConfig,
        client_dynamism: clientDynamismConfig,
      };

      await configureExperiment(experimentConfig);

      const payload = {
        num_rounds: parseInt(numRounds, 10),
        local_epochs: parseInt(localEpochs, 10),
        batch_size: parseInt(batchSize, 10),
        learning_rate: parseFloat(learningRate),
        mu: parseFloat(mu),
        quantization_bits: parseInt(quantizationBits, 10),
        global_participation_rate: parseFloat(globalParticipationRate),
        algorithm: algorithm,
      };

      console.log('Payload being sent to /start:', payload);

      await startExperiment(payload);

      setIsConfiguring(false);
      setIsTraining(true);
      setStatus('Running');
      console.log('Experiment started.');
    } catch (error) {
      console.error('Error starting experiment:', error);
      setIsConfiguring(false);
      setIsTraining(false);
      setExperimentStartTime(null);
      setStatus('Error');
    }
  };

  // Function to stop the experiment
  const handleStopExperiment = async () => {
    try {
      await stopExperiment();
      setIsTraining(false);
      setStatus('Stopped');
      console.log('Experiment stopped.');
    } catch (error) {
      console.error('Error stopping experiment:', error);
    }
  };

  //////////////////////////////////////////////////////////////////////// inizio 3° invio

  // useEffect for processing results and preparing chart data
  useEffect(() => {
    if (Array.isArray(results) && results.length > 0) {
      console.log('Results:', results);

      const centralized = results.find(
        (item) => Number(item.round) === 0
      ) || {};
      const federated = results.filter(
        (item) => Number(item.round) !== 0
      );

      console.log('Centralized Result:', centralized);
      console.log('Federated Results:', federated);

      setCentralizedResult(centralized);
      setFederatedResults(federated);

      const rounds = federated.map((item) => `Round ${item.round}`);

      const colors = {
        accuracy: 'rgb(75, 192, 192)',
        loss: 'rgb(255, 99,132)',
        precision: 'rgb(54, 162, 235)',
        recall: 'rgb(255, 206, 86)',
        f1_score: 'rgb(153, 102, 255)',
        auc_roc: 'rgb(255, 159, 64)',
      };

      // Helper to check if a metric has valid data
      const isMetricAvailable = (metric) =>
        typeof centralized[metric] === 'number' &&
        federated.every((item) => typeof item[metric] === 'number');

      // --- Chart 1: Performance Metrics (accuracy, precision, recall, f1_score, auc_roc) ---
      const performanceMetrics = [
        'accuracy', 'precision', 'recall', 'f1_score', 'auc_roc',
      ].filter(isMetricAvailable);

      const performanceDatasets = performanceMetrics.flatMap((metric) => [
        {
          label: `Centralized ${metric.replace('_', ' ')}`,
          data: federated.map(() => parseFloat(centralized[metric]) || 0),
          borderColor: colors[metric],
          borderDash: [8, 4],
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        },
        {
          label: `Federated ${metric.replace('_', ' ')}`,
          data: federated.map((item) => parseFloat(item[metric]) || 0),
          borderColor: colors[metric],
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
        },
      ]);

      if (performanceDatasets.length > 0) {
        setChartData({ labels: rounds, datasets: performanceDatasets });
        setChartOptions({
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 1,
              ticks: { callback: (val) => val.toFixed(2) },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Performance Metrics',
              font: { size: 14, weight: 'bold' },
            },
            legend: {
              display: true,
              position: 'bottom',
              labels: { usePointStyle: true, padding: 12, font: { size: 10 } },
            },
            tooltip: {
              enabled: true,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  return `${label}: ${value.toFixed(4)}`;
                },
              },
            },
          },
        });
      } else {
        setChartData(null);
        setChartOptions(null);
      }

      // --- Chart 2: Loss ---
      if (isMetricAvailable('loss')) {
        const lossDatasets = [
          {
            label: 'Centralized Loss',
            data: federated.map(() => parseFloat(centralized.loss) || 0),
            borderColor: colors.loss,
            borderDash: [8, 4],
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            fill: false,
          },
          {
            label: 'Federated Loss',
            data: federated.map((item) => parseFloat(item.loss) || 0),
            borderColor: colors.loss,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.3,
            fill: false,
          },
        ];

        setLossChartData({ labels: rounds, datasets: lossDatasets });
        setLossChartOptions({
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (val) => val.toFixed(2) },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Loss',
              font: { size: 14, weight: 'bold' },
            },
            legend: {
              display: true,
              position: 'bottom',
              labels: { usePointStyle: true, padding: 12, font: { size: 10 } },
            },
            tooltip: {
              enabled: true,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  return `${label}: ${value.toFixed(4)}`;
                },
              },
            },
          },
        });
      } else {
        setLossChartData(null);
        setLossChartOptions(null);
      }

      // Prepare ROC Curve data
      const lastResult = federated[federated.length - 1];
      console.log('Last federated result:', lastResult);

      if (lastResult && lastResult.roc_curve_data) {
        console.log('ROC curve data:', lastResult.roc_curve_data);

        let rocData = { datasets: [] };
        let rocOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: { display: true, text: 'False Positive Rate' },
              min: 0,
              max: 1,
            },
            y: {
              type: 'linear',
              position: 'left',
              title: { display: true, text: 'True Positive Rate' },
              min: 0,
              max: 1,
            },
          },
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const fpr = context.parsed.x.toFixed(4);
                  const tpr = context.parsed.y.toFixed(4);
                  return `${label}: TPR: ${tpr}, FPR: ${fpr}`;
                },
              },
            },
          },
        };

        // Helper to downsample ROC data points for cleaner rendering
        const downsampleROC = (fprArr, tprArr, maxPoints = 200) => {
          if (fprArr.length <= maxPoints) {
            return fprArr.map((fpr, i) => ({ x: fpr, y: tprArr[i] }));
          }
          const step = Math.ceil(fprArr.length / maxPoints);
          const sampled = [];
          for (let i = 0; i < fprArr.length; i += step) {
            sampled.push({ x: fprArr[i], y: tprArr[i] });
          }
          // Always include the last point
          const last = fprArr.length - 1;
          if (sampled[sampled.length - 1].x !== fprArr[last]) {
            sampled.push({ x: fprArr[last], y: tprArr[last] });
          }
          return sampled;
        };

        if (
          lastResult.roc_curve_data.fpr &&
          lastResult.roc_curve_data.tpr
        ) {
          // Binary classification
          rocData.datasets.push({
            label: 'ROC Curve',
            data: downsampleROC(lastResult.roc_curve_data.fpr, lastResult.roc_curve_data.tpr),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.15)',
            fill: true,
            pointRadius: 0,
            borderWidth: 2,
            tension: 0.3,
          });
          rocOptions.plugins.title = {
            display: true,
            text: 'ROC Curve',
          };
        } else {
          // Multi-class classification
          const colorPalette = [
            '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
            '#46f0f0', '#f032e6', '#008080', '#e6beff', '#800000',
            '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080',
          ];
          Object.entries(lastResult.roc_curve_data).forEach(
            ([classLabel, classData], index) => {
              rocData.datasets.push({
                label: `Class ${classLabel}`,
                data: downsampleROC(classData.fpr, classData.tpr),
                borderColor: colorPalette[index % colorPalette.length],
                backgroundColor: 'transparent',
                pointRadius: 0,
                borderWidth: 2,
                tension: 0.3,
              });
            }
          );
          // Add diagonal reference line
          rocData.datasets.push({
            label: 'Random (AUC = 0.5)',
            data: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            borderColor: 'rgba(150, 150, 150, 0.5)',
            borderDash: [6, 4],
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
          });
          rocOptions.plugins.title = {
            display: true,
            text: 'ROC Curves',
            font: { size: 16, weight: 'bold' },
          };
          rocOptions.plugins.subtitle = {
            display: true,
            text: `Dataset: ${datasetName} | Rounds: ${numRounds} | Clients: ${numClients}`,
            font: { size: 12 },
            padding: { bottom: 10 },
          };
        }

        console.log('Prepared ROC data:', rocData);
        console.log('Prepared ROC options:', rocOptions);

        setRocChartData(rocData);
        setRocChartOptions(rocOptions);
      } else {
        console.warn('No ROC curve data available');
        setRocChartData(null);
        setRocChartOptions(null);
      }

///////////////////////////////////////////////////////////////////////// inizio 4° invio

      // Prepare Confusion Matrix Chart Data
      if (lastResult && lastResult.confusion_matrix) {
        console.log('Confusion matrix:', lastResult.confusion_matrix);
        if (
          Array.isArray(lastResult.confusion_matrix) &&
          lastResult.confusion_matrix.length > 0
        ) {
          const labels = Array.from(
            { length: lastResult.confusion_matrix.length },
            (_, i) => `Class ${i}`
          );
          const confusionMatrixData = {
            labels,
            datasets: lastResult.confusion_matrix.map(
              (row, rowIndex) => ({
                label: `Actual Class ${rowIndex}`,
                data: row,
                backgroundColor: `rgba(${
                  (rowIndex * 50) % 255
                }, ${(rowIndex * 100) % 255}, ${
                  (rowIndex * 150) % 255
                }, 0.6)`,
              })
            ),
          };
          setConfusionMatrixData(confusionMatrixData);

          const confusionMatrixOptions = {
            responsive: true,
            scales: {
              x: {
                title: { display: true, text: 'Predicted Class' },
                stacked: true,
              },
              y: {
                title: { display: true, text: 'Actual Class' },
                stacked: true,
              },
            },
            plugins: {
              title: { display: true, text: 'Confusion Matrix' },
              tooltip: {
                enabled: true,
                callbacks: {
                  label: function (context) {
                    return `Actual: ${context.dataset.label}, Predicted: Class ${context.dataIndex}, Value: ${context.raw}`;
                  },
                },
              },
              legend: { display: false },
            },
          };

          console.log(
            'Prepared confusion matrix data:',
            confusionMatrixData
          );
          console.log(
            'Prepared confusion matrix options:',
            confusionMatrixOptions
          );

          setConfusionMatrixOptions(confusionMatrixOptions);
        } else {
          console.warn(
            'Confusion matrix is not an array or is empty'
          );
          setConfusionMatrixData(null);
          setConfusionMatrixOptions(null);
        }
      } else {
        console.warn('No confusion matrix data available');
        setConfusionMatrixData(null);
        setConfusionMatrixOptions(null);
      }

      // Prepare Client Participation Chart data
      if (Object.keys(clientParticipation).length > 0) {
        setClientParticipationData({
          labels: Object.keys(clientParticipation).map(
            (round) => `Round ${round}`
          ),
          datasets: [
            {
              label: 'Number of Clients Participated',
              data: Object.values(clientParticipation).map(
                (clients) => clients.length
              ),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        });
        setClientParticipationOptions({
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Number of Clients' },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Client Participation per Round',
            },
            legend: { display: false},
            tooltip: {
              callbacks: {
                label: function (context) {
                  return 'Clients participated: ' + context.raw;
                },
              },
            },
          },
        });
      } else {
        setClientParticipationData(null);
        setClientParticipationOptions(null);
      }

      // Prepare Client Data Distribution Chart data
      if (Object.keys(clientDataDistribution).length > 0) {
        const classLabels = [
          ...new Set(
            Object.values(clientDataDistribution).flatMap(
              (client) => Object.keys(client.class_distribution)
            )
          ),
        ].sort();
        const clientIds = Object.keys(clientDataDistribution);

        setClientSampleCounts({
          labels: clientIds.map(
            (id) => `Client ${parseInt(id) + 1}`
          ),
          datasets: classLabels.map((classLabel, index) => ({
            label: `Class ${classLabel}`,
            data: clientIds.map(
              (id) =>
                clientDataDistribution[id].class_distribution[
                  classLabel
                ] || 0
            ),
            backgroundColor: `rgba(${
              (index * 50) % 255
            }, ${(index * 100) % 255}, ${
              (index * 150) % 255
            }, 0.6)`,
          })),
        });
        setClientSampleCountsOptions({
          responsive: true,
          scales: {
            x: { stacked: true, title: { display: true, text: 'Clients' } },
            y: {
              stacked: true,
              beginAtZero: true,
              title: { display: true, text: 'Number of Samples' },
            },
          },
          plugins: {
            title: { display: true, text: 'Client Data Distribution' },
            legend: { display: false},
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
        });
      } else {
        setClientSampleCounts(null);
        setClientSampleCountsOptions(null);
      }

      // Prepare Client Training Times Chart data
      if (Object.keys(clientTrainingTimes).length > 0) {
        setTrainingTimesData({
          labels: Object.keys(clientTrainingTimes).map(
            (id) => `Client ${parseInt(id) + 1}`
          ),
          datasets: [
            {
              label: 'Training Time (seconds)',
              data: Object.values(clientTrainingTimes),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
            },
          ],
        });
        setTrainingTimesOptions({
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Training Time (seconds)',
              },
            },
          },
          plugins: {
            title: { display: true, text: 'Client Training Times' },
            legend: { display: false},
            tooltip: {
              callbacks: {
                label: function (context) {
                  return (
                    'Training time: ' +
                    Number(context.raw).toFixed(2) +
                    ' seconds'
                  );
                },
              },
            },
          },
        });
      } else {
        setTrainingTimesData(null);
        setTrainingTimesOptions(null);
      }
    } else {
      console.log('No results to process.');
      setChartData(null);
      setChartOptions(null);
      setLossChartData(null);
      setLossChartOptions(null);
      setRocChartData(null);
      setRocChartOptions(null);
      setConfusionMatrixData(null);
      setConfusionMatrixOptions(null);
      setClientParticipationData(null);
      setClientParticipationOptions(null);
      setClientSampleCounts(null);
      setClientSampleCountsOptions(null);
      setTrainingTimesData(null);
      setTrainingTimesOptions(null);
    }
  }, [
    results,
    clientParticipation,
    clientDataDistribution,
    clientTrainingTimes,
    datasetName,
    numRounds,
    numClients,
  ]);

/////////////////////////////////////////////////////////////////// inizio 5° invio  

const handleExperimentConfigUpdate = useCallback((field, value) => {
  console.log('Updating config:', field, value); // Debug log
  
  switch(field) {
    case 'algorithm':
      setAlgorithm(value);
      break;
    case 'datasetName':
      setDatasetName(value);
      break;
    case 'numRounds':
      setNumRounds(value);
      break;
    case 'numClients': {
      const newCount = Math.max(1, value || 1);
      setNumClients(newCount);
      // Sincronizza la lista nodi con il numero di client
      setNodes(prevNodes => {
        let updated;
        if (newCount > prevNodes.length) {
          // Distribuisci tipi secondo le proporzioni della Advanced Configuration
          const toAdd = newCount - prevNodes.length;
          const clientTypes = distributeTypes(toAdd, prevNodes, clientTypeConfig, 'client_type');
          const dynamismTypes = distributeTypes(toAdd, prevNodes, clientDynamismConfig, 'dynamism_type');
          const existingCities = prevNodes.map(n => n.city);
          const newNodes = [];
          for (let i = 0; i < toAdd; i++) {
            const usedCities = [...existingCities, ...newNodes.map(n => n.city)];
            const randomCity = getRandomCity(usedCities, nodeDistView);
            newNodes.push({
              id: prevNodes.length + i + 1,
              name: `Node ${prevNodes.length + i + 1}`,
              city: randomCity.city,
              latitude: randomCity.latitude,
              longitude: randomCity.longitude,
              client_type: clientTypes[i],
              dynamism_type: dynamismTypes[i],
            });
          }
          updated = [...prevNodes, ...newNodes];
        } else if (newCount < prevNodes.length) {
          // Rimuovi nodi dalla fine
          updated = prevNodes.slice(0, newCount);
        } else {
          return prevNodes;
        }
        saveNodes(updated);
        return updated;
      });
      break;
    }
    case 'localEpochs':
      setLocalEpochs(value);
      break;
    case 'batchSize':
      setBatchSize(value);
      break;
    case 'learningRate':
      setLearningRate(value);
      break;
    case 'mu':
      setMu(value);
      break;
    case 'quantizationBits':
      setQuantizationBits(value);
      break;
    case 'globalParticipationRate':
      setGlobalParticipationRate(value);
      break;
    case 'clientTypeConfig':
      setClientTypeConfig(value);
      break;
    case 'clientDynamismConfig':
      setClientDynamismConfig(value);
      break;
    default:
      console.warn('Unknown field:', field);
  }
}, [clientTypeConfig, clientDynamismConfig, nodeDistView]);

// Funzione per aggiornare le opzioni dei grafici rimuovendo le etichette interne
//const updateChartOptions = (options) => {
//  return {
//    ...options,
//    plugins: {
//      ...options.plugins,
//      legend: {
//        display: false, // Nasconde la legenda interna
//      },
//    },
//  };
//};
/*
useEffect(() => {
  if (chartOptions) {
    setChartOptions(updateChartOptions(chartOptions));
  }
  if (rocChartOptions) {
    setRocChartOptions(updateChartOptions(rocChartOptions));
  }
  if (confusionMatrixOptions) {
    setConfusionMatrixOptions(updateChartOptions(confusionMatrixOptions));
  }
  if (clientParticipationOptions) {
    setClientParticipationOptions(updateChartOptions(clientParticipationOptions));
  }
  if (clientSampleCountsOptions) {
    setClientSampleCountsOptions(updateChartOptions(clientSampleCountsOptions));
  }
  if (trainingTimesOptions) {
    setTrainingTimesOptions(updateChartOptions(trainingTimesOptions));
  }
}, [chartOptions, rocChartOptions, confusionMatrixOptions, clientParticipationOptions, clientSampleCountsOptions, trainingTimesOptions]);
*/



return (
  <div className="App">
    {/* Primo header con titolo del progetto e loghi */}
    <header style={{
      background: '#f8f9fa',
      padding: '20px 0',
      borderBottom: '1px solid #eaeaea',
      width: '100%'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        gap: '15px',
        textAlign: 'center'
      }}>
        {/* Titolo principale */}
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(1.8rem, 3vw, 2.3rem)',
          color: '#333',
          fontWeight: '700',
          maxWidth: '800px',
          lineHeight: '1.4'
        }}>
          "Federated Learning in Dynamic and Heterogeneous environments"
        </h1>

        {/* Seconda riga - Sottotitolo con loghi */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',  
          flexWrap: 'wrap'
        }}>
          <p style={{
            margin: '0 auto',
            fontSize: 'clamp(1.2rem, 1.8vw, 1.5rem)',
            color: '#666',
            fontWeight: '400',
            lineHeight: '1.6',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px'
          }}>
            Progetto sviluppato in collaborazione tra
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src={logo1}
                alt="OPBG Logo"
                style={{
                  height: '35px',
                  width: 'auto',
                  objectFit: 'contain',
                  verticalAlign: 'middle'
                }}
              />
              <strong>Ospedale Pediatrico Bambino Gesù</strong> (IRCCS)
            </span>
            e
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src={logo2}
                alt="Univ. Mercatorum Logo"
                style={{
                  height: '35px',
                  width: 'auto',
                  objectFit: 'contain',
                  verticalAlign: 'middle'
                }}
              />
              <strong>Università delle Camere di Commercio Italiane</strong> (Universitas Mercatorum)
            </span>
            <InfoBox 
              title="Federated Learning in Dynamic and Heterogeneous environments"
              infoFile="project-info"
            />
          </p>
        </div>
      </div>
    </header>

    {/* Secondo header con il titolo del dashboard e navigazione */}
    <header style={{
      background: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '10px 0 0 0',
      marginBottom: '20px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px 8px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
          color: '#333',
          fontWeight: '600',
          letterSpacing: '-0.5px',
          textAlign: 'center'
        }}>
          Federated Learning Dashboard
        </h2>
        <InfoBox
          infoFile="dashboard-info"
        />
      </div>
      {/* Tab Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0',
        borderTop: '1px solid #e0e0e0',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'datasets', label: 'Datasets' },
          { id: 'basic', label: 'Basic Configuration' },
          { id: 'advanced', label: 'Advanced Configuration' },
          { id: 'nodes', label: 'Node Distribution' },
          { id: 'usecases', label: 'Use Cases', italic: true },
          { id: 'experiment', label: 'Experiment', highlight: true },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const isRunning = tab.id === 'experiment' && (isTraining || isConfiguring);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: isActive ? `3px solid ${tab.highlight ? '#e74c3c' : '#3498db'}` : '3px solid transparent',
                background: isActive
                  ? (tab.highlight ? '#fff5f5' : '#f0f8ff')
                  : 'transparent',
                color: isActive
                  ? (tab.highlight ? '#c0392b' : '#2980b9')
                  : '#666',
                fontWeight: isActive ? '700' : '500',
                fontSize: tab.highlight ? '0.95rem' : '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: tab.highlight ? 'uppercase' : 'none',
                letterSpacing: tab.highlight ? '0.5px' : '0',
                fontStyle: tab.italic ? 'italic' : 'normal',
              }}
            >
              {tab.label}
              {isRunning && (
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#4caf50',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s infinite',
                }} />
              )}
            </button>
          );
        })}
      </nav>
    </header>

    {/* === TAB: OVERVIEW === */}
    {activeTab === 'overview' && (
    <div style={{
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '30px',
      boxSizing: 'border-box',
    }}>

      {/* === HERO SECTION === */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '40px 30px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8edf5 100%)',
        borderRadius: '16px',
        border: '1px solid #e0e4ea',
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#1976d2',
          textTransform: 'uppercase',
          letterSpacing: '2.5px',
          marginBottom: '12px',
        }}>
          PhD Research Project — Big Data and Artificial Intelligence
        </div>
        <h2 style={{
          margin: '0 0 10px 0',
          fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
          color: '#1a237e',
          fontWeight: '700',
          lineHeight: '1.3',
        }}>
          FLOPBG
        </h2>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: 'clamp(1rem, 2vw, 1.3rem)',
          color: '#37474f',
          fontWeight: '400',
          lineHeight: '1.5',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Federated Learning in Dynamic and Heterogeneous Environments:
          <br />
          A Simulation Platform for Privacy-Preserving Medical AI
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          marginTop: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <img src={logo1} alt="OPBG" style={{ height: '32px', objectFit: 'contain' }} />
            <span style={{ fontSize: '0.82rem', color: '#555' }}>Ospedale Pediatrico Bambino Gesù</span>
          </div>
          <span style={{ color: '#ccc', fontSize: '1.2rem' }}>|</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <img src={logo2} alt="Mercatorum" style={{ height: '32px', objectFit: 'contain' }} />
            <span style={{ fontSize: '0.82rem', color: '#555' }}>Universitas Mercatorum</span>
          </div>
        </div>

        <div style={{
          marginTop: '18px',
          fontSize: '0.82rem',
          color: '#666',
        }}>
          <strong>Fabio Liberti</strong> — Dottorato in Big Data and Artificial Intelligence
        </div>
      </div>

      {/* === IL PROGETTO === */}
      <div style={{
        marginBottom: '24px',
        padding: '24px 28px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        borderLeft: '4px solid #2e7d32',
      }}>
        <h4 style={{
          margin: '0 0 10px 0',
          fontSize: '0.95rem',
          color: '#2e7d32',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Il Progetto
        </h4>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#444', lineHeight: '1.8', textAlign: 'justify' }}>
          <strong>FLOPBG</strong> nasce dalla collaborazione scientifica tra
          l'<strong>Ospedale Pediatrico Bambino Ges&ugrave;</strong> (IRCCS), il pi&ugrave; grande centro di ricerca
          e cura pediatrica in Europa, e l'<strong>Universit&agrave; delle Camere di Commercio Italiane</strong>
          (Universitas Mercatorum), nell'ambito del Dottorato di Ricerca in Big Data and Artificial Intelligence.
        </p>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#444', lineHeight: '1.8', textAlign: 'justify' }}>
          Il progetto affronta una delle sfide pi&ugrave; rilevanti dell'AI in sanit&agrave;: come addestrare modelli
          di deep learning per la diagnosi medica per immagini quando i dati clinici sono distribuiti tra molteplici
          istituzioni e non possono essere condivisi centralmente per vincoli di privacy (GDPR), sovranit&agrave;
          dei dati e regolamentazioni sanitarie nazionali ed internazionali.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#444', lineHeight: '1.8', textAlign: 'justify' }}>
          La piattaforma &egrave; un sistema full-stack di simulazione e sperimentazione per il
          <strong> Federated Learning</strong>, progettato per valutare e confrontare strategie di addestramento
          distribuito rispetto ad approcci centralizzati, con particolare focus sull'imaging medico diagnostico
          &mdash; dalla radiologia pediatrica alla dermatologia oncologica, dalla tubercolosi alla retinopatia diabetica.
        </p>
      </div>

      {/* === ABSTRACT === */}
      <div style={{
        marginBottom: '24px',
        padding: '24px 28px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        borderLeft: '4px solid #1976d2',
      }}>
        <h4 style={{
          margin: '0 0 10px 0',
          fontSize: '0.95rem',
          color: '#1976d2',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Abstract
        </h4>
        <p style={{
          margin: 0,
          fontSize: '0.88rem',
          color: '#444',
          lineHeight: '1.8',
          textAlign: 'justify',
        }}>
          Il Federated Learning (FL) rappresenta un cambio di paradigma nell'addestramento distribuito
          di modelli di machine learning, consentendo a molteplici istituzioni di collaborare senza condividere
          i dati grezzi. Questa piattaforma di simulazione affronta le sfide reali del FL in ambito clinico:
          <strong> eterogeneit&agrave; computazionale</strong> tra i nodi partecipanti (ospedali con risorse diverse),
          <strong> dinamismo nella partecipazione</strong> (disponibilit&agrave; variabile dei client),
          <strong> distribuzione non-IID dei dati</strong> (casistiche cliniche diverse per sede),
          e <strong> vincoli di comunicazione</strong> (banda limitata, latenza variabile).
          Il framework implementa e confronta quattro algoritmi di aggregazione federata &mdash;
          <strong> FedAvg</strong>, <strong>FedProx</strong>, <strong>SCAFFOLD</strong> e <strong>FedNova</strong> &mdash;
          con meccanismi avanzati di quantizzazione dei pesi, sistema di reputazione dei client,
          e supporto per scenari multi-scala (nazionale, europeo, globale),
          con particolare applicazione all'imaging medico diagnostico.
        </p>
      </div>

      {/* === INFOGRAFICA + DIAGRAMMA AFFIANCATI === */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '36px',
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '0.95rem',
            color: '#333',
            fontWeight: '600',
          }}>
            Framework Overview
          </h4>
          <img
            src="/FLOPBG-Infografica.png"
            alt="FLOPBG Framework Infographic"
            style={{
              width: '100%',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          />
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '0.95rem',
            color: '#333',
            fontWeight: '600',
          }}>
            Methodology Diagram
          </h4>
          <img
            src="/FLOPBG-Diagramma.png"
            alt="FLOPBG Methodology Diagram"
            style={{
              width: '100%',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          />
        </div>
      </div>

      {/* === IMAGES CAPTION === */}
      <p style={{
        textAlign: 'center',
        fontSize: '0.82rem',
        color: '#888',
        margin: '-24px 0 36px',
        lineHeight: '1.6',
      }}>
        A sinistra, una panoramica sintetica dell'intero framework &mdash; dal problema scientifico alle feature implementate.
        A destra, il diagramma metodologico dettagliato con il flusso operativo completo: configurazione, motore FL (client/server), aggregazione e valutazione dei risultati.
      </p>

      {/* === RESEARCH CONTRIBUTIONS === */}
      <div style={{ marginBottom: '36px' }}>
        <h4 style={{
          textAlign: 'center',
          margin: '0 0 20px 0',
          fontSize: '1rem',
          color: '#333',
          fontWeight: '600',
        }}>
          Contributi di Ricerca Principali
        </h4>
        <p style={{
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#666',
          margin: '-8px auto 18px',
          maxWidth: '800px',
          lineHeight: '1.6',
        }}>
          Il framework integra sette componenti chiave che affrontano le principali sfide del Federated Learning in ambienti reali, dalla gestione dell'eterogeneit&agrave; dei nodi al sistema di raccomandazione per la selezione ottimale di algoritmo e configurazione.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {[
            {
              icon: '{}',
              title: 'FL Algorithms',
              desc: 'Implementazione di 12 algoritmi FL (FedAvg, FedProx, SCAFFOLD, FedNova, FedExP, FedDyn, MOON, FedDisco, FedSpeed, FedLPA, DeepAFL, FedEL) per confrontare aggregazione, variance reduction, contrastive learning e selezione dinamica.',
              color: '#1565c0',
              bg: '#e3f2fd',
            },
            {
              icon: '\u2696',
              title: 'Client Heterogeneity',
              desc: 'Simulazione realistica di nodi con potenza computazionale e velocità di rete variabili (strong, medium, weak), riflettendo le disparità infrastrutturali reali.',
              color: '#2e7d32',
              bg: '#e8f5e9',
            },
            {
              icon: '\u21c4',
              title: 'Client Dynamism',
              desc: 'Modellazione della partecipazione intermittente dei client (fast, normal, slow) con tassi di partecipazione configurabili per simulare scenari realistici.',
              color: '#e65100',
              bg: '#fff3e0',
            },
            {
              icon: '\u2260',
              title: 'Non-IID Data Distribution',
              desc: 'Supporto per distribuzioni non identicamente distribuite dei dati tra i nodi, condizione tipica degli scenari clinici multi-istituzionali.',
              color: '#6a1b9a',
              bg: '#f3e5f5',
            },
            {
              icon: '\u25a3',
              title: 'Weight Quantization',
              desc: 'Compressione dei pesi del modello (32, 16, 8 bit) per ridurre i costi di comunicazione, cruciale per nodi con connettività limitata.',
              color: '#00695c',
              bg: '#e0f2f1',
            },
            {
              icon: '\u2605',
              title: 'Reputation System',
              desc: 'Sistema di reputazione basato sulle prestazioni dei client per ponderare i contributi durante l\'aggregazione, migliorando la robustezza del modello globale.',
              color: '#c62828',
              bg: '#ffebee',
            },
            {
              icon: '\u{1F3AF}',
              title: 'Recommendation System',
              desc: 'Sistema di raccomandazione condizionale che suggerisce algoritmo e iperparametri ottimali in base al dataset selezionato, considerando complessità, distribuzione e caratteristiche cliniche.',
              color: '#bf360c',
              bg: '#fbe9e7',
            },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '20px',
              backgroundColor: item.bg,
              borderRadius: '10px',
              border: `1px solid ${item.color}22`,
              transition: 'transform 0.2s ease',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: item.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: '700',
                marginBottom: '10px',
              }}>
                {item.icon}
              </div>
              <h5 style={{
                margin: '0 0 6px 0',
                fontSize: '0.88rem',
                color: item.color,
                fontWeight: '600',
              }}>
                {item.title}
              </h5>
              <p style={{
                margin: 0,
                fontSize: '0.78rem',
                color: '#555',
                lineHeight: '1.6',
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* === ARCHITECTURE FLOW === */}
      <div style={{
        marginBottom: '36px',
        padding: '28px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <h4 style={{
          textAlign: 'center',
          margin: '0 0 24px 0',
          fontSize: '1rem',
          color: '#333',
          fontWeight: '600',
        }}>
          Architettura del Framework
        </h4>
        <p style={{
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#666',
          margin: '-12px auto 18px',
          maxWidth: '800px',
          lineHeight: '1.6',
        }}>
          La pipeline di sperimentazione segue un flusso sequenziale in sei fasi: dalla selezione del dataset alla valutazione finale, passando per la configurazione dei client, il deployment geografico dei nodi, l'addestramento federato e l'aggregazione dei pesi.
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Dataset\nSelection', sub: '11 datasets', color: '#1565c0' },
            { label: 'Client\nConfiguration', sub: 'Heterogeneity + Dynamism', color: '#2e7d32' },
            { label: 'Node\nDistribution', sub: 'Geographic deployment', color: '#e65100' },
            { label: 'FL Training', sub: 'FedAvg / FedProx / SCAFFOLD / FedNova', color: '#6a1b9a' },
            { label: 'Aggregation', sub: 'Weighted + Reputation', color: '#00695c' },
            { label: 'Evaluation', sub: 'Accuracy, Loss, ROC, CM', color: '#c62828' },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <div style={{
                padding: '14px 16px',
                backgroundColor: `${step.color}0d`,
                borderRadius: '10px',
                border: `2px solid ${step.color}33`,
                textAlign: 'center',
                minWidth: '130px',
              }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: step.color,
                  whiteSpace: 'pre-line',
                  lineHeight: '1.3',
                  marginBottom: '4px',
                }}>
                  {step.label}
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  color: '#888',
                }}>
                  {step.sub}
                </div>
              </div>
              {i < 5 && (
                <div style={{
                  fontSize: '1.2rem',
                  color: '#bbb',
                  fontWeight: '300',
                }}>
                  &#8594;
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* === DATASETS & TECHNOLOGY === */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '36px',
      }}>

        {/* Datasets */}
        <div style={{
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <h4 style={{
            margin: '0 0 14px 0',
            fontSize: '0.95rem',
            color: '#333',
            fontWeight: '600',
          }}>
            Dataset Supportati
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Colonna Benchmark */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#1565c0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#1565c0' }} />
                Benchmark
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { name: 'MNIST', classes: 10 },
                  { name: 'Fashion-MNIST', classes: 10 },
                  { name: 'CIFAR-10', classes: 10 },
                  { name: 'CIFAR-100', classes: 100 },
                  { name: 'SVHN', classes: 10 },
                ].map((ds, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '5px',
                    fontSize: '0.75rem',
                  }}>
                    <span style={{ color: '#444', fontWeight: '500' }}>{ds.name}</span>
                    <span style={{ color: '#999', marginLeft: 'auto', fontSize: '0.68rem' }}>{ds.classes} classi</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Colonna Clinical Imaging */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#e65100', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#e65100' }} />
                Clinical Imaging
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { name: 'Chest X-Ray', classes: 2 },
                  { name: 'ISIC Skin Lesion', classes: 9 },
                  { name: 'Brain Tumor', classes: 4 },
                  { name: 'Brain Tumor MRI', classes: 4 },
                  { name: 'Retinopathy', classes: 5 },
                  { name: 'Skin Cancer', classes: 2 },
                ].map((ds, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 8px',
                    backgroundColor: '#fff3e0',
                    borderRadius: '5px',
                    fontSize: '0.75rem',
                  }}>
                    <span style={{ color: '#444', fontWeight: '500' }}>{ds.name}</span>
                    <span style={{ color: '#999', marginLeft: 'auto', fontSize: '0.68rem' }}>{ds.classes} classi</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div style={{
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <h4 style={{
            margin: '0 0 14px 0',
            fontSize: '0.95rem',
            color: '#333',
            fontWeight: '600',
          }}>
            Stack Tecnologico
          </h4>
          {[
            { category: 'Backend', items: 'Python, Flask, TensorFlow / Keras', color: '#1565c0' },
            { category: 'Frontend', items: 'React, Chart.js, react-simple-maps', color: '#2e7d32' },
            { category: 'FL Framework', items: 'FedAvg, FedProx, SCAFFOLD, FedNova', color: '#6a1b9a' },
            { category: 'Data Processing', items: 'NumPy, Scikit-learn, Pillow', color: '#e65100' },
            { category: 'Visualization', items: 'Chart.js (metrics), D3.js (geo maps)', color: '#00695c' },
            { category: 'Communication', items: 'REST API, JSON, YAML configuration', color: '#c62828' },
          ].map((tech, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              padding: '7px 0',
              borderBottom: i < 5 ? '1px solid #f0f0f0' : 'none',
            }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                color: tech.color,
                minWidth: '100px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {tech.category}
              </span>
              <span style={{
                fontSize: '0.8rem',
                color: '#555',
              }}>
                {tech.items}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* === FL ALGORITHMS === */}
      <div style={{
        padding: '24px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: '36px',
      }}>
        <h4 style={{
          margin: '0 0 14px 0',
          fontSize: '0.95rem',
          color: '#333',
          fontWeight: '600',
        }}>
          Algoritmi di Federated Learning
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 180px 170px',
            gap: '12px',
            padding: '8px 12px',
            borderBottom: '2px solid #e0e0e0',
          }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Algoritmo</span>
            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descrizione</span>
            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ambito consigliato</span>
            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Riferimento</span>
          </div>
          {/* --- Implemented algorithms --- */}
          {[
            {
              name: 'FedAvg',
              abbr: 'Avg',
              color: '#1565c0',
              bg: '#e3f2fd',
              desc: 'Media pesata dei pesi per numero di campioni. Algoritmo base del Federated Learning, semplice ed efficace con dati IID.',
              scope: 'Benchmark, dati IID, baseline di confronto',
              paper: 'McMahan et al., 2017',
            },
            {
              name: 'FedProx',
              abbr: 'Prx',
              color: '#2e7d32',
              bg: '#e8f5e9',
              desc: 'Aggiunge un termine prossimale alla loss locale per vincolare i pesi vicino al modello globale, migliorando la convergenza in ambienti eterogenei.',
              scope: 'Dati non-IID, nodi eterogenei',
              paper: 'Li et al., 2020',
            },
            {
              name: 'SCAFFOLD',
              abbr: 'SCA',
              color: '#6a1b9a',
              bg: '#f3e5f5',
              desc: 'Utilizza control variates (server/client) per correggere il drift dei gradienti locali, riducendo la varianza su dati non-IID.',
              scope: 'Forte non-IID, molti client, EHDS',
              paper: 'Karimireddy et al., 2020',
            },
            {
              name: 'FedNova',
              abbr: 'Nov',
              color: '#e65100',
              bg: '#fff3e0',
              desc: 'Normalizza i contributi per il numero di gradient steps locali, eliminando il bias da epoche e dataset size diversi tra nodi.',
              scope: 'Nodi con risorse disomogenee, scenari globali',
              paper: 'Wang et al., 2020',
            },
            {
              name: 'FedExP',
              abbr: 'ExP',
              color: '#bf360c',
              bg: '#fbe9e7',
              desc: 'Estrapolazione lato server: calcola dinamicamente lo step size ottimale dai pseudo-gradienti dei client, accelerando la convergenza senza overhead.',
              scope: 'Communication-efficient, fast convergence',
              paper: 'Jhunjhunwala et al., ICLR 2023',
            },
            {
              name: 'FedDyn',
              abbr: 'Dyn',
              color: '#4527a0',
              bg: '#ede7f6',
              desc: 'Regolarizzazione dinamica: aggiorna il regolarizzatore ad ogni round per allineare gli ottimi locali con la loss globale, con convergenza pi\u00f9 rapida.',
              scope: 'Large-scale, convergenza rapida',
              paper: 'Acar et al., ICLR 2021',
            },
          ].map((algo, i, arr) => (
            <div key={`impl-${i}`} style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 180px 170px',
              gap: '12px',
              padding: '10px 12px',
              borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  backgroundColor: algo.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.62rem', fontWeight: '700', flexShrink: 0,
                }}>{algo.abbr}</div>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: algo.color }}>{algo.name}</span>
              </div>
              <span style={{ fontSize: '0.76rem', color: '#555', lineHeight: '1.5' }}>{algo.desc}</span>
              <span style={{
                fontSize: '0.72rem', color: '#444', fontWeight: '500',
                padding: '4px 8px', backgroundColor: algo.bg, borderRadius: '6px',
                textAlign: 'center', lineHeight: '1.4',
              }}>{algo.scope}</span>
              <span style={{
                fontSize: '0.68rem', color: algo.color, fontWeight: '600',
                padding: '3px 8px', backgroundColor: `${algo.color}10`, borderRadius: '8px',
                textAlign: 'center',
              }}>{algo.paper}</span>
            </div>
          ))}

          {/* --- Collapsible: Algoritmi avanzati --- */}
          <div
            onClick={() => setAlgorithmsExpanded(!algorithmsExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderTop: '2px solid #e0e0e0',
              marginTop: '4px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color 0.15s ease',
              borderRadius: '0 0 8px 8px',
              backgroundColor: algorithmsExpanded ? '#f8f9fa' : 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
            onMouseLeave={(e) => { if (!algorithmsExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span style={{
              fontSize: '0.72rem',
              transition: 'transform 0.25s ease',
              transform: algorithmsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              color: '#888',
            }}>&#9654;</span>
            <span style={{
              fontSize: '0.72rem', fontWeight: '700', color: '#888',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>Algoritmi avanzati</span>
            <span style={{
              fontSize: '0.65rem', color: '#aaa', fontWeight: '400',
              marginLeft: '4px',
            }}>
              (6 algoritmi &mdash; 2021&ndash;2025)
            </span>
          </div>

          {algorithmsExpanded && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              {[
                {
                  name: 'MOON',
                  abbr: 'MON',
                  color: '#00838f',
                  bg: '#e0f7fa',
                  desc: 'Contrastive learning a livello di modello: massimizza l\'accordo tra rappresentazioni locali e globali, correggendo il drift locale su dati non-IID.',
                  scope: 'Image classification, non-IID visivo',
                  paper: 'Li et al., CVPR 2021',
                },
                {
                  name: 'FedDisco',
                  abbr: 'Dis',
                  color: '#00695c',
                  bg: '#e0f2f1',
                  desc: 'Pesi di aggregazione basati sulla discrepanza tra distribuzione locale e globale delle categorie, con garanzie teoriche pi\u00f9 strette.',
                  scope: 'Non-IID severo, label imbalance',
                  paper: 'Ye et al., ICML 2023',
                },
                {
                  name: 'FedSpeed',
                  abbr: 'Spd',
                  color: '#ad1457',
                  bg: '#fce4ec',
                  desc: 'Correzione del prox-term sugli aggiornamenti locali per ridurre il bias introdotto dalla regolarizzazione, con bound di convergenza pi\u00f9 stretto.',
                  scope: 'Eterogeneit\u00e0 elevata, pochi round',
                  paper: 'Sun et al., ICLR 2023',
                },
                {
                  name: 'FedLPA',
                  abbr: 'LPA',
                  color: '#33691e',
                  bg: '#f1f8e9',
                  desc: 'Aggregazione one-shot con posterior bayesiano layer-wise: un singolo round di comunicazione sfruttando la struttura a livelli della rete neurale.',
                  scope: 'One-shot FL, privacy estrema',
                  paper: 'NeurIPS 2024',
                },
                {
                  name: 'DeepAFL',
                  abbr: 'AFL',
                  color: '#1a237e',
                  bg: '#e8eaf6',
                  desc: 'Analytic FL gradient-free: usa soluzioni analitiche (least squares) su feature estratte da modelli pre-trained, invariante al grado di non-IID dei dati.',
                  scope: 'Non-IID estremo, robustezza',
                  paper: 'Zhai et al., ICLR 2025',
                },
                {
                  name: 'FedEL',
                  abbr: 'EL',
                  color: '#795548',
                  bg: '#efebe9',
                  desc: 'Elastic learning con selezione dinamica dei tensori rilevanti per round e budget di comunicazione adattivo, bilanciando accuratezza ed efficienza.',
                  scope: 'Device eterogenei, edge computing',
                  paper: 'NeurIPS 2025',
                },
              ].map((algo, i, arr) => (
                <div key={`adv-${i}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 180px 170px',
                  gap: '12px',
                  padding: '10px 12px',
                  borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '6px',
                      backgroundColor: algo.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.62rem', fontWeight: '700', flexShrink: 0,
                    }}>{algo.abbr}</div>
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', color: algo.color }}>{algo.name}</span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#555', lineHeight: '1.5' }}>{algo.desc}</span>
                  <span style={{
                    fontSize: '0.72rem', color: '#444', fontWeight: '500',
                    padding: '4px 8px', backgroundColor: algo.bg, borderRadius: '6px',
                    textAlign: 'center', lineHeight: '1.4',
                  }}>{algo.scope}</span>
                  <span style={{
                    fontSize: '0.68rem', color: algo.color, fontWeight: '600',
                    padding: '3px 8px', backgroundColor: `${algo.color}10`, borderRadius: '8px',
                    textAlign: 'center',
                  }}>{algo.paper}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* === MULTI-SCALE SCENARIOS === */}
      <div style={{
        padding: '24px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: '36px',
      }}>
        <h4 style={{
          textAlign: 'center',
          margin: '0 0 18px 0',
          fontSize: '1rem',
          color: '#333',
          fontWeight: '600',
        }}>
          Scenari Multi-Scala
        </h4>
        <p style={{
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#666',
          margin: '-6px auto 18px',
          maxWidth: '800px',
          lineHeight: '1.6',
        }}>
          La piattaforma include tre Use Case preconfigurati a scale geografiche crescenti, ciascuno ispirato a scenari clinici reali con diversi livelli di eterogeneit&agrave; infrastrutturale, distribuzione dei dati e vincoli di comunicazione.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {[
            {
              scale: 'Nazionale',
              region: 'Italia',
              desc: 'Rete di ospedali di montagna italiani per la detection di polmonite pediatrica. Simulazione di nodi con risorse limitate e connettività variabile.',
              nodes: '10 nodi',
              dataset: 'Chest X-Ray',
              rounds: '100 rounds',
              color: '#2e7d32',
            },
            {
              scale: 'Europeo',
              region: 'EHDS',
              desc: 'Classificazione di lesioni cutanee distribuita su 12 centri in Europa nel framework EHDS. Eterogeneità tra grandi ospedali universitari e cliniche specializzate.',
              nodes: '12 nodi',
              dataset: 'Skin Cancer',
              rounds: '150 rounds',
              color: '#1565c0',
            },
            {
              scale: 'Globale',
              region: 'WHO',
              desc: 'Rilevamento della tubercolosi coordinato dall\'OMS su 15 centri in 6 continenti. Massima eterogeneità computazionale e partecipazione intermittente.',
              nodes: '15 nodi',
              dataset: 'Chest X-Ray',
              rounds: '200 rounds',
              color: '#c62828',
            },
          ].map((scenario, i) => (
            <div key={i} style={{
              padding: '18px',
              backgroundColor: `${scenario.color}08`,
              borderRadius: '10px',
              border: `1px solid ${scenario.color}20`,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: '600',
                color: scenario.color,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: '4px',
              }}>
                {scenario.scale}
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: scenario.color,
                marginBottom: '8px',
              }}>
                {scenario.region}
              </div>
              <p style={{
                margin: '0 0 10px 0',
                fontSize: '0.76rem',
                color: '#555',
                lineHeight: '1.6',
              }}>
                {scenario.desc}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '6px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  padding: '3px 10px',
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                }}>
                  {scenario.dataset}
                </span>
                <span style={{
                  padding: '3px 10px',
                  backgroundColor: `${scenario.color}15`,
                  color: scenario.color,
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                }}>
                  {scenario.nodes}
                </span>
                <span style={{
                  padding: '3px 10px',
                  backgroundColor: '#f3e5f5',
                  color: '#6a1b9a',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                }}>
                  {scenario.rounds}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === QUICK START === */}
      <div style={{
        textAlign: 'center',
        padding: '28px',
        backgroundColor: '#f5f7fa',
        borderRadius: '12px',
        border: '1px solid #e0e4ea',
      }}>
        <h4 style={{
          margin: '0 0 8px 0',
          fontSize: '0.95rem',
          color: '#333',
          fontWeight: '600',
        }}>
          Quick Start
        </h4>
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '0.82rem',
          color: '#666',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Seleziona un Use Case preconfigurato oppure configura manualmente dataset, parametri e distribuzione dei nodi.
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setActiveTab('usecases')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Esplora Use Cases
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#fff',
              color: '#1976d2',
              border: '2px solid #1976d2',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Configurazione Manuale
          </button>
          <button
            onClick={() => setActiveTab('experiment')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#c62828',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Avvia Esperimento
          </button>
        </div>
      </div>

    </div>
    )}

    {/* === TAB: USE CASES === */}
    {activeTab === 'usecases' && (
    <div style={{
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '30px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          color: '#666',
          margin: '0 0 0.5rem 0',
          fontWeight: '500'
        }}>
          Use Cases
        </h3>
        <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>
          Seleziona uno scenario preconfigurato per popolare automaticamente tutte le configurazioni
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${USE_CASES.length}, 1fr)`,
        gap: '20px',
      }}>
        {USE_CASES.map((uc) => {
          const isSelected = selectedUseCase === uc.id;
          return (
            <div
              key={uc.id}
              style={{
                backgroundColor: isSelected ? '#e8f5e9' : '#f8f9fa',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: isSelected
                  ? '0 4px 20px rgba(76, 175, 80, 0.25)'
                  : '0 2px 10px rgba(0,0,0,0.1)',
                border: isSelected ? '2px solid #4caf50' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                maxHeight: '75vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={() => applyUseCase(uc)}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <h4 style={{
                    margin: '0 0 4px 0',
                    fontSize: '1.1rem',
                    color: '#333',
                    fontWeight: '600'
                  }}>
                    {uc.name}
                  </h4>
                  <span style={{
                    fontSize: '0.78rem',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    {uc.subtitle}
                  </span>
                </div>
                {isSelected && (
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    ATTIVO
                  </span>
                )}
              </div>

              {/* Dataset badge */}
              <div style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                marginBottom: '12px'
              }}>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  borderRadius: '4px',
                  fontSize: '0.73rem',
                  fontWeight: '500'
                }}>
                  Dataset: {uc.dataset}
                </span>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: '#fff3e0',
                  color: '#e65100',
                  borderRadius: '4px',
                  fontSize: '0.73rem',
                  fontWeight: '500'
                }}>
                  {uc.basicConfig.numClients} nodi
                </span>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: '#f3e5f5',
                  color: '#7b1fa2',
                  borderRadius: '4px',
                  fontSize: '0.73rem',
                  fontWeight: '500'
                }}>
                  {uc.basicConfig.numRounds} rounds
                </span>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  borderRadius: '4px',
                  fontSize: '0.73rem',
                  fontWeight: '500'
                }}>
                  Vista: {uc.nodeDistView === 'national' ? 'Italia' : uc.nodeDistView === 'europe' ? 'Europa' : 'Globale'}
                </span>
              </div>

              {/* Context */}
              <div style={{ marginBottom: '10px' }}>
                <h5 style={{ margin: '0 0 4px 0', color: '#444', fontSize: '0.82rem' }}>Contesto</h5>
                <p style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: '#555',
                  lineHeight: '1.5',
                }}>
                  {uc.description}
                </p>
              </div>

              {/* Problem */}
              {uc.problem && (
              <div style={{
                marginBottom: '10px',
                padding: '10px 12px',
                backgroundColor: isSelected ? 'rgba(255, 243, 224, 0.8)' : '#fff3e0',
                borderRadius: '8px',
                borderLeft: '4px solid #ff9800',
              }}>
                <h5 style={{ margin: '0 0 4px 0', color: '#e65100', fontSize: '0.82rem' }}>Problema</h5>
                <p style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: '#bf360c',
                  lineHeight: '1.5',
                  fontWeight: '500',
                }}>
                  {uc.problem}
                </p>
              </div>
              )}

              {/* Objective */}
              <div style={{ marginBottom: '12px' }}>
                <h5 style={{ margin: '0 0 4px 0', color: '#444', fontSize: '0.82rem' }}>Obiettivo</h5>
                <p style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: '#555',
                  lineHeight: '1.5',
                }}>
                  {uc.objective}
                </p>
              </div>

              {/* Config summary grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px 8px',
                padding: '10px',
                backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : '#fff',
                borderRadius: '8px',
                fontSize: '0.73rem',
                marginBottom: '10px'
              }}>
                <div><span style={{ color: '#888' }}>LR:</span> <strong>{uc.basicConfig.learningRate}</strong></div>
                <div><span style={{ color: '#888' }}>Batch:</span> <strong>{uc.basicConfig.batchSize}</strong></div>
                <div><span style={{ color: '#888' }}>Epochs:</span> <strong>{uc.basicConfig.localEpochs}</strong></div>
                <div><span style={{ color: '#888' }}>Mu:</span> <strong>{uc.basicConfig.mu}</strong></div>
                <div><span style={{ color: '#888' }}>Quant. bits:</span> <strong>{uc.basicConfig.quantizationBits}</strong></div>
                <div><span style={{ color: '#888' }}>Part. rate:</span> <strong>{uc.basicConfig.globalParticipationRate}</strong></div>
              </div>

              {/* Nodes list */}
              <div>
                <h5 style={{ margin: '0 0 6px 0', color: '#444', fontSize: '0.82rem' }}>
                  Nodi ({uc.nodes.length})
                </h5>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '3px',
                  fontSize: '0.72rem'
                }}>
                  {uc.nodes.map(node => (
                    <div key={node.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '2px 5px',
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.5)' : '#f5f5f5',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${
                        node.client_type === 'strong' ? '#e53935' :
                        node.client_type === 'medium' ? '#43a047' : '#1e88e5'
                      }`
                    }}>
                      <span style={{ fontWeight: '500', color: '#333' }}>#{node.id}</span>
                      <span style={{ color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '12px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); applyUseCase(uc); }}
                  style={{
                    padding: '8px 24px',
                    backgroundColor: isSelected ? '#4caf50' : '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSelected ? 'Configurazione Applicata' : 'Applica Configurazione'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    )}

    {/* === TAB: DATASETS === */}
    {activeTab === 'datasets' && (
    <>
    <div style={{
      width:'100%',
      maxWidth:'1400px',
      margin:'0 auto',
      padding:'30px',
      display:'flex',
      gap:'30px',
      boxSizing:'border-box'
    }}>
      {/* Colonna Dataset Generici */}
      <div style={{ 
         flex : 1,
         backgroundColor:'#f8f9fa',  
         borderRadius:'10px',  
         padding:'20px',  
         boxShadow:'0 2px 10px rgba(0,0,0,0.1)'
       }}>
         <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px' }}>
           <h3 style={{ margin : 0 }}>Dataset Generici</h3>
           <InfoBox 
             title="Informazioni sui Dataset Generici" 
             infoFile="datasets-info"
           />
         </div>
         <ul style={{ 
           listStyle : "none", 
           padding : 0, 
           margin : 0 
         }}>
           {datasetsGenerici.map((dataset) => (
             <li key={dataset.name} style={{ marginBottom:'8px' }}>
               <button
                 onClick={() => setDatasetName(dataset.name)}
                 style={{
                   fontWeight : datasetName === dataset.name ? "bold" : "normal",
                   backgroundColor : datasetName === dataset.name ? "#e0e0e0" : "transparent",
                   width : "100%",
                   padding : "8px 12px",
                   border : "1px solid #ddd",
                   borderRadius : "4px",
                   cursor : "pointer",
                   textAlign : "left",
                   transition : "all 0.2s ease",
                   borderColor : datasetName === dataset.name ? "#3498db" : "#ddd",
                   boxShadow : datasetName === dataset.name ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                 }}
               >
                 {dataset.display_name} ({dataset.name})
               </button>
             </li>
           ))}
         </ul>
       </div>

       {/* Colonna Dataset Clinici */}
       <div style={{ 
         flex : 1,
         backgroundColor:'#f8f9fa',  
         borderRadius:'10px',  
         padding:'20px',  
         boxShadow:'0 2px 10px rgba(0,0,0,0.1)'
       }}>
         <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px' }}>
           <h3 style={{ margin : 0 }}>Dataset Clinici</h3>
           <InfoBox 
             title="Informazioni sui Dataset Clinici" 
             infoFile="datasets_clinical-info"
           />
         </div>
         <ul style={{ 
           listStyle : "none", 
           padding : 0, 
           margin : 0 
         }}>
           {datasetsClinici.map((dataset) => (
  <li key={dataset.name} style={{ marginBottom:'8px' }}>
    <button
      onClick={() => setDatasetName(dataset.name)}
      style={{
        fontWeight: datasetName === dataset.name ? "bold" : "normal",
        backgroundColor: datasetName === dataset.name ? "#e0e0e0" : 
          // Aggiungi il colore rosso leggero per i nuovi dataset
          ['brain-tumor-mri', 'retinopathy', 'skin-cancer'].includes(dataset.name) ? 
          "#ffebee" : "transparent",
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        borderColor: datasetName === dataset.name ? "#3498db" : 
          // Bordo leggermente più scuro per i nuovi dataset
          ['brain-tumor-mri', 'retinopathy', 'skin-cancer'].includes(dataset.name) ? 
          "#ffcdd2" : "#ddd",
        boxShadow: datasetName === dataset.name ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
        // Stile hover per i nuovi dataset
        ':hover': {
          backgroundColor: ['brain-tumor-mri', 'retinopathy', 'skin-cancer'].includes(dataset.name) ? 
            "#ffcdd2" : "#f5f5f5"
        }
      }}
    >
      {dataset.display_name} ({dataset.name})
    </button>
  </li>
))}
         </ul>
       </div>
     </div>

    {/* Recommendation Box */}
    {datasetName && datasetRecommendations[datasetName] && (() => {
      const rec = datasetRecommendations[datasetName];
      const isApplied = algorithm === rec.algorithm
        && numRounds === rec.numRounds
        && localEpochs === rec.localEpochs
        && batchSize === rec.batchSize
        && learningRate === rec.learningRate;
      return (
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 30px 30px 30px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          backgroundColor: isApplied ? '#e8f5e9' : '#fff8e1',
          border: `1px solid ${isApplied ? '#a5d6a7' : '#ffe082'}`,
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '24px', lineHeight: '1' }}>
              {isApplied ? '\u2705' : '\uD83D\uDCA1'}
            </span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '15px' }}>
                {isApplied ? 'Configurazione consigliata applicata' : 'Configurazione consigliata'}
              </h4>
              <p style={{ margin: '0 0 12px 0', color: '#555', fontSize: '13px', lineHeight: '1.5' }}>
                {rec.rationale}
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: isApplied ? '#c8e6c9' : '#fff3e0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  {rec.algorithmLabel}
                </span>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: isApplied ? '#c8e6c9' : '#f3f4f6',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#555'
                }}>
                  Rounds: {rec.numRounds}
                </span>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: isApplied ? '#c8e6c9' : '#f3f4f6',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#555'
                }}>
                  LR: {rec.learningRate}
                </span>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: isApplied ? '#c8e6c9' : '#f3f4f6',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#555'
                }}>
                  Batch: {rec.batchSize}
                </span>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: isApplied ? '#c8e6c9' : '#f3f4f6',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#555'
                }}>
                  Epoche: {rec.localEpochs}
                </span>
                {rec.mu > 0 && (
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: isApplied ? '#c8e6c9' : '#f3f4f6',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#555'
                  }}>
                    Mu: {rec.mu}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => applyRecommendation(datasetName)}
                  disabled={isApplied}
                  style={{
                    padding: '6px 18px',
                    backgroundColor: isApplied ? '#a5d6a7' : '#f9a825',
                    color: isApplied ? '#2e7d32' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isApplied ? 'default' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    opacity: isApplied ? 0.8 : 1
                  }}
                >
                  {isApplied ? 'Applicata' : 'Applica configurazione'}
                </button>
                <span style={{ fontSize: '12px', color: '#888' }}>
                  Alternative: {rec.alternatives.join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      );
    })()}
    </>
    )}

    {/* === TAB: BASIC CONFIGURATION === */}
    {activeTab === 'basic' && (
    <>
{/* 1. Prima sezione - Basic Configuration */}
<div style={{ 
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '30px',
  boxSizing: 'border-box'
}}>
  <div style={{ 
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
      <h3 style={{ margin: 0 }}>Basic Configuration</h3>
      <InfoBox 
        title="Informazioni sulla Configurazione Base" 
        infoFile="basic-config-info"
      />
    </div>
    <div style={{
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRadius: '8px'
    }}>
      <BasicConfigForm
        experimentConfig={{
          algorithm,
          numRounds,
          numClients,
          localEpochs,
          batchSize,
          learningRate,
          mu,
          quantizationBits,
          globalParticipationRate
        }}
        setExperimentConfig={handleExperimentConfigUpdate}
      />
    </div>
  </div>
</div>
    </>
    )}

    {/* === TAB: ADVANCED CONFIGURATION === */}
    {activeTab === 'advanced' && (
    <>
{/* Advanced Configuration Section */}
<div style={{
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '30px',
  boxSizing: 'border-box'
}}>
  {/* Header Section */}
  <div style={{
    marginBottom: '1.5rem',
    position: 'relative',
    padding: '0.5rem 0',
    textAlign: 'center'
  }}>
    <h3 style={{
      fontSize: '1.5rem',
      color: '#666',
      margin: '0',
      position: 'relative',
      display: 'inline-block',
      padding: '0 2rem',
      fontWeight: '500'
    }}>
      Advanced Configuration
    </h3>
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100px',
      height: '2px',
      background: '#666',
      marginTop: '0.5rem'
    }} />
  </div>

  {/* Configuration Cards Container */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    alignItems: 'start',
  }}>
    {/* Client Heterogeneity Card */}
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      padding: '1.2rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <h4 style={{
          margin: 0,
          color: '#444',
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>
          Client Heterogeneity
        </h4>
        <InfoBox
          title="Informazioni sulla Configurazione dell'Eterogeneità dei Client"
          infoFile="client-heterogeneity-info"
        />
      </div>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
      }}>
        <ClientHeterogeneityConfig
          clientTypeConfig={clientTypeConfig}
          setExperimentConfig={handleExperimentConfigUpdate}
        />
      </div>
    </div>

    {/* Client Dynamism Card */}
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      padding: '1.2rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <h4 style={{
          margin: 0,
          color: '#444',
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>
          Client Dynamism
        </h4>
        <InfoBox
          title="Informazioni sul Dinamismo dei Client"
          infoFile="client-dynamism-info"
        />
      </div>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
      }}>
        <ClientDynamismConfig
          clientDynamismConfig={clientDynamismConfig}
          setExperimentConfig={handleExperimentConfigUpdate}
        />
      </div>
    </div>
  </div>
</div>
    </>
    )}

    {/* === TAB: NODE DISTRIBUTION === */}
    {activeTab === 'nodes' && (() => {
      const viewConfig = {
        global:   { label: 'Global Node Distribution',  projection: { scale: 160, center: [10, 20] } },
        europe:   { label: 'Europe Node Distribution',  projection: { scale: 700, center: [15, 52] } },
        national: { label: 'Italy Node Distribution',   projection: { scale: 2500, center: [12.5, 42] } },
      };
      const currentView = viewConfig[nodeDistView];

      return (
    <>
{/* Node Distribution and Configuration Section */}
<div style={{
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 2rem',
  marginBottom: '100px'
}}>
  <div style={{
    marginTop: '2rem',
    marginBottom: '1rem',
    position: 'relative',
    padding: '1rem 0',
    textAlign: 'center'
  }}>
    <h3 style={{
      fontSize: '1.5rem',
      color: '#666',
      margin: '0',
      position: 'relative',
      display: 'inline-block',
      padding: '0 2rem',
      fontWeight: '500'
    }}>
      Node Distribution and Configuration
    </h3>
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100px',
      height: '2px',
      background: '#666',
      marginTop: '0.5rem'
    }} />
  </div>

  {/* Sub-navigation: Global / Europe / National */}
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '1.5rem'
  }}>
    {Object.entries(viewConfig).map(([key, cfg]) => {
      const isActive = nodeDistView === key;
      return (
        <button
          key={key}
          onClick={() => handleNodeDistViewChange(key)}
          style={{
            padding: '8px 20px',
            border: isActive ? '2px solid #3498db' : '1px solid #ccc',
            borderRadius: '20px',
            background: isActive ? '#e8f4fd' : '#fff',
            color: isActive ? '#2980b9' : '#666',
            fontWeight: isActive ? '600' : '400',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {cfg.label}
        </button>
      );
    })}
  </div>

  <div style={{
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '1rem',
    textAlign: 'center'
  }}>
    Dataset: {datasetName} | Rounds: {numRounds} | Clients: {numClients}
  </div>

  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2rem',
    justifyContent: 'center',
    alignItems: 'flex-start'
  }}>
    {/* Map Visualization */}
    <div style={{
      flex: '1 1 500px',
      minWidth: '500px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      padding: '1.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{
        margin: '0 0 1rem 0',
        color: '#444',
        fontSize: '1.2rem',
        textAlign: 'center'
      }}>
        {currentView.label}
      </h4>
      <div style={{
        height: '500px',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <GlobeVisualization
          key={nodeDistView}
          nodes={nodes}
          projectionConfig={currentView.projection}
        />
      </div>
    </div>

    {/* Node Configuration */}
    <div style={{
      flex: '1 1 400px',
      minWidth: '400px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      padding: '1.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{
        margin: '0 0 1rem 0',
        color: '#444',
        fontSize: '1.2rem',
        textAlign: 'center'
      }}>
        Node Configuration
      </h4>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '1rem',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        <NodeConfiguration
          nodes={nodes}
          clientTypes={clientTypeConfig}
          clientDynamism={clientDynamismConfig}
          onNodesUpdate={handleNodesUpdate}
          currentView={nodeDistView}
        />
      </div>
    </div>
  </div>
</div>
    </>
      );
    })()}

    {/* === TAB: EXPERIMENT === */}
    {activeTab === 'experiment' && (
    <>
    {/* Experiment Controls */}
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '20px'
    }}>
      <button
        onClick={handleStartExperiment}
        disabled={isTraining || isConfiguring}
        style={{
          padding: '12px 24px',
          backgroundColor: (isTraining || isConfiguring) ? '#ccc' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: (isTraining || isConfiguring) ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {isConfiguring ? 'Configuring...' : 'Start Experiment'}
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
          cursor: !isTraining ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        Stop Experiment
      </button>
    </div>

    {/* Status Display */}
    {status && (
      <div style={{
        textAlign: 'center',
        padding: '10px',
        marginTop: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '4px'
      }}>
        Status: {status}
      </div>
    )}

    {/* Experiment Monitoring Box */}
    {experimentStartTime && (
      <div style={{
        width: '100%',
        maxWidth: '900px',
        margin: '30px auto',
        padding: '25px 30px',
        backgroundColor: isConfiguring ? '#fff8e1' : (isTraining ? '#e8f5e9' : '#f3f8ff'),
        border: isConfiguring ? '2px solid #ff9800' : (isTraining ? '2px solid #4caf50' : '2px solid #1976d2'),
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        {/* Configuring banner */}
        {isConfiguring && (
          <div style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#e65100',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              backgroundColor: '#ff9800',
              borderRadius: '50%',
              animation: 'pulse 1s infinite'
            }} />
            Configurazione e caricamento dataset in corso...
          </div>
        )}

        {/* Timer and Round Counter */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px',
          marginBottom: '15px'
        }}>
          {/* Timer */}
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            fontFamily: 'monospace',
            color: isConfiguring ? '#e65100' : (isTraining ? '#2e7d32' : '#1565c0'),
            letterSpacing: '2px'
          }}>
            {formatElapsed(
              (!isTraining && !isConfiguring && experimentEndTime)
                ? Math.floor((experimentEndTime - experimentStartTime) / 1000)
                : elapsedSeconds
            )}
            {(isTraining || isConfiguring) && (
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: isConfiguring ? '#ff9800' : '#4caf50',
                borderRadius: '50%',
                marginLeft: '12px',
                animation: 'pulse 1.5s infinite',
                verticalAlign: 'middle'
              }} />
            )}
          </div>
          {/* Round Counter */}
          {!isConfiguring && (
            <div style={{
              fontSize: '1.6rem',
              fontWeight: '600',
              color: isTraining ? '#2e7d32' : '#1565c0',
              padding: '8px 20px',
              backgroundColor: isTraining ? 'rgba(76, 175, 80, 0.1)' : 'rgba(25, 118, 210, 0.1)',
              borderRadius: '8px'
            }}>
              Round {results.filter(r => Number(r.round) > 0).length} / {numRounds}
            </div>
          )}
        </div>

        {/* Experiment Parameters */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px 24px',
          marginBottom: '15px',
          fontSize: '0.95rem'
        }}>
          <span><strong>Dataset:</strong> {datasetName}</span>
          <span><strong>Rounds:</strong> {numRounds}</span>
          <span><strong>Clients:</strong> {numClients}</span>
          <span><strong>Local Epochs:</strong> {localEpochs}</span>
          <span><strong>Batch Size:</strong> {batchSize}</span>
          <span><strong>Learning Rate:</strong> {learningRate}</span>
          <span><strong>Mu:</strong> {mu}</span>
          <span><strong>Quantization:</strong> {quantizationBits} bit</span>
          <span><strong>Participation Rate:</strong> {globalParticipationRate}</span>
        </div>

        {/* Start/End Timestamps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          fontSize: '0.9rem',
          color: '#555',
          borderTop: '1px solid #ddd',
          paddingTop: '12px'
        }}>
          <span><strong>Start:</strong> {formatTimestamp(experimentStartTime)}</span>
          <span><strong>End:</strong> {experimentEndTime ? formatTimestamp(experimentEndTime) : ((isTraining || isConfiguring) ? 'In corso...' : '--')}</span>
          {experimentEndTime && (
            <span><strong>Durata totale:</strong> {formatElapsed(Math.floor((experimentEndTime - experimentStartTime) / 1000))}</span>
          )}
        </div>
      </div>
    )}

     {/* Sezione dei risultati */}
      <div style={{ 
        textAlign: 'center',
        marginTop: '4rem', 
        marginBottom: '3rem',
        position: 'relative',
        padding: '1,5rem 0'
      }}>
        <h2 style={{ 
          fontSize: '2.0rem',
          color: '#666',
          margin: '0',
          position: 'relative',
          display: 'inline-block',
          padding: '0 3rem',
          fontWeight: '500'
        }}>
          Results
        </h2>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '2px',
          background: '#666',
          marginTop: '0.5rem'
        }} />
  </div>
     {results && results.length > 0 ? (
      <>
    {/* Federated vs Centralized Learning Metrics — two charts side by side */}
    <div style={{ marginBottom: '100px', textAlign: 'center'}}>
      <h3>Federated vs Centralized Learning Metrics</h3>
      <div style={{
        fontSize: '1.2rem',
        color: '#666',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        Dataset: {datasetName} | Rounds: {numRounds} | Clients: {numClients}
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Left: Performance Metrics */}
        <div style={{ flex: '1 1 45%', minWidth: '400px' }}>
          {chartData && chartOptions ? (
            <ChartMetrics
              data={chartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 12, font: { size: 10 } },
                  },
                }
              }}
            />
          ) : (
            <p>No performance metrics available.</p>
          )}
        </div>
        {/* Right: Loss */}
        <div style={{ flex: '1 1 45%', minWidth: '400px' }}>
          {lossChartData && lossChartOptions ? (
            <ChartMetrics
              data={lossChartData}
              options={{
                ...lossChartOptions,
                plugins: {
                  ...lossChartOptions.plugins,
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 12, font: { size: 10 } },
                  },
                }
              }}
            />
          ) : (
            <p>No loss data available.</p>
          )}
        </div>
      </div>
    </div>

         {/* Centralized Learning Metrics */}
         <h3>Centralized Learning Metrics:</h3>
         <ul>
           <li>
             Accuracy = {centralizedResult.accuracy?.toFixed(4) || 'N/A'}, 
             Loss = {centralizedResult.loss?.toFixed(4) || 'N/A'}, 
             F1 Score = {centralizedResult.f1_score?.toFixed(4) || 'N/A'}, 
             Precision = {centralizedResult.precision?.toFixed(4) || 'N/A'}, 
             Recall = {centralizedResult.recall?.toFixed(4) || 'N/A'}, 
             AUC-ROC = {centralizedResult.auc_roc?.toFixed(4) || 'N/A'}
           </li>
         </ul>

         {/* Federated Learning Metrics */}
         <h3>Federated Learning Metrics:</h3>
         <div style={{ marginBottom: '100px' }}>
           {federatedResults.length > 0 ? (
             <ul>
               {federatedResults.map((item, index) => (
                 <li key={index}>
                   Round {item.round}: 
                   Accuracy = {item.accuracy?.toFixed(4) || 'N/A'}, 
                   Loss = {item.loss?.toFixed(4) || 'N/A'}, 
                   F1 Score = {item.f1_score?.toFixed(4) || 'N/A'}, 
                   Precision = {item.precision?.toFixed(4) || 'N/A'}, 
                   Recall = {item.recall?.toFixed(4) || 'N/A'}, 
                   AUC-ROC = {item.auc_roc?.toFixed(4) || 'N/A'}
                 </li>
               ))}
             </ul>
           ) : (
             <p>No Federated Learning Metrics available.</p>
           )}
         </div>

         {/* ROC Curves */}
          <div style={{ marginBottom: '100px', textAlign: 'center' }}>
            <h3>ROC Curves</h3>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              marginBottom: '1rem',
              textAlign: 'center' 
            }}>
              Dataset: {datasetName} | Rounds: {numRounds} | Clients: {numClients}
            </div>
            {rocChartData && rocChartOptions ? (
              <ROCChart 
                data={rocChartData} 
                options={{
                  ...rocChartOptions,
                  plugins: {
                    ...rocChartOptions.plugins,
                    legend: {
                      display: true,
                      position: 'right'
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            ) : (
              <p>ROC Curve data is not available. This might be due to ongoing training or insufficient data.</p>
            )}
          </div>

         {/* Confusion Matrix */}
         <div style={{ marginBottom: '100px', textAlign: 'center' }}>
          <h3>Confusion Matrix</h3>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#666', 
            marginBottom: '1rem',
            textAlign: 'center' 
          }}>
            Dataset: {datasetName} | Rounds: {numRounds} | Clients: {numClients}
          </div>
          {confusionMatrixData && confusionMatrixOptions ? (
            <ConfusionMatrixChart
              confusionMatrixData={confusionMatrixData}
              confusionMatrixOptions={{
                ...confusionMatrixOptions,
                plugins: {
                  ...confusionMatrixOptions.plugins,
                  legend: {
                    display: true,
                    position: 'right'
                  },
                  title: {
                    display: false
                  }
                }
              }}
            />
          ) : (
            <p>Confusion Matrix data is not available. This might be due to ongoing training or insufficient data.</p>
          )}
        </div>

         {/* Predicted vs Real Images */}
         <div style={{ marginBottom: '100px', textAlign: 'center' }}>
          <h3>Predicted vs Real Images</h3>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#666', 
            marginBottom: '1rem',
            textAlign: 'center' 
          }}>
            Dataset: {datasetName} | Rounds: {numRounds} | Clients: {numClients}
          </div>
          <ImageComparison datasetName={datasetName} isTraining={isTraining} />
        </div>

          {/* Client Data Distribution */}
          <div style={{ marginBottom: '100px', textAlign: 'center' }}>
            <h3>Client Data Distribution</h3>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              marginBottom: '1rem',
              textAlign: 'center' 
            }}>
              Dataset: {datasetName} | Rounds: {numRounds} | Clients: {numClients}
            </div>
            {clientSampleCounts && clientSampleCountsOptions && (
              <ClientDataDistributionChart
                data={clientSampleCounts}
                options={{
                  ...clientSampleCountsOptions,
                  plugins: {
                    ...clientSampleCountsOptions.plugins,
                    legend: {
                      display: true,
                      position: 'right'
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            )}
          </div>

          {/* Client Participation & Client Training Times — side by side */}
          <div style={{ marginBottom: '100px', textAlign: 'center' }}>
            <div style={{
              fontSize: '0.9rem',
              color: '#666',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Dataset: {datasetName} | Rounds: {numRounds} | Clients: {numClients}
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {/* Left: Client Participation */}
              <div style={{ flex: '1 1 45%', minWidth: '400px' }}>
                <h3>Client Participation</h3>
                {clientParticipationData && clientParticipationOptions ? (
                  <ClientParticipationChart
                    data={clientParticipationData}
                    options={{
                      ...clientParticipationOptions,
                      plugins: {
                        ...clientParticipationOptions.plugins,
                        legend: { display: false },
                        title: { display: false }
                      }
                    }}
                  />
                ) : (
                  <p>No client participation data available.</p>
                )}
              </div>
              {/* Right: Client Training Times */}
              <div style={{ flex: '1 1 45%', minWidth: '400px' }}>
                <h3>Client Training Times</h3>
                {trainingTimesData && trainingTimesOptions ? (
                  <ClientTrainingTimesChart
                    data={trainingTimesData}
                    options={{
                      ...trainingTimesOptions,
                      plugins: {
                        ...trainingTimesOptions.plugins,
                        legend: { display: false },
                        title: { display: false }
                      }
                    }}
                  />
                ) : (
                  <p>No training times data available.</p>
                )}
              </div>
            </div>
          </div>


       </>
     ) : (
       <div style={{
         textAlign: 'center',
         padding: '20px 30px',
         backgroundColor: '#ffebee',
         border: '2px solid #e53935',
         borderRadius: '8px',
         color: '#b71c1c',
         fontWeight: 'bold',
         fontSize: '1rem',
         maxWidth: '600px',
         margin: '20px auto',
       }}>
         No results available. The experiment might still be in progress
         or hasn't started yet.
       </div>
     )}
    </>
    )}

   </div>
)}
export default App;