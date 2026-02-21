// src/components/ROCChart.js

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Legend, Tooltip } from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Legend, Tooltip);

const ROCChart = ({ data: rocChartData, options: rocChartOptions }) => {
  console.log('ROCChart received:', { rocChartData, rocChartOptions });

  if (!rocChartData || !rocChartData.datasets || rocChartData.datasets.length === 0) {
    console.warn('No ROC Curve data available');
    return <p>No ROC Curve data available.</p>;
  }

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'False Positive Rate'
        },
        min: 0,
        max: 1
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'True Positive Rate'
        },
        min: 0,
        max: 1
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: rocChartData.datasets.length > 1 ? 'ROC Curves per Class' : 'ROC Curve'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const fpr = context.parsed.x.toFixed(4);
            const tpr = context.parsed.y.toFixed(4);
            return `${label}: TPR: ${tpr}, FPR: ${fpr}`;
          }
        }
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...rocChartOptions };

  // Funzione per calcolare l'AUC-ROC
  const calculateAUC = (data) => {
    let auc = 0;
    for (let i = 1; i < data.length; i++) {
      auc += (data[i].x - data[i-1].x) * (data[i].y + data[i-1].y) / 2;
    }
    return auc;
  };

  // Funzione per trovare il miglior threshold
  const findBestThreshold = (data) => {
    return data.reduce((best, point) => {
      const distance = Math.sqrt(Math.pow(1 - point.x, 2) + Math.pow(1 - point.y, 2));
      return distance < best.distance ? { threshold: point.x, distance } : best;
    }, { threshold: 0, distance: Infinity }).threshold;
  };

  // Funzione per generare la tabella dei risultati
  const generateResultsTable = () => {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Class</th>
            <th style={tableHeaderStyle}>AUC-ROC</th>
            <th style={tableHeaderStyle}>Best Threshold</th>
          </tr>
        </thead>
        <tbody>
          {rocChartData.datasets.map((dataset, index) => {
            const auc = calculateAUC(dataset.data);
            const bestThreshold = findBestThreshold(dataset.data);
            
            return (
              <tr key={index}>
                <td style={tableCellStyle}>{dataset.label}</td>
                <td style={tableCellStyle}>{auc.toFixed(4)}</td>
                <td style={tableCellStyle}>{bestThreshold.toFixed(4)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // Stili per la tabella
  const tableHeaderStyle = {
    backgroundColor: '#f2f2f2',
    padding: '10px',
    borderBottom: '1px solid #ddd',
    textAlign: 'left'
  };

  const tableCellStyle = {
    padding: '10px',
    borderBottom: '1px solid #ddd'
  };

  return (
    <div>
      <div style={{ height: '400px', width: '100%' }}>
        <Line data={rocChartData} options={mergedOptions} />
      </div>
      {generateResultsTable()}
    </div>
  );
};

export default ROCChart;