import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ data, metrics }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={metric}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
        >
          <h3 className="text-lg font-semibold mb-2">{metric}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <XAxis dataKey="round" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={metric} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Dashboard;