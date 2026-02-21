// src/components/ClientTrainingTimesChart.js

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

const ClientTrainingTimesChart = ({ data: trainingTimesData, options: trainingTimesOptions }) => {
  console.log('ClientTrainingTimesChart received:', { trainingTimesData, trainingTimesOptions });

  if (!trainingTimesData || !trainingTimesData.datasets || trainingTimesData.datasets.length === 0) {
    console.warn('No Client Training Times data available');
    return <p>No Client Training Times data available.</p>;
  }

  const updatedOptions = {
    ...trainingTimesOptions,
    plugins: {
      ...trainingTimesOptions.plugins,
      legend: {
        ...trainingTimesOptions.plugins.legend,
        display: false,  // Nasconde la legenda
      },
    },
  };

  return (
    <div>
      <h3>Client Training Times</h3>
      <Bar data={trainingTimesData} options={updatedOptions} />
    </div>
  );
};

export default ClientTrainingTimesChart;