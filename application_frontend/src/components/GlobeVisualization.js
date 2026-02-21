import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

const clientTypeColors = {
  strong: '#e53935',
  medium: '#43a047',
  weak: '#1e88e5',
};

const dynamismTypeSizes = {
  fast: 7,
  normal: 5,
  slow: 3,
};

const GlobeVisualization = ({ nodes }) => {
  const [tooltip, setTooltip] = useState(null);

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#999', fontSize: '1rem'
      }}>
        No nodes to display.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', backgroundColor: '#d4e9f7' }}>
      <ComposableMap
        projectionConfig={{
          scale: 160,
          center: [10, 20],
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <ZoomableGroup>
          <Geographies geography="/countries-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e8e8e8"
                  stroke="#b0b0b0"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#d0d0d0', outline: 'none' },
                    pressed: { fill: '#c0c0c0', outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          {nodes.map((node, index) => {
            const markerColor = clientTypeColors[node.client_type] || '#888888';
            const markerSize = dynamismTypeSizes[node.dynamism_type] || 4;

            return (
              <Marker
                key={index}
                coordinates={[node.longitude, node.latitude]}
                onMouseEnter={() => setTooltip(node)}
                onMouseLeave={() => setTooltip(null)}
              >
                <circle
                  r={markerSize}
                  fill={markerColor}
                  fillOpacity={0.85}
                  stroke="#fff"
                  strokeWidth={1}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: '10px 14px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '13px',
            lineHeight: '1.6',
            zIndex: 1001,
            pointerEvents: 'none',
            minWidth: '160px',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            {tooltip.city || tooltip.name}
          </div>
          <div>
            <span style={{ color: '#666' }}>Type: </span>
            <span style={{
              color: clientTypeColors[tooltip.client_type] || '#888',
              fontWeight: '600'
            }}>
              {tooltip.client_type || '--'}
            </span>
          </div>
          <div>
            <span style={{ color: '#666' }}>Dynamism: </span>
            <span style={{ fontWeight: '600' }}>{tooltip.dynamism_type || '--'}</span>
          </div>
          <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
            {tooltip.latitude?.toFixed(2)}, {tooltip.longitude?.toFixed(2)}
          </div>
        </div>
      )}

      {/* Legenda */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(255,255,255,0.93)',
          padding: '10px 14px',
          borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          display: 'flex',
          gap: '24px',
          zIndex: 1000,
          fontSize: '12px',
        }}
      >
        {/* Heterogeneity Client */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px' }}>
            Client Type
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.entries(clientTypeColors).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    flexShrink: 0
                  }}
                />
                <span>{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamism Client */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px' }}>
            Dynamism
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.entries(dynamismTypeSizes).map(([type, size]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <svg width="14" height="14" style={{ flexShrink: 0 }}>
                  <circle cx="7" cy="7" r={size} fill="#888888" />
                </svg>
                <span>{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conteggio nodi */}
        <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontStyle: 'italic' }}>
          {nodes.length} nodes
        </div>
      </div>
    </div>
  );
};

export default GlobeVisualization;
