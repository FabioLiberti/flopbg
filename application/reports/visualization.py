# reports/visualization.py

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Any
from matplotlib.figure import Figure
from matplotlib.colors import LinearSegmentedColormap

class FLVisualization:
    def __init__(self, style: str = 'seaborn'):
        """
        Inizializza il visualizzatore con uno stile specifico
        """
        plt.style.use(style)
        self.default_figsize = (12, 6)
        self.colors = {
            'federated': '#2ecc71',
            'centralized': '#e74c3c',
            'grid': '#ecf0f1',
            'background': '#ffffff'
        }

    def setup_plot(self, figsize=None) -> None:
        """Configura il plot con le impostazioni base"""
        plt.figure(figsize=figsize or self.default_figsize)
        plt.grid(True, linestyle='--', alpha=0.7)
        
    def plot_training_metrics(self, metrics: Dict[str, List[float]], title: str, save_path: str) -> None:
        """
        Plotta le metriche di training (accuracy, loss, etc.)
        """
        self.setup_plot()
        
        rounds = range(1, len(next(iter(metrics.values()))) + 1)
        for metric_name, values in metrics.items():
            plt.plot(rounds, values, label=metric_name, marker='o', markersize=4)
            
        plt.xlabel('Rounds')
        plt.ylabel('Value')
        plt.title(title)
        plt.legend()
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()

    def plot_client_participation(self, participation_data: Dict[int, List[int]], save_path: str) -> None:
        """
        Crea heatmap della partecipazione dei client
        """
        plt.figure(figsize=(15, 8))
        data = pd.DataFrame(participation_data).T
        
        sns.heatmap(
            data,
            cmap='YlOrRd',
            cbar_kws={'label': 'Participation'},
            xticklabels=5,  # Mostra ogni 5 round
            yticklabels=2   # Mostra ogni 2 client
        )
        
        plt.title('Client Participation Across Rounds')
        plt.xlabel('Rounds')
        plt.ylabel('Client ID')
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()

    def plot_training_times(self, training_times: Dict[int, List[float]], save_path: str) -> None:
        """
        Visualizza i tempi di training per client
        """
        self.setup_plot()
        
        data = []
        client_ids = []
        for client_id, times in training_times.items():
            data.extend(times)
            client_ids.extend([f'Client {client_id}'] * len(times))
            
        df = pd.DataFrame({'Client': client_ids, 'Training Time': data})
        
        sns.boxplot(x='Client', y='Training Time', data=df)
        plt.xticks(rotation=45)
        plt.title('Training Times Distribution by Client')
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()

    def plot_performance_comparison(self, 
                                  federated_metrics: Dict[str, List[float]],
                                  centralized_metrics: Dict[str, float],
                                  save_path: str) -> None:
        """
        Confronta le performance tra approccio federato e centralizzato
        """
        metrics_to_plot = ['accuracy', 'loss', 'f1_score']
        fig, axes = plt.subplots(len(metrics_to_plot), 1, figsize=(12, 4*len(metrics_to_plot)))
        
        for idx, metric in enumerate(metrics_to_plot):
            ax = axes[idx]
            rounds = range(1, len(federated_metrics[metric]) + 1)
            
            # Plot federated
            ax.plot(rounds, federated_metrics[metric], 
                   label='Federated', color=self.colors['federated'], marker='o')
            
            # Plot centralized reference line
            ax.axhline(y=centralized_metrics[metric], color=self.colors['centralized'],
                      linestyle='--', label='Centralized')
            
            ax.set_title(f'{metric.capitalize()} Comparison')
            ax.set_xlabel('Rounds')
            ax.set_ylabel(metric.capitalize())
            ax.grid(True, linestyle='--', alpha=0.7)
            ax.legend()
            
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()

    def plot_client_data_distribution(self, 
                                    client_data: Dict[int, Dict[str, int]], 
                                    save_path: str) -> None:
        """
        Visualizza la distribuzione dei dati tra i client
        """
        plt.figure(figsize=(15, 8))
        
        data = []
        labels = []
        client_ids = []
        
        for client_id, class_dist in client_data.items():
            for label, count in class_dist.items():
                data.append(count)
                labels.append(str(label))
                client_ids.append(f'Client {client_id}')
                
        df = pd.DataFrame({
            'Client': client_ids,
            'Class': labels,
            'Count': data
        })
        
        sns.barplot(x='Client', y='Count', hue='Class', data=df)
        plt.title('Data Distribution Across Clients')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()

    def create_summary_dashboard(self, 
                               all_metrics: Dict[str, Any], 
                               save_path: str) -> None:
        """
        Crea un dashboard riassuntivo con tutte le metriche principali
        """
        fig = plt.figure(figsize=(20, 15))
        gs = fig.add_gridspec(3, 2)
        
        # Accuracy plot
        ax1 = fig.add_subplot(gs[0, 0])
        self._plot_metric_in_dashboard(ax1, all_metrics['accuracy'], 'Accuracy')
        
        # Loss plot
        ax2 = fig.add_subplot(gs[0, 1])
        self._plot_metric_in_dashboard(ax2, all_metrics['loss'], 'Loss')
        
        # Client participation heatmap
        ax3 = fig.add_subplot(gs[1, :])
        self._plot_participation_in_dashboard(ax3, all_metrics['client_participation'])
        
        # Training times
        ax4 = fig.add_subplot(gs[2, 0])
        self._plot_training_times_in_dashboard(ax4, all_metrics['training_times'])
        
        # Performance summary
        ax5 = fig.add_subplot(gs[2, 1])
        self._plot_performance_summary_in_dashboard(ax5, all_metrics)
        
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()

    def _plot_metric_in_dashboard(self, ax: plt.Axes, metric_data: Dict[str, List[float]], title: str) -> None:
        """Helper per plottare metriche nel dashboard"""
        rounds = range(1, len(metric_data['federated']) + 1)
        ax.plot(rounds, metric_data['federated'], label='Federated', color=self.colors['federated'])
        ax.axhline(y=metric_data['centralized'], color=self.colors['centralized'],
                  linestyle='--', label='Centralized')
        ax.set_title(title)
        ax.set_xlabel('Rounds')
        ax.set_ylabel(title)
        ax.legend()
        ax.grid(True, alpha=0.3)

    @staticmethod
    def save_plots_to_pdf(plots: List[Figure], save_path: str) -> None:
        """
        Salva una serie di plot in un unico PDF
        """
        from matplotlib.backends.backend_pdf import PdfPages
        
        with PdfPages(save_path) as pdf:
            for plot in plots:
                pdf.savefig(plot)

    def export_metrics_to_csv(self, metrics: Dict[str, Any], save_path: str) -> None:
        """
        Esporta le metriche in formato CSV
        """
        df = pd.DataFrame(metrics)
        df.to_csv(save_path, index=False)