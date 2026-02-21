// src/components/NodeConfiguration.js

import React, { useState, useEffect } from 'react';
import WORLD_CITIES, { getRandomCity, pickTypeForNewNode } from '../data/worldCities';

const clientTypeColors = {
  strong: '#e53935',
  medium: '#43a047',
  weak: '#1e88e5',
};

const NodeConfiguration = ({ nodes: initialNodes, clientTypes, clientDynamism, onNodesUpdate }) => {
  const [nodes, setNodes] = useState(initialNodes || []);

  useEffect(() => {
    setNodes(initialNodes || []);
  }, [initialNodes]);

  const handleNodeChange = (index, key, value) => {
    const updatedNodes = [...nodes];
    updatedNodes[index] = { ...updatedNodes[index], [key]: value };
    setNodes(updatedNodes);
    onNodesUpdate(updatedNodes);
  };

  const handleCityChange = (index, cityName) => {
    const cityData = WORLD_CITIES.find(c => c.city === cityName);
    if (cityData) {
      const updatedNodes = [...nodes];
      updatedNodes[index] = {
        ...updatedNodes[index],
        city: cityData.city,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
      };
      setNodes(updatedNodes);
      onNodesUpdate(updatedNodes);
    }
  };

  const addNode = () => {
    const existingCities = nodes.map(n => n.city);
    const randomCity = getRandomCity(existingCities);
    const bestClientType = clientTypes
      ? pickTypeForNewNode(nodes, clientTypes, 'client_type')
      : 'medium';
    const bestDynamism = clientDynamism
      ? pickTypeForNewNode(nodes, clientDynamism, 'dynamism_type')
      : 'normal';
    const newNode = {
      id: nodes.length + 1,
      name: `Node ${nodes.length + 1}`,
      city: randomCity.city,
      latitude: randomCity.latitude,
      longitude: randomCity.longitude,
      client_type: bestClientType,
      dynamism_type: bestDynamism,
    };
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    onNodesUpdate(updatedNodes);
  };

  const removeNode = (index) => {
    const updatedNodes = nodes.filter((_, i) => i !== index);
    setNodes(updatedNodes);
    onNodesUpdate(updatedNodes);
  };

  const saveNodes = async () => {
    try {
      const response = await fetch('http://localhost:5001/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error saving nodes: ${errorText}`);
      }

      alert('Nodes saved successfully.');
    } catch (error) {
      console.error('Error saving nodes:', error);
      alert('Error saving nodes.');
    }
  };

  const inputStyle = {
    padding: '4px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#555',
    marginBottom: '4px',
  };

  const selectStyle = {
    ...inputStyle,
    backgroundColor: '#fff',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#666' }}>{nodes.length} nodes</span>
        <button
          onClick={addNode}
          style={{
            padding: '6px 14px',
            backgroundColor: '#43a047',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          + Add Node
        </button>
      </div>

      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {nodes.map((node, index) => {
          const typeColor = clientTypeColors[node.client_type] || '#ccc';
          return (
            <div
              key={node.id || index}
              style={{
                border: '1px solid #e0e0e0',
                borderLeft: `4px solid ${typeColor}`,
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '8px',
                backgroundColor: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13px', color: '#333' }}>
                  #{node.id} {node.city || node.name}
                </strong>
                <button
                  onClick={() => removeNode(index)}
                  style={{
                    padding: '2px 8px',
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    border: '1px solid #ef9a9a',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <label style={labelStyle}>
                  Name
                  <input
                    type="text"
                    value={node.name || ''}
                    onChange={(e) => handleNodeChange(index, 'name', e.target.value)}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  City
                  <select
                    value={node.city || ''}
                    onChange={(e) => handleCityChange(index, e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">-- Select City --</option>
                    {WORLD_CITIES.map((c) => (
                      <option key={c.city} value={c.city}>{c.city}</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Lat
                  <input
                    type="number"
                    value={node.latitude}
                    readOnly
                    style={{ ...inputStyle, backgroundColor: '#f0f0f0', color: '#888' }}
                  />
                </label>
                <label style={labelStyle}>
                  Lng
                  <input
                    type="number"
                    value={node.longitude}
                    readOnly
                    style={{ ...inputStyle, backgroundColor: '#f0f0f0', color: '#888' }}
                  />
                </label>
                <label style={labelStyle}>
                  Client Type
                  <select
                    value={node.client_type || ''}
                    onChange={(e) => handleNodeChange(index, 'client_type', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">--</option>
                    {clientTypes &&
                      Object.keys(clientTypes).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Dynamism
                  <select
                    value={node.dynamism_type || ''}
                    onChange={(e) => handleNodeChange(index, 'dynamism_type', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">--</option>
                    {clientDynamism &&
                      Object.keys(clientDynamism).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '12px', textAlign: 'right' }}>
        <button
          onClick={saveNodes}
          style={{
            padding: '8px 20px',
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Save Nodes
        </button>
      </div>
    </div>
  );
};

export default NodeConfiguration;
