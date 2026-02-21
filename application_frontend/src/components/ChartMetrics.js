// src/components/ChartMetrics.js

import React from 'react';
import { Line } from 'react-chartjs-2';

const ChartMetrics = ({ data: chartData, options: chartOptions }) => {
  console.log('ChartMetrics received:', { chartData, chartOptions });

  if (!chartData || !chartOptions) {
    console.warn('ChartMetrics: chartData or chartOptions is undefined');
    return <p>No data available for Federated vs Centralized Learning Metrics.</p>;
  }

  if (!chartData.datasets || chartData.datasets.length === 0) {
    console.warn('ChartMetrics: No datasets available in chartData');
    return <p>No datasets available for Federated vs Centralized Learning Metrics.</p>;
  }

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default ChartMetrics;