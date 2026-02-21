// src/hooks/useProcessResults.js

import { useEffect } from 'react';

function useProcessResults(
  results,
  clientParticipation,
  clientDataDistribution,
  clientTrainingTimes,
  datasetName,
  numRounds,
  numClients,
  setCentralizedResult,
  setFederatedResults,
  setChartData,
  setChartOptions,
  setRocChartData,
  setRocChartOptions,
  setConfusionMatrixData,
  setConfusionMatrixOptions,
  setClientParticipationData,
  setClientParticipationOptions,
  setClientSampleCounts,
  setClientSampleCountsOptions,
  setTrainingTimesData,
  setTrainingTimesOptions
) {
  useEffect(() => {
    // Logica per elaborare i risultati e preparare i dati per i grafici
    // (Il codice rimane lo stesso, ma è stato spostato qui)
  }, [
    results,
    clientParticipation,
    clientDataDistribution,
    clientTrainingTimes,
    datasetName,
    numRounds,
    numClients,
  ]);
}

export default useProcessResults;
