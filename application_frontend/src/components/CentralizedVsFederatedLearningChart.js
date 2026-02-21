// src/components/CentralizedVsFederatedLearningChart.js

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Title, Legend, Tooltip } from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Legend, Tooltip);

const CentralizedVsFederatedLearningChart = ({ datasets, centralizedData, federatedData, federatedDataStd, chartOptions }) => {
  console.log('CentralizedVsFederatedLearningChart received:', { datasets, centralizedData, federatedData, federatedDataStd, chartOptions });

  const data = {
    labels: datasets,
    datasets: [
      {
        label: 'Centralized',
        data: centralizedData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Federated',
        data: federatedData,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const updatedOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        display: true,  // Nasconde la legenda
      },
    },
  };

  return <Line data={data} options={updatedOptions} />;
};

export default CentralizedVsFederatedLearningChart;
