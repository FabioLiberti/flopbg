// src/components/DatasetSelection.js

import React from 'react';

function DatasetSelection({
  datasetsGenerici = [],
  datasetsClinici = [],
  datasetName,
  setDatasetName,
}) {
  const isLoading =
    (!datasetsGenerici || datasetsGenerici.length === 0) &&
    (!datasetsClinici || datasetsClinici.length === 0);

  return (
    <div>
      <h3>Seleziona Dataset</h3>
      {isLoading ? (
        <span>Caricamento dei dataset...</span>
      ) : (
        <label>
          Nome del Dataset:
          <select
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
          >
            {datasetsGenerici.length > 0 && (
              <optgroup label="Generici">
                {datasetsGenerici.map((dataset) => (
                  <option key={dataset.name} value={dataset.name}>
                    {dataset.display_name}
                  </option>
                ))}
              </optgroup>
            )}
            {datasetsClinici.length > 0 && (
              <optgroup label="Clinici">
                {datasetsClinici.map((dataset) => (
                  <option key={dataset.name} value={dataset.name}>
                    {dataset.display_name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      )}
    </div>
  );
}

export default DatasetSelection;

