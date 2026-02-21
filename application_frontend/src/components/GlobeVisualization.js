import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

const clientTypeColors = {
  strong: '#FF0000', // Red
  medium: '#00FF00', // Green
  weak: '#0000FF',   // Blue
};

const dynamismTypeSizes = {
  fast: 6,
  normal: 4,
  slow: 2,
};

const GlobeVisualization = ({ nodes }) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return <div>No nodes to display.</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <ComposableMap
        projectionConfig={{
          scale: 150,
        }}
        style={{
          width: "100%",
          height: "100%"
        }}
      >
        <ZoomableGroup>
          <Geographies geography="/world-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#E0E0E0"
                  stroke="#FFFFFF"
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#F53', outline: 'none' },
                    pressed: { fill: '#E42', outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          {nodes.map((node, index) => {
            const markerColor = clientTypeColors[node.client_type] || '#888888';
            const markerSize = dynamismTypeSizes[node.dynamism_type] || 3;

            return (
              <Marker
                key={index}
                coordinates={[node.longitude, node.latitude]}
                onClick={() => console.log(`Node ${node.city} clicked`)}
              >
                <circle r={markerSize} fill={markerColor} />
                <text
                  textAnchor="middle"
                  y={-10}
                  style={{
                    fontFamily: 'system-ui',
                    fill: '#5D5A6D',
                    fontSize: '8px',
                  }}
                >
                  {node.city}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legenda riposizionata e ridisegnata */}
      <div 
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '30px',
          zIndex: 1000
        }}
      >
        {/* Heterogeneity Client */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            Heterogeneity Client
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(clientTypeColors).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <div 
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    flexShrink: 0
                  }}
                />
                <span style={{ fontSize: '14px' }}>{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamism Client */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            Dynamism Client
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(dynamismTypeSizes).map(([type, size]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <svg width="16" height="16" style={{ flexShrink: 0 }}>
                  <circle cx="8" cy="8" r={size} fill="#888888" />
                </svg>
                <span style={{ fontSize: '14px' }}>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobeVisualization;