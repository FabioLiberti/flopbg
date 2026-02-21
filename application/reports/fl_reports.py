# ..application/reports/fl_reports.py

# reports/fl_reports.py

import os
import logging
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from typing import Dict, Any, List
from report_manager import ReportGenerator

class FederatedMetricsReport(ReportGenerator):
    """Report per le metriche di Federated Learning"""
    def __init__(self, schedule_time="00:00"):
        super().__init__("federated_metrics", schedule_time)
        
    def generate(self) -> str:
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_dir = os.path.join(self.execution_dir, "reports", "federated_metrics", timestamp)
            os.makedirs(report_dir, exist_ok=True)
            
            # Carica i risultati più recenti
            metrics_data = self._load_latest_metrics()
            if metrics_data:
                self._generate_metrics_plots(metrics_data, report_dir)
                self._save_metrics_summary(metrics_data, report_dir)
            
            return report_dir
            
        except Exception as e:
            logging.error(f"Errore nella generazione del report metriche federate: {str(e)}")
            raise
            
    def _load_latest_metrics(self) -> Dict:
        metrics_file = os.path.join(self.execution_dir, 'realtime_metrics.json')
        if os.path.exists(metrics_file):
            with open(metrics_file, 'r') as f:
                return json.load(f)
        return None
        
    def _generate_metrics_plots(self, metrics_data: Dict, report_dir: str):
        # Plot accuratezza
        plt.figure(figsize=(12, 6))
        plt.plot(metrics_data['rounds'], metrics_data['federated_accuracy'], 
                label='Federated', marker='o')
        plt.axhline(y=metrics_data['centralized_accuracy'][-1], 
                   color='r', linestyle='--', label='Centralized')
        plt.title('Accuracy Comparison')
        plt.xlabel('Rounds')
        plt.ylabel('Accuracy')
        plt.legend()
        plt.grid(True)
        plt.savefig(os.path.join(report_dir, 'accuracy_comparison.png'))
        plt.close()
        
        # Plot loss
        plt.figure(figsize=(12, 6))
        plt.plot(metrics_data['rounds'], metrics_data['federated_loss'], 
                label='Federated', marker='o')
        plt.axhline(y=metrics_data['centralized_loss'][-1], 
                   color='r', linestyle='--', label='Centralized')
        plt.title('Loss Comparison')
        plt.xlabel('Rounds')
        plt.ylabel('Loss')
        plt.legend()
        plt.grid(True)
        plt.savefig(os.path.join(report_dir, 'loss_comparison.png'))
        plt.close()
        
    def _save_metrics_summary(self, metrics_data: Dict, report_dir: str):
        summary = {
            'final_federated_accuracy': metrics_data['federated_accuracy'][-1],
            'final_federated_loss': metrics_data['federated_loss'][-1],
            'centralized_accuracy': metrics_data['centralized_accuracy'][-1],
            'centralized_loss': metrics_data['centralized_loss'][-1],
            'total_rounds': len(metrics_data['rounds']),
            'improvement_over_centralized': (
                metrics_data['federated_accuracy'][-1] - 
                metrics_data['centralized_accuracy'][-1]
            )
        }
        
        with open(os.path.join(report_dir, 'metrics_summary.json'), 'w') as f:
            json.dump(summary, f, indent=4)

class ClientActivityReport(ReportGenerator):
    """Report per l'attività dei client"""
    def __init__(self, schedule_time="01:00"):
        super().__init__("client_activity", schedule_time)
        
    def generate(self) -> str:
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_dir = os.path.join(self.execution_dir, "reports", "client_activity", timestamp)
            os.makedirs(report_dir, exist_ok=True)
            
            client_data = self._load_client_data()
            if client_data:
                self._generate_participation_plots(client_data, report_dir)
                self._generate_training_time_plots(client_data, report_dir)
                self._save_client_statistics(client_data, report_dir)
            
            return report_dir
            
        except Exception as e:
            logging.error(f"Errore nella generazione del report attività client: {str(e)}")
            raise
            
    def _load_client_data(self) -> Dict:
        latest_results = os.path.join(self.execution_dir, 'latest_results.json')
        if os.path.exists(latest_results):
            with open(latest_results, 'r') as f:
                return json.load(f)
        return None
        
    def _generate_participation_plots(self, client_data: Dict, report_dir: str):
        participation_df = pd.DataFrame(client_data['client_participation'])
        
        # Heatmap partecipazione
        plt.figure(figsize=(15, 8))
        sns.heatmap(participation_df.T, cmap='YlOrRd', cbar_kws={'label': 'Participation'})
        plt.title('Client Participation Heatmap')
        plt.xlabel('Round')
        plt.ylabel('Client ID')
        plt.savefig(os.path.join(report_dir, 'participation_heatmap.png'))
        plt.close()
        
        # Grafico partecipazione media
        plt.figure(figsize=(12, 6))
        participation_df.mean().plot(kind='bar')
        plt.title('Average Client Participation')
        plt.xlabel('Client ID')
        plt.ylabel('Participation Rate')
        plt.tight_layout()
        plt.savefig(os.path.join(report_dir, 'average_participation.png'))
        plt.close()
        
    def _generate_training_time_plots(self, client_data: Dict, report_dir: str):
        training_times_df = pd.DataFrame(client_data['client_training_times'])
        
        # Box plot tempi di training
        plt.figure(figsize=(12, 6))
        training_times_df.boxplot()
        plt.title('Training Times Distribution')
        plt.xlabel('Client ID')
        plt.ylabel('Training Time (seconds)')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(os.path.join(report_dir, 'training_times_distribution.png'))
        plt.close()
        
    def _save_client_statistics(self, client_data: Dict, report_dir: str):
        stats = {
            'participation_rate': {
                client_id: sum(participations)/len(participations)
                for client_id, participations in client_data['client_participation'].items()
            },
            'average_training_time': {
                client_id: sum(times)/len(times) if times else 0
                for client_id, times in client_data['client_training_times'].items()
            }
        }
        
        with open(os.path.join(report_dir, 'client_statistics.json'), 'w') as f:
            json.dump(stats, f, indent=4)

def save_results_for_reports(results: Dict[str, Any], execution_dir: str):
    """Salva i risultati per i report"""
    try:
        # timestamp = datetime.now().strftime("%Y%m%d_%H%M")  
        results_file = os.path.join(execution_dir, "latest_results.json")
        logging.debug(f"Attempting to save results to: {results_file}")

        # Verifica directory
        os.makedirs(os.path.dirname(results_file), exist_ok=True)

        # Salva risultati
        with open(results_file, 'w') as f:
            json.dump(results, f)
        logging.debug(f"Results saved successfully to: {results_file}")
        
    except Exception as e:
        logging.error(f"Error saving results: {e}")
        logging.error(f"Results data: {results}")
        logging.error(f"Target directory: {execution_dir}")
        raise


def setup_fl_reports(report_manager, execution_dir: str):
    """Configura i report FL nel report manager"""
    try:
        logging.debug(f"Setting up FL reports in directory: {execution_dir}")
        
        # Verifica directory
        if not os.path.exists(execution_dir):
            logging.debug(f"Creating execution directory: {execution_dir}")
            os.makedirs(execution_dir, exist_ok=True)
        
        # Verifica permessi di scrittura
        test_file = os.path.join(execution_dir, 'test.txt')
        try:
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
            logging.debug("Write permissions verified successfully")
        except Exception as e:
            logging.error(f"Write permission test failed: {e}")
            raise
        
        federated_metrics = FederatedMetricsReport()
        client_activity = ClientActivityReport()
        
        logging.debug("Configuring report manager with execution directory")
        report_manager.configure_monitoring(execution_dir=execution_dir)
        
        logging.debug("Registering reports with report manager")
        report_manager.register_report(federated_metrics)
        report_manager.register_report(client_activity)
        
        logging.debug("FL reports setup completed successfully")
        
    except Exception as e:
        logging.error(f"Error in FL reports setup: {e}")
        raise
    
    