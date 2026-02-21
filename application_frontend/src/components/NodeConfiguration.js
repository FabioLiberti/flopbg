// src/components/NodeConfiguration.js

import React, { useState, useEffect } from 'react';

const NodeConfiguration = ({ nodes: initialNodes, clientTypes, clientDynamism, onNodesUpdate }) => {
  const [nodes, setNodes] = useState(initialNodes || []);

  // Aggiorna lo stato locale dei nodi quando initialNodes cambia
  useEffect(() => {
    setNodes(initialNodes || []);
  }, [initialNodes]);

  const handleNodeChange = (index, key, value) => {
    const updatedNodes = [...nodes];
    updatedNodes[index][key] = value;
    setNodes(updatedNodes);
    onNodesUpdate(updatedNodes); // Notifica al genitore le modifiche
  };

  const addNode = () => {
    const newNode = {
      id: nodes.length + 1,
      name: `Node ${nodes.length + 1}`,
      latitude: 0.0,
      longitude: 0.0,
      client_type: '',
      dynamism_type: '',
    };
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    onNodesUpdate(updatedNodes); // Notifica al genitore le modifiche
  };

  const removeNode = (index) => {
    const updatedNodes = nodes.filter((_, i) => i !== index);
    setNodes(updatedNodes);
    onNodesUpdate(updatedNodes); // Notifica al genitore le modifiche
  };

  const saveNodes = async () => {
    console.log('Nodes being sent:', nodes);
    try {
      const response = await fetch('http://localhost:3000/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: nodes }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error saving nodes: ${errorText}`);
      }

      alert('Nodes saved successfully.');
    } catch (error) {
      console.error('Error saving nodes:', error);
    }
  };

  return (
    <div>
      <h2>Node Configuration</h2>
      <button onClick={addNode}>Add Node</button>
      {nodes.map((node, index) => (
        <div
          key={node.id}
          style={{
            border: '1px solid black',
            padding: '10px',
            marginBottom: '10px',
          }}
        >
          <h4>{node.name}</h4>
          <label>
            Name:
            <input
              type="text"
              value={node.name}
              onChange={(e) => handleNodeChange(index, 'name', e.target.value)}
            />
          </label>
          <br />
          <label>
            City:
            <input
              type="text"
              value={node.city}
              onChange={(e) =>
                handleNodeChange(index, 'city', e.target.value)}
            />  
          </label> 
          <br />
          <label>     
            Latitude:
            <input
              type="number"
              value={node.latitude}
              onChange={(e) =>
                handleNodeChange(index, 'latitude', parseFloat(e.target.value))
              }
              step="0.0001"
            />
          </label>
          <br />
          <label>
            Longitude:
            <input
              type="number"
              value={node.longitude}
              onChange={(e) =>
                handleNodeChange(index, 'longitude', parseFloat(e.target.value))
              }
              step="0.0001"
            />
          </label>
          <br />
          <label>
            Client Type:
            <select
              value={node.client_type}
              onChange={(e) =>
                handleNodeChange(index, 'client_type', e.target.value)
              }
            >
              <option value="">Select Client Type</option>
              {clientTypes &&
                Object.keys(clientTypes).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
            </select>
          </label>
          <br />
          <label>
            Dynamism Type:
            <select
              value={node.dynamism_type}
              onChange={(e) =>
                handleNodeChange(index, 'dynamism_type', e.target.value)
              }
            >
              <option value="">Select Dynamism Type</option>
              {clientDynamism &&
                Object.keys(clientDynamism).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
            </select>
          </label>
          <br />
          <button onClick={() => removeNode(index)}>Remove Node</button>
        </div>
      ))}
      <button onClick={saveNodes}>Save Nodes</button>
    </div>
  );
};

export default NodeConfiguration;
