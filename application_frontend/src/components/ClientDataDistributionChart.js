// src/components/ClientDataDistributionChart.js

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ClientDataDistributionChart = ({ data: clientSampleCounts, options: clientSampleCountsOptions }) => {
  console.log('ClientDataDistributionChart received:', { clientSampleCounts, clientSampleCountsOptions });

  if (!clientSampleCounts || !clientSampleCounts.datasets || clientSampleCounts.datasets.length === 0) {
    console.warn('No Client Data Distribution data available');
    return <p>No Client Data Distribution data available.</p>;
  }

  const updatedOptions = {
    ...clientSampleCountsOptions,
    plugins: {
      ...clientSampleCountsOptions.plugins,
      legend: {
        ...clientSampleCountsOptions.plugins.legend,
        display: false,  // Nasconde la legenda
      },
    },
  };


  return (
    <div>
      <h3>Client Data Distribution</h3>
      <Bar data={clientSampleCounts} options={updatedOptions} />
    </div>
  );
};

export default ClientDataDistributionChart;