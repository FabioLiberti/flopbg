// src/components/ComparisonChart.js

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ComparisonChart = ({ chartData, chartOptions }) => {
  console.log('ComparisonChart received:', { chartData, chartOptions });

  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    console.warn('No comparison chart data available');
    return <p>No data available for Centralized vs Federated Learning Metrics comparison.</p>;
  }

  return (
    <div>
      <h3>Centralized vs Federated Learning Metrics</h3>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default ComparisonChart;
