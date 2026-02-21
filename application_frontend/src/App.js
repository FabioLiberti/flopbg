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

//  const handleNodesUpdate = useCallback((updatedNodes) => { //
const handleNodesUpdate = (updatedNodes) => {
  setNodes(updatedNodes);
  setNumClients(updatedNodes.length);
  saveNodes(updatedNodes);
};


//function App() {
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
      };

      console.log('Payload being sent to /start:', payload);

      await startExperiment(payload);

      setIsTraining(true);
      setStatus('Running');
      console.log('Experiment started.');
    } catch (error) {
      console.error('Error starting experiment:', error);
      setIsTraining(false);
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

      // Adjusted metricsList to match the keys in your data
      const metricsList = [
        'accuracy',
        'loss',
        'precision',
        'recall',
        'f1_score',
        'auc_roc',
      ].filter(
        (metric) =>
          typeof centralized[metric] === 'number' &&
          federated.every(
            (item) => typeof item[metric] === 'number'
          )
      );
      const colors = {
        accuracy: 'rgb(75, 192, 192)',
        loss: 'rgb(255, 99,132)',
        precision: 'rgb(54, 162, 235)',
        recall: 'rgb(255, 206, 86)',
        f1_score: 'rgb(153, 102, 255)',
        auc_roc: 'rgb(255, 159, 64)',
      };

      const datasets = metricsList.flatMap((metric) => [
        {
          label: `Centralized ${metric.replace('_', ' ')}`,
          data: federated.map(
            () => parseFloat(centralized[metric]) || 0
          ),
          borderColor: colors[metric],
          borderDash: [5, 5],
          tension: 0.1,
          fill: false,
        },
        {
          label: `Federated ${metric.replace('_', ' ')}`,
          data: federated.map(
            (item) => parseFloat(item[metric]) || 0
          ),
          borderColor: colors[metric],
          tension: 0.1,
          fill: false,
        },
      ]);

      console.log('Datasets:', datasets);

      if (datasets.length > 0) {
        const newChartData = { labels: rounds, datasets };
        const newChartOptions = {
          scales: { y: { beginAtZero: true, max: 1 } },
          plugins: {
            title: {
              display: true,
              text: [
                'Federated vs Centralized Learning Metrics',
                `(Dataset: ${datasetName}, Rounds: ${numRounds}, Clients: ${numClients})`,
              ],
            },
            legend: {
              display: false,
              position: 'bottom',
            },
            tooltip: { enabled: true },
          },
        };

        console.log('Setting new chart data:', newChartData);
        console.log('Setting new chart options:', newChartOptions);

        setChartData(newChartData);
        setChartOptions(newChartOptions);
      } else {
        console.warn('No valid metrics found in the results');
        setChartData(null);
        setChartOptions(null);
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
            legend: { display: false, position: 'top' },
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

        if (
          lastResult.roc_curve_data.fpr &&
          lastResult.roc_curve_data.tpr
        ) {
          // Binary classification
          rocData.datasets.push({
            label: 'ROC Curve',
            data: lastResult.roc_curve_data.fpr.map((fpr, index) => ({
              x: fpr,
              y: lastResult.roc_curve_data.tpr[index],
            })),
            borderColor: ' rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
          });
          rocOptions.plugins.title = {
            display: true,
            text: 'ROC Curve',
          };
        } else {
          // Multi-class classification
          const colorPalette = [
            '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
            '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
            '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
            '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080',
          ];
          Object.entries(lastResult.roc_curve_data).forEach(
            ([classLabel, classData], index) => {
              rocData.datasets.push({
                label: `Class ${classLabel}`,
                data: classData.fpr.map((fpr, i) => ({
                  x: fpr,
                  y: classData.tpr[i],
                })),
                borderColor: colorPalette[index % colorPalette.length],
                backgroundColor: `${colorPalette[index % colorPalette.length]}33`,
                pointRadius: 0,
                tension: 0.4,
              });
            }
          );
          rocOptions.plugins.title = {
            display: true,
            text: [
              'ROC Curves per Class',
              `(Dataset: ${datasetName}, Rounds: ${numRounds}, Clients: ${numClients})`,
            ],
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
    case 'datasetName':
      setDatasetName(value);
      break;
    case 'numRounds':
      setNumRounds(value);
      break;
    case 'numClients':
      setNumClients(value);
      break;
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
}, []);

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

    {/* Secondo header con il titolo del dashboard */}
    <header style={{
      background: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '10px 0',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
          color: '#333',
          fontWeight: '600',
          letterSpacing: '-0.5px',
          textAlign: 'center'
        }}>
          Federated Learning Dashboard 🤖📊
        </h2>
        <InfoBox 
          infoFile="dashboard-info"
        />
      </div>
    </header>

    {/* Sezione per i dataset */}
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



{/* Advanced Configuration Section */}
<div style={{ 
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 2rem',
  marginBottom: '100px'
}}>
  {/* Header Section */}
  <div style={{
    marginTop: '2rem',
    marginBottom: '2rem',
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
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  }}>
    {/* Client Heterogeneity Card */}
    <div style={{ 
      flex: '1 1 500px',
      minWidth: '500px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      padding: '1.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{
          margin: 0,
          color: '#444',
          fontSize: '1.2rem',
          fontWeight: '500'
        }}>
          Client Heterogeneity Configuration
        </h4>
        <InfoBox 
          title="Informazioni sulla Configurazione dell'Eterogeneità dei Client" 
          infoFile="client-heterogeneity-info"
        />
      </div>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        <ClientHeterogeneityConfig 
          clientTypeConfig={clientTypeConfig}
          setExperimentConfig={handleExperimentConfigUpdate}
          style={{
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}
        />
      </div>
    </div>

    {/* Client Dynamism Card */}
    <div style={{ 
      flex: '1 1 500px',
      minWidth: '500px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      padding: '1.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{
          margin: 0,
          color: '#444',
          fontSize: '1.2rem',
          fontWeight: '500'
        }}>
          Client Dynamism Configuration
        </h4>
        <InfoBox 
          title="Informazioni sul Dinamismo dei Client" 
          infoFile="client-dynamism-info"
        />
      </div>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        <ClientDynamismConfig 
          clientDynamismConfig={clientDynamismConfig}
          setExperimentConfig={handleExperimentConfigUpdate}
          style={{
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}
        />
      </div>
    </div>
  </div>
</div>




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
    marginBottom: '2rem',
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
        Global Node Distribution
      </h4>
      <div style={{ 
        height: '500px',  // Aumentata l'altezza
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <GlobeVisualization 
          nodes={nodes}
          options={{
            globeBackgroundColor: '#f1f1f1',
            globeGlowColor: 'lightblue',
            markerColor: '#3498db',
            markerGlowColor: '#2980b9'
          }}
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
          style={{
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}
        />
      </div>
    </div>
  </div>
</div>




    {/* Experiment Controls */}
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '20px'
    }}>
      <button
        onClick={handleStartExperiment}
        disabled={isTraining}
        style={{
          padding: '12px 24px',
          backgroundColor: isTraining ? '#ccc' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isTraining ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
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
  </div>
</div>



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
    {/* Main chart for federated vs centralized learning metrics */}
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
      {chartData && chartOptions && (
        <ChartMetrics 
          data={chartData} 
          options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
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
              data={confusionMatrixData}
              options={{
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
          <ImageComparison datasetName={datasetName} />
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

          {/* Client Participation */}
          <div style={{ marginBottom: '100px', textAlign: 'center' }}>
            <h3>Client Participation</h3>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              marginBottom: '1rem',
              textAlign: 'center' 
            }}>
              Dataset: {datasetName} | Rounds: {numRounds} | Clients: {numClients}
            </div>
            {clientParticipationData && clientParticipationOptions && (
              <ClientParticipationChart
                data={clientParticipationData}
                options={{
                  ...clientParticipationOptions,
                  plugins: {
                    ...clientParticipationOptions.plugins,
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

          {/* Client Training Times */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h3>Client Training Times</h3>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              marginBottom: '1rem',
              textAlign: 'center' 
            }}>
              Dataset: {datasetName} | Rounds: {numRounds} | Clients: {numClients}
            </div>
            {trainingTimesData && trainingTimesOptions && (
              <ClientTrainingTimesChart
                data={trainingTimesData}
                options={{
                  ...trainingTimesOptions,
                  plugins: {
                    ...trainingTimesOptions.plugins,
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


       </>
     ) : (
       <p>
         No results available. The experiment might still be in progress
         or hasn't started yet.
       </p>
     )}
   </div>
)}
export default App;