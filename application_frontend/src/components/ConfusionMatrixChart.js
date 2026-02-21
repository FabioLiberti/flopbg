// src/components/ConfusionMatrixChart.js

import React from 'react';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const ConfusionMatrixChart = ({ confusionMatrixData, confusionMatrixOptions }) => {
  if (!confusionMatrixData || !confusionMatrixOptions) {
    console.warn('Confusion Matrix data or options are missing');
    return <p>No Confusion Matrix data available.</p>;
  }

  if (!confusionMatrixData.datasets || confusionMatrixData.datasets.length === 0) {
    console.warn('Confusion Matrix datasets are empty');
    return <p>Confusion Matrix data is incomplete. Please check the data structure.</p>;
  }

  // Funzione per generare colori differenziati
  const generateColors = (numClasses) => {
    const colors = [];
    for (let i = 0; i < numClasses; i++) {
      const hue = (i * 360) / numClasses;
      colors.push(`hsla(${hue}, 70%, 60%, 0.6)`);
    }
    return colors;
  };

  // Modifica i dati per includere colori differenziati
  const modifiedData = {
    ...confusionMatrixData,
    datasets: confusionMatrixData.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: generateColors(confusionMatrixData.labels.length)[index],
    })),
  };



  // Modifica le opzioni per migliorare la visualizzazione
  const modifiedOptions = {
    ...confusionMatrixOptions,
    plugins: {
      ...confusionMatrixOptions.plugins,
      tooltip: {
        callbacks: {
          title: (context) => {
            const dataIndex = context[0].dataIndex;
            const datasetIndex = context[0].datasetIndex;
            return `Actual: ${confusionMatrixData.datasets[datasetIndex].label}, Predicted: Class ${dataIndex}`;
          },
          label: (context) => {
            const value = context.parsed.y;
            return `Count: ${value}`;
          },
        },
      },
      legend: {
        display: false, // Nascondi la legenda se non necessaria
      },
      datalabels: {
        display: false, // Rimuove le etichette dei dati statici
      },
    },
    scales: {
      ...confusionMatrixOptions.scales,
      x: {
        ...confusionMatrixOptions.scales.x,
        title: {
          display: true,
          text: 'Predicted Class',
        },
      },
      y: {
        ...confusionMatrixOptions.scales.y,
        title: {
          display: true,
          text: 'Actual Class',
        },
      },
    },
  };

  // Funzione per generare la matrice di confusione classica
  const generateClassicConfusionMatrix = () => {
    const matrix = confusionMatrixData.datasets.map(dataset => dataset.data);
    const labels = confusionMatrixData.labels;
    const maxValue = Math.max(...matrix.flat());

    return (
      <div style={{ marginTop: '20px', marginBottom: '20px', position: 'relative' }}>
        <h4>Classic Confusion Matrix</h4>
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            left: '-40px', 
            top: '50%', 
            transform: 'translateY(-50%) rotate(-90deg)', 
            transformOrigin: 'center',
            whiteSpace: 'nowrap'
          }}>
            Actual
          </div>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th></th>
                {labels.map((label, index) => (
                  <th key={index} style={{ padding: '5px', textAlign: 'center' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <th style={{ padding: '5px', textAlign: 'right' }}>{labels[i]}</th>
                  {row.map((cell, j) => {
                    const intensity = maxValue > 0 ? cell / maxValue : 0;
                    const backgroundColor = `rgba(255, 0, 0, ${intensity})`;
                    return (
                      <td
                        key={j}
                        style={{
                          width: '50px',
                          height: '50px',
                          border: '1px solid black',
                          textAlign: 'center',
                          backgroundColor,
                          color: intensity > 0.5 ? 'white' : 'black',
                        }}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span>Predicted</span>
        </div>
      </div>
    );
  };



  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left: Bar Chart */}
        <div style={{ flex: '1 1 50%', minWidth: '400px' }}>
          <h4 style={{ textAlign: 'center', marginTop: 0 }}>Confusion Matrix</h4>
          <Bar
            data={modifiedData}
            options={modifiedOptions}
            plugins={[ChartDataLabels]}
          />
        </div>
        {/* Right: Classic Heatmap Table */}
        <div style={{ flex: '1 1 40%', minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
          {generateClassicConfusionMatrix()}
        </div>
      </div>
    </div>
  );
};

export default ConfusionMatrixChart;