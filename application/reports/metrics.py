# reports/metrics.py

import numpy as np
from typing import Dict, List, Tuple, Any
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc
)

class FLMetricsCalculator:
    def __init__(self):
        """
        Inizializza il calcolatore di metriche
        """
        self.metrics_history = {
            'accuracy': [],
            'loss': [],
            'precision': [],
            'recall': [],
            'f1_score': [],
            'auc_roc': []
        }

    def calculate_round_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, 
                              loss: float) -> Dict[str, float]:
        """
        Calcola le metriche per un round di training
        """
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'loss': loss,
            'precision': precision_score(y_true, y_pred, average='weighted'),
            'recall': recall_score(y_true, y_pred, average='weighted'),
            'f1_score': f1_score(y_true, y_pred, average='weighted')
        }
        
        # Calcola ROC AUC per problemi multiclasse
        if len(np.unique(y_true)) > 2:
            metrics['auc_roc'] = self._calculate_multiclass_roc_auc(y_true, y_pred)
        else:
            fpr, tpr, _ = roc_curve(y_true, y_pred)
            metrics['auc_roc'] = auc(fpr, tpr)

        # Aggiorna lo storico
        for metric_name, value in metrics.items():
            self.metrics_history[metric_name].append(value)

        return metrics

    def _calculate_multiclass_roc_auc(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """
        Calcola ROC AUC per classificazione multiclasse
        """
        n_classes = len(np.unique(y_true))
        fpr = dict()
        tpr = dict()
        roc_auc = dict()

        # Calcola ROC curve e ROC area per ogni classe
        for i in range(n_classes):
            y_true_binary = (y_true == i).astype(int)
            y_pred_binary = (y_pred == i).astype(int)
            fpr[i], tpr[i], _ = roc_curve(y_true_binary, y_pred_binary)
            roc_auc[i] = auc(fpr[i], tpr[i])

        # Aggrega i risultati
        return np.mean(list(roc_auc.values()))

    def get_metrics_summary(self) -> Dict[str, Dict[str, float]]:
        """
        Restituisce un riepilogo delle metriche
        """
        summary = {}
        for metric_name, values in self.metrics_history.items():
            summary[metric_name] = {
                'mean': np.mean(values),
                'std': np.std(values),
                'min': np.min(values),
                'max': np.max(values),
                'last': values[-1] if values else None
            }
        return summary

    def calculate_client_metrics(self, client_results: Dict[int, Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        """
        Calcola metriche specifiche per client
        """
        client_metrics = {}
        for client_id, results in client_results.items():
            client_metrics[client_id] = {
                'participation_rate': np.mean(results['participation']),
                'avg_training_time': np.mean(results['training_times']),
                'accuracy': np.mean(results['accuracy']),
                'loss': np.mean(results['loss'])
            }
        return client_metrics

    def compare_with_centralized(self, centralized_metrics: Dict[str, float]) -> Dict[str, float]:
        """
        Confronta le metriche federate con quelle centralizzate
        """
        comparison = {}
        for metric_name, values in self.metrics_history.items():
            if metric_name in centralized_metrics:
                final_value = values[-1] if values else 0
                centralized_value = centralized_metrics[metric_name]
                comparison[metric_name] = {
                    'difference': final_value - centralized_value,
                    'relative_improvement': (final_value - centralized_value) / centralized_value * 100
                }
        return comparison
    