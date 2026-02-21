// src/components/ClientParticipationChart.js

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

const ClientParticipationChart = ({ data: clientParticipationData, options: clientParticipationOptions }) => {
  console.log('ClientParticipationChart received:', { clientParticipationData, clientParticipationOptions });

  if (!clientParticipationData || !clientParticipationData.datasets || clientParticipationData.datasets.length === 0) {
    console.warn('No Client Participation data available');
    return <p>No Client Participation data available.</p>;
  }

  const updatedOptions = {
    ...clientParticipationOptions,
    plugins: {
      ...clientParticipationOptions.plugins,
      legend: {
        ...clientParticipationOptions.plugins.legend,
        display: false,  // Nasconde la legenda
      },
    },
  };

  return (
    <div>
      <h3>Client Participation</h3>
      <Bar data={clientParticipationData} options={updatedOptions} />
    </div>
  );
};

export default ClientParticipationChart;