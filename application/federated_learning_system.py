# federated_learning_system.py

import sys
import os
import logging
import random
import numpy as np
import tensorflow as tf
import math
import threading
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from datetime import datetime
from typing import Dict, Any, Optional, List
from collections import defaultdict

# Configurazione del percorso per importare moduli personalizzati
current_dir = os.path.abspath(os.path.dirname(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.insert(0, parent_dir)

# Importa moduli personalizzati
from data.data_loading import load_data, split_data_non_iid
from models.model_definition import create_model
from clients.client import Client
from clients.client_manager import ClientManager
from server.server import Server
from utils.metrics import evaluate_with_metrics
from utils.sanitization import sanitize_data  # Utilizziamo questa funzione importata

class FederatedLearningSystem:
    def __init__(self, config):
        # Rimuovi self.app = Flask(__name__)
        self.model = None
        self.config = config
        self.is_configured = False
        self.is_running = False
        self.current_round = 0
        self.max_rounds = 0
        self.dataset_name = None
        self.num_clients = 0
        self.accuracy_data = []
        self.client_participation = defaultdict(list)
        self.client_data_distribution = {}
        self.client_training_times = {}
        self.client_manager = None
        self.server = None
        self.test_data = None
        self.client_datasets = None
        self.input_shape = None
        self.num_classes = None
        self.centralized_metrics = None
        self.execution_dir = None
        self.algorithm = 'fedavg'
        self.client_controls = {}  # SCAFFOLD: control variates per client
        logging.info("FederatedLearningSystem initialized.")

    def start_experiment(self, num_rounds, local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate, algorithm='fedavg'):
        if not self.is_configured:
            raise ValueError("System not configured. Call configure() first.")
        self.max_rounds = num_rounds
        self.algorithm = algorithm
        self.is_running = True
        self.current_round = 0  # Reset current round

        # Initialize SCAFFOLD control variates if needed
        if algorithm == 'scaffold' and self.client_manager:
            global_weights = self.server.global_model.get_weights()
            self.client_controls = {
                cid: [np.zeros_like(w) for w in global_weights]
                for cid in self.client_manager.clients.keys()
            }
            if self.server.server_control_variate is None:
                self.server.server_control_variate = [np.zeros_like(w) for w in global_weights]

        # Avvia l'esperimento in un thread separato
        threading.Thread(
            target=self.run_experiment,
            args=(local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate, algorithm)
        ).start()
        logging.info(f"Experiment started with {num_rounds} rounds, algorithm={algorithm}.")

    def stop_experiment(self):
        self.is_running = False
        logging.info("Experiment stopped by user.")

    def configure(self, dataset_name: str, num_clients: Optional[int] = None,
                  client_types: Optional[Dict[str, Any]] = None,
                  client_dynamism: Optional[Dict[str, Any]] = None) -> None:
        self.dataset_name = dataset_name
        self.model = None  # Reset cached model to force reload from new server

        try:
            # Carica i dati
            (train_images, train_labels), (test_images, test_labels) = load_data(self.dataset_name)
            logging.info(f"Loaded dataset '{self.dataset_name}' with training samples: {len(train_images)}")
        except Exception as e:
            logging.error(f"Error loading dataset {dataset_name}: {e}")
            raise e  # Rilancia l'eccezione per essere gestita a un livello superiore

        self.input_shape = train_images.shape[1:]
        
        # Imposta num_classes correttamente
        self.num_classes = len(np.unique(train_labels))
        logging.info(f"Number of classes: {self.num_classes}")
        
        self.test_data = (test_images, test_labels)

        # Aggiorna i parametri di configurazione
        self.num_clients = num_clients or self.config.get('num_clients', 10)
        self.config['num_clients'] = self.num_clients
        self.config['client_types'] = client_types or self.config.get('client_types', {})
        self.config['client_dynamism'] = client_dynamism or self.config.get('client_dynamism', {})

        # Suddividi i dati tra i client
        self.client_datasets = split_data_non_iid(train_images, train_labels, num_clients=self.num_clients)

        # Inizializza ClientManager con client_types
        self.client_manager = ClientManager(client_types=self.config['client_types'])

        # Inizializza il Server
        self.server = Server(
            dataset_name=self.dataset_name,
            input_shape=self.input_shape,
            num_classes=self.num_classes,
            learning_rate=self.config.get('learning_rate', 0.01)
        )

        # Assegna i client ai tipi specificati
        client_ids = list(self.client_datasets.keys())
        random.shuffle(client_ids)
        total_clients = len(client_ids)
        client_type_assignments = []

        start_idx = 0
        for client_type, params in self.config['client_types'].items():
            proportion = params.get('proportion', 0)
            num_clients_type = int(total_clients * proportion)
            end_idx = start_idx + num_clients_type
            assigned_ids = client_ids[start_idx:end_idx]
            for client_id in assigned_ids:
                client_type_assignments.append((client_id, client_type))
            start_idx = end_idx

        # Assegna i client rimanenti al tipo 'medium' o predefinito
        remaining_ids = client_ids[start_idx:]
        default_type = 'medium' if 'medium' in self.config['client_types'] else list(self.config['client_types'].keys())[0]
        for client_id in remaining_ids:
            client_type_assignments.append((client_id, default_type))

        # Crea i client con le caratteristiche specificate
        for client_id, client_type in client_type_assignments:
            images, labels = self.client_datasets[client_id]
            client_params = self.config['client_types'][client_type]
            client = Client(
                client_id=client_id,
                client_data=(images, labels),
                test_data=self.test_data,
                dataset_name=self.dataset_name,
                input_shape=self.input_shape,
                num_classes=self.num_classes,
                learning_rate=self.config.get('learning_rate', 0.01),
                local_epochs=self.config.get('local_epochs', 1),
                batch_size=self.config.get('batch_size', 32),
                computational_power=client_params.get('computational_power', 1.0),
                network_speed=client_params.get('network_speed', 1.0),
                client_type=client_type  # Passa client_type al client
            )
            self.client_manager.register_client(client)
            logging.info(f"Registered Client {client_id} as '{client_type}' type.")

        # Assegna i client ai livelli di dinamismo
        self.assign_clients_to_dynamism()

        logging.info(f"Configuration completed for dataset: {dataset_name} with {len(self.client_manager.get_all_clients())} clients")
        self.is_configured = True

    def reset_state(self):
        # Reimposta tutte le variabili di stato
        self.is_running = False
        self.current_round = 0
        self.max_rounds = 0
        self.accuracy_data = []
        self.client_participation = defaultdict(list)
        self.client_data_distribution = {}
        self.client_training_times = {}
        self.centralized_metrics = None
        self.algorithm = 'fedavg'
        self.client_controls = {}
        # Reimposta server e client
        if self.server:
            self.server.reset()
        if self.client_manager:
            self.client_manager.reset_clients()
        logging.info("FederatedLearningSystem state has been reset.")

    def assign_clients_to_dynamism(self):
        """
        Assegna i client a diversi livelli di dinamismo basati sui tassi di partecipazione.
        """
        if not self.config.get('client_dynamism'):
            logging.info("No client dynamism configuration provided.")
            return

        total_clients = len(self.client_manager.get_all_clients())
        client_ids = [client.client_id for client in self.client_manager.get_all_clients()]
        random.shuffle(client_ids)
        start_idx = 0

        for dynamism_type, params in self.config['client_dynamism'].items():
            proportion = params.get('proportion', 0)
            participation_rate = params.get('participation_rate', 1.0)
            num_clients_dynamism = int(total_clients * proportion)
            end_idx = start_idx + num_clients_dynamism
            assigned_ids = client_ids[start_idx:end_idx]

            for client_id in assigned_ids:
                client = self.client_manager.clients[client_id]
                client.participation_rate = participation_rate
                client.dynamism_type = dynamism_type
                logging.info(f"Assigned Client {client_id} to dynamism '{dynamism_type}' with participation rate {client.participation_rate}")

            start_idx = end_idx

    def train_centralized_model(self):
        """
        Addestra un modello centralizzato sui dati aggregati di tutti i client.
        """
        logging.info("Training centralized model.")
        # Crea un nuovo modello
        centralized_model = create_model(self.dataset_name, self.input_shape, self.num_classes, self.config.get('learning_rate', 0.01))

        # Aggrega i dati di tutti i client
        all_train_images = np.concatenate([data[0] for data in self.client_datasets.values()])
        all_train_labels = np.concatenate([data[1] for data in self.client_datasets.values()])

        # Addestra il modello
        centralized_model.fit(
            all_train_images, all_train_labels,
            epochs=self.config.get('local_epochs', 1),
            batch_size=self.config.get('batch_size', 32),
            verbose=0
        )
        logging.info("Centralized model training completed.")

        # Valuta il modello
        test_loss, test_acc = centralized_model.evaluate(self.test_data[0], self.test_data[1], verbose=0)
        logging.info(f"Centralized model evaluation - Loss: {test_loss}, Accuracy: {test_acc}")

        metrics = evaluate_with_metrics(centralized_model, self.test_data[0], self.test_data[1])
        metrics.update({
            "accuracy": float(test_acc),
            "loss": float(test_loss),
            "round": 0  # Round 0 per il modello centralizzato
        })
        logging.info(f"Centralized model metrics: {metrics}")
        self.centralized_metrics = metrics
        return metrics  # Restituisce le metriche per essere utilizzate in run_experiment

    def run_experiment(self, local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate, algorithm='fedavg'):
        try:
            # Addestra il modello centralizzato e ottieni le metriche
            centralized_metrics = self.train_centralized_model()

            # Aggiungi le metriche centralizzate ai dati di accuratezza
            self.accuracy_data.append(centralized_metrics)

            while self.is_running and self.current_round < self.max_rounds:
                logging.info(f"Starting federated round {self.current_round + 1}/{self.max_rounds} (algorithm={algorithm})")
                try:
                    # Esegui un singolo round di federated learning
                    metrics = self.run_round(local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate, algorithm)
                    self.accuracy_data.append(metrics)
                    logging.info(f"Round {self.current_round + 1} complete. Metrics: {metrics}")
                    self.current_round += 1
                except Exception as e:
                    logging.error(f"Error in round {self.current_round + 1}: {e}")
                    break  # Esci dal ciclo in caso di errore

            logging.info("Experiment has completed all rounds.")

            # Dopo il completamento dell'esperimento, salva il modello globale
            if self.server and self.server.global_model:
                self.server.save_global_model()
            else:
                logging.error("Global model not found. Cannot save the model.")

            # Salva tutti i risultati dell'esperimento nella cartella report
            self.save_experiment_results()

        except Exception as e:
            logging.error(f"Error during experiment: {e}")
        finally:
            self.is_running = False
            logging.info("Experiment has ended.")

    def run_round(self, local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate, algorithm='fedavg'):
        if self.client_manager is None or self.server is None or self.test_data is None:
            raise ValueError("System not properly initialized. Call configure() first.")

        # Seleziona i client attivi
        active_clients = self.select_active_clients(global_participation_rate)
        active_client_ids = [client.client_id for client in active_clients]
        self.client_participation[self.current_round + 1] = active_client_ids
        logging.info(f"Round {self.current_round + 1}: Selected Clients: {active_client_ids} (algorithm={algorithm})")

        global_weights = self.server.global_model.get_weights()
        client_weights = []
        client_samples = []
        client_delta_controls = []  # SCAFFOLD
        client_taus = []  # FedNova

        for client in active_clients:
            # Imposta i parametri del client
            client.local_epochs = local_epochs
            client.batch_size = batch_size
            client.learning_rate = learning_rate
            n_samples = len(client.train_images)

            if algorithm == 'fedavg':
                weights = client.train(global_weights, quantization_bits)
                client_weights.append(weights)
                client_samples.append(n_samples)

            elif algorithm == 'fedprox':
                weights = client.train_fedprox(global_weights, mu, quantization_bits)
                client_weights.append(weights)
                client_samples.append(n_samples)

            elif algorithm == 'scaffold':
                client_ctrl = self.client_controls.get(
                    client.client_id,
                    [np.zeros_like(w) for w in global_weights]
                )
                weights, new_cc, delta_cc = client.train_scaffold(
                    global_weights,
                    self.server.server_control_variate,
                    client_ctrl,
                    quantization_bits
                )
                client_weights.append(weights)
                client_samples.append(n_samples)
                client_delta_controls.append(delta_cc)
                self.client_controls[client.client_id] = new_cc

            elif algorithm == 'fednova':
                weights, tau = client.train_fednova(global_weights, quantization_bits)
                client_weights.append(weights)
                client_samples.append(n_samples)
                client_taus.append(tau)

            self.client_training_times[client.client_id] = client.get_training_time()
            logging.debug(f"Client {client.client_id} contributed {n_samples} samples.")

        # Aggregazione in base all'algoritmo
        if algorithm == 'fedavg' or algorithm == 'fedprox':
            self.server.aggregate_weights(client_weights, client_samples)
        elif algorithm == 'scaffold':
            self.server.aggregate_scaffold(client_weights, client_samples, client_delta_controls)
        elif algorithm == 'fednova':
            self.server.aggregate_fednova(client_weights, client_samples, client_taus)

        # Salva il modello globale
        self.server.save_global_model()

        # Valuta il modello federato
        test_loss, test_acc = self.server.global_model.evaluate(self.test_data[0], self.test_data[1], verbose=0)
        logging.info(f"Round {self.current_round + 1}: Test Loss = {test_loss}, Test Accuracy = {test_acc}")

        # Controlla se test_loss è NaN o infinito
        if math.isnan(test_loss) or math.isinf(test_loss):
            logging.warning(f"Round {self.current_round + 1}: Loss is {test_loss}")

        # Valuta con metriche aggiuntive
        metrics = evaluate_with_metrics(self.server.global_model, self.test_data[0], self.test_data[1])
        metrics.update({
            "accuracy": float(test_acc),
            "loss": float(test_loss),
            "round": self.current_round + 1
        })
        logging.info(f"Round {self.current_round + 1} metrics: {metrics}")

        return metrics

    def select_active_clients(self, global_participation_rate) -> List[Client]:
        if self.client_manager is None:
            raise ValueError("Client manager is not initialized. Call configure() first.")

        active_clients = self.client_manager.select_active_clients(global_participation_rate)
        return active_clients

    def get_client_data_distribution(self):
        distribution = {}
        if self.client_manager and self.client_manager.clients:
            for client in self.client_manager.clients.values():
                client_id = client.client_id
                labels = client.train_labels
                unique, counts = np.unique(labels, return_counts=True)
                class_distribution = dict(zip(unique.tolist(), counts.tolist()))
                distribution[client_id] = {
                    'num_samples': len(labels),
                    'class_distribution': class_distribution
                }
        return distribution

    def save_experiment_results(self):
        """
        Salva tutti i risultati dell'esperimento nella cartella execution_dir:
        - Metriche per round (accuracy, loss, precision, recall, F1, AUC-ROC)
        - Confusion matrix per ogni round
        - ROC curve data per ogni round
        - Metriche centralizzate (baseline)
        - Partecipazione client
        - Tempi di training client
        - Distribuzione dati client
        - Grafici PNG: metriche, ROC, confusion matrix, client activity
        """
        if not self.execution_dir:
            logging.warning("execution_dir not set. Cannot save experiment results.")
            return

        try:
            os.makedirs(self.execution_dir, exist_ok=True)
            logging.info(f"Saving experiment results to: {self.execution_dir}")

            # --- 1. Salva tutte le metriche per round (JSON) ---
            all_rounds_data = sanitize_data(self.accuracy_data)
            with open(os.path.join(self.execution_dir, 'all_rounds_metrics.json'), 'w') as f:
                json.dump(all_rounds_data, f, indent=4)
            logging.info("Saved all_rounds_metrics.json")

            # --- 2. Salva metriche centralizzate (JSON) ---
            if self.centralized_metrics:
                with open(os.path.join(self.execution_dir, 'centralized_metrics.json'), 'w') as f:
                    json.dump(sanitize_data(self.centralized_metrics), f, indent=4)
                logging.info("Saved centralized_metrics.json")

            # --- 3. Salva partecipazione client (JSON) ---
            if self.client_participation:
                with open(os.path.join(self.execution_dir, 'client_participation.json'), 'w') as f:
                    json.dump(sanitize_data(dict(self.client_participation)), f, indent=4)
                logging.info("Saved client_participation.json")

            # --- 4. Salva tempi di training client (JSON) ---
            if self.client_training_times:
                with open(os.path.join(self.execution_dir, 'client_training_times.json'), 'w') as f:
                    json.dump(sanitize_data(self.client_training_times), f, indent=4)
                logging.info("Saved client_training_times.json")

            # --- 5. Salva distribuzione dati client (JSON) ---
            distribution = self.get_client_data_distribution()
            if distribution:
                with open(os.path.join(self.execution_dir, 'client_data_distribution.json'), 'w') as f:
                    json.dump(sanitize_data(distribution), f, indent=4)
                logging.info("Saved client_data_distribution.json")

            # --- 6. Salva riepilogo esperimento (JSON) ---
            federated_rounds = [d for d in self.accuracy_data if d.get('round', 0) > 0]
            experiment_summary = {
                'dataset': self.dataset_name,
                'num_clients': self.num_clients,
                'max_rounds': self.max_rounds,
                'completed_rounds': len(federated_rounds),
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            }
            if federated_rounds:
                last = federated_rounds[-1]
                experiment_summary['final_federated_accuracy'] = last.get('accuracy')
                experiment_summary['final_federated_loss'] = last.get('loss')
                experiment_summary['final_federated_f1'] = last.get('f1_score')
                experiment_summary['final_federated_precision'] = last.get('precision')
                experiment_summary['final_federated_recall'] = last.get('recall')
                experiment_summary['final_federated_auc_roc'] = last.get('auc_roc')
            if self.centralized_metrics:
                experiment_summary['centralized_accuracy'] = self.centralized_metrics.get('accuracy')
                experiment_summary['centralized_loss'] = self.centralized_metrics.get('loss')
            with open(os.path.join(self.execution_dir, 'experiment_summary.json'), 'w') as f:
                json.dump(sanitize_data(experiment_summary), f, indent=4)
            logging.info("Saved experiment_summary.json")

            # --- 7. Genera grafici PNG ---
            charts_dir = os.path.join(self.execution_dir, 'charts')
            os.makedirs(charts_dir, exist_ok=True)

            # 7a. Grafico Accuracy per round
            if federated_rounds:
                rounds = [d['round'] for d in federated_rounds]
                accuracies = [d.get('accuracy', 0) for d in federated_rounds]
                losses = [d.get('loss', 0) for d in federated_rounds]
                precisions = [d.get('precision', 0) for d in federated_rounds]
                recalls = [d.get('recall', 0) for d in federated_rounds]
                f1s = [d.get('f1_score', 0) for d in federated_rounds]

                # Accuracy & Loss
                fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
                ax1.plot(rounds, accuracies, 'b-o', label='Federated Accuracy')
                if self.centralized_metrics:
                    ax1.axhline(y=self.centralized_metrics.get('accuracy', 0), color='r', linestyle='--', label='Centralized Accuracy')
                ax1.set_xlabel('Round')
                ax1.set_ylabel('Accuracy')
                ax1.set_title('Accuracy per Round')
                ax1.legend()
                ax1.grid(True)

                ax2.plot(rounds, losses, 'r-o', label='Federated Loss')
                if self.centralized_metrics:
                    ax2.axhline(y=self.centralized_metrics.get('loss', 0), color='b', linestyle='--', label='Centralized Loss')
                ax2.set_xlabel('Round')
                ax2.set_ylabel('Loss')
                ax2.set_title('Loss per Round')
                ax2.legend()
                ax2.grid(True)

                plt.tight_layout()
                plt.savefig(os.path.join(charts_dir, 'accuracy_loss.png'), dpi=150, bbox_inches='tight')
                plt.close()

                # Precision, Recall, F1
                fig, ax = plt.subplots(figsize=(10, 5))
                ax.plot(rounds, precisions, 'g-o', label='Precision')
                ax.plot(rounds, recalls, 'm-o', label='Recall')
                ax.plot(rounds, f1s, 'c-o', label='F1 Score')
                ax.set_xlabel('Round')
                ax.set_ylabel('Score')
                ax.set_title('Precision / Recall / F1 per Round')
                ax.legend()
                ax.grid(True)
                plt.tight_layout()
                plt.savefig(os.path.join(charts_dir, 'precision_recall_f1.png'), dpi=150, bbox_inches='tight')
                plt.close()

                logging.info("Saved accuracy_loss.png and precision_recall_f1.png")

            # 7b. Confusion Matrix (dall'ultimo round federato)
            last_federated = None
            for item in reversed(self.accuracy_data):
                if item.get('round', 0) > 0:
                    last_federated = item
                    break

            if last_federated and last_federated.get('confusion_matrix'):
                cm = np.array(last_federated['confusion_matrix'])
                fig, ax = plt.subplots(figsize=(8, 6))
                im = ax.imshow(cm, cmap='Blues', interpolation='nearest')
                fig.colorbar(im, ax=ax)
                # Annotate cells
                for i in range(cm.shape[0]):
                    for j in range(cm.shape[1]):
                        ax.text(j, i, str(cm[i, j]), ha='center', va='center',
                                color='white' if cm[i, j] > cm.max() / 2 else 'black')
                ax.set_xlabel('Predicted')
                ax.set_ylabel('Actual')
                ax.set_title(f'Confusion Matrix - {self.dataset_name} (Round {last_federated["round"]})')
                ax.set_xticks(range(cm.shape[1]))
                ax.set_yticks(range(cm.shape[0]))
                plt.tight_layout()
                plt.savefig(os.path.join(charts_dir, 'confusion_matrix.png'), dpi=150, bbox_inches='tight')
                plt.close()
                logging.info("Saved confusion_matrix.png")

            # 7c. ROC Curves (dall'ultimo round federato)
            if last_federated and last_federated.get('roc_curve_data'):
                roc_data = last_federated['roc_curve_data']
                fig, ax = plt.subplots(figsize=(8, 6))
                if isinstance(roc_data, dict):
                    if 'fpr' in roc_data and 'tpr' in roc_data:
                        # Binary classification
                        ax.plot(roc_data['fpr'], roc_data['tpr'], 'b-', label='ROC Curve')
                    else:
                        # Multiclass: keys are class indices
                        for class_key, curve in roc_data.items():
                            if isinstance(curve, dict) and 'fpr' in curve and 'tpr' in curve:
                                ax.plot(curve['fpr'], curve['tpr'], label=f'Class {class_key}')
                ax.plot([0, 1], [0, 1], 'k--', label='Random')
                ax.set_xlabel('False Positive Rate')
                ax.set_ylabel('True Positive Rate')
                ax.set_title(f'ROC Curves - {self.dataset_name}')
                ax.legend()
                ax.grid(True)
                plt.tight_layout()
                plt.savefig(os.path.join(charts_dir, 'roc_curves.png'), dpi=150, bbox_inches='tight')
                plt.close()
                logging.info("Saved roc_curves.png")

            # 7d. Client Participation Heatmap
            if self.client_participation:
                try:
                    participation = dict(self.client_participation)
                    # Build matrix: rows = clients, cols = rounds
                    all_client_ids = set()
                    for round_num, client_ids in participation.items():
                        for cid in client_ids:
                            all_client_ids.add(cid)
                    all_client_ids = sorted(all_client_ids)
                    num_rounds_done = len(participation)

                    if all_client_ids and num_rounds_done > 0:
                        matrix = np.zeros((len(all_client_ids), num_rounds_done))
                        for col_idx, (round_num, active_ids) in enumerate(sorted(participation.items(), key=lambda x: int(x[0]))):
                            for row_idx, cid in enumerate(all_client_ids):
                                if cid in active_ids:
                                    matrix[row_idx, col_idx] = 1

                        fig, ax = plt.subplots(figsize=(max(8, num_rounds_done), max(4, len(all_client_ids) * 0.4)))
                        im = ax.imshow(matrix, cmap='YlGn', aspect='auto', interpolation='nearest')
                        fig.colorbar(im, ax=ax, label='Participated')
                        ax.set_xticks(range(num_rounds_done))
                        ax.set_xticklabels([f'R{r}' for r in sorted(participation.keys(), key=lambda x: int(x))])
                        ax.set_yticks(range(len(all_client_ids)))
                        ax.set_yticklabels([f'Client {c}' for c in all_client_ids])
                        ax.set_title('Client Participation per Round')
                        ax.set_xlabel('Round')
                        ax.set_ylabel('Client')
                        plt.tight_layout()
                        plt.savefig(os.path.join(charts_dir, 'client_participation.png'), dpi=150, bbox_inches='tight')
                        plt.close()
                        logging.info("Saved client_participation.png")
                except Exception as e:
                    logging.error(f"Error generating client participation chart: {e}")

            # 7e. Client Training Times
            if self.client_training_times:
                try:
                    client_ids = sorted(self.client_training_times.keys())
                    times = [self.client_training_times[cid] for cid in client_ids]
                    fig, ax = plt.subplots(figsize=(10, 5))
                    ax.bar([f'Client {c}' for c in client_ids], times, color='steelblue')
                    ax.set_xlabel('Client')
                    ax.set_ylabel('Training Time (s)')
                    ax.set_title('Client Training Times')
                    plt.xticks(rotation=45)
                    plt.tight_layout()
                    plt.savefig(os.path.join(charts_dir, 'client_training_times.png'), dpi=150, bbox_inches='tight')
                    plt.close()
                    logging.info("Saved client_training_times.png")
                except Exception as e:
                    logging.error(f"Error generating client training times chart: {e}")

            # 7f. Client Data Distribution
            if distribution:
                try:
                    client_ids = sorted(distribution.keys())
                    samples = [distribution[cid]['num_samples'] for cid in client_ids]
                    fig, ax = plt.subplots(figsize=(10, 5))
                    ax.bar([f'Client {c}' for c in client_ids], samples, color='coral')
                    ax.set_xlabel('Client')
                    ax.set_ylabel('Number of Samples')
                    ax.set_title('Data Distribution per Client')
                    plt.xticks(rotation=45)
                    plt.tight_layout()
                    plt.savefig(os.path.join(charts_dir, 'client_data_distribution.png'), dpi=150, bbox_inches='tight')
                    plt.close()

                    # Class distribution stacked bar
                    all_classes = set()
                    for cid in client_ids:
                        all_classes.update(distribution[cid]['class_distribution'].keys())
                    all_classes = sorted(all_classes)

                    if all_classes:
                        fig, ax = plt.subplots(figsize=(12, 6))
                        bottom = np.zeros(len(client_ids))
                        for cls in all_classes:
                            values = [distribution[cid]['class_distribution'].get(cls, 0) for cid in client_ids]
                            ax.bar([f'Client {c}' for c in client_ids], values, bottom=bottom, label=f'Class {cls}')
                            bottom += np.array(values)
                        ax.set_xlabel('Client')
                        ax.set_ylabel('Number of Samples')
                        ax.set_title('Class Distribution per Client')
                        ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
                        plt.xticks(rotation=45)
                        plt.tight_layout()
                        plt.savefig(os.path.join(charts_dir, 'client_class_distribution.png'), dpi=150, bbox_inches='tight')
                        plt.close()

                    logging.info("Saved client_data_distribution.png and client_class_distribution.png")
                except Exception as e:
                    logging.error(f"Error generating client data distribution charts: {e}")

            # --- 8. File di completamento ---
            with open(os.path.join(self.execution_dir, 'experiment_completed'), 'w') as f:
                f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

            logging.info(f"All experiment results saved to: {self.execution_dir}")

        except Exception as e:
            logging.error(f"Error saving experiment results: {e}", exc_info=True)

    def get_current_state(self) -> Dict[str, Any]:
        try:
            # Extract latest metrics from the last federated round (round > 0)
            latest_roc = None
            latest_cm = None
            for item in reversed(self.accuracy_data):
                if item.get('round', 0) > 0:
                    latest_roc = item.get('roc_curve_data')
                    latest_cm = item.get('confusion_matrix')
                    break

            state = {
                "status": "Running" if self.is_running else "Idle",
                "current_round": self.current_round if self.current_round is not None else 0,
                "max_rounds": self.max_rounds if self.max_rounds is not None else 0,
                "dataset_name": self.dataset_name if self.dataset_name else "",
                "num_clients": len(self.client_manager.get_all_clients()) if self.client_manager else 0,
                "accuracy_data": sanitize_data(self.accuracy_data),
                "roc_curve_data": sanitize_data(latest_roc),
                "confusion_matrix": sanitize_data(latest_cm),
                "client_data_distribution": sanitize_data(self.get_client_data_distribution()),
                "client_participation": sanitize_data(dict(self.client_participation)),
                "client_training_times": sanitize_data(self.client_training_times),
                "centralized_metrics": sanitize_data(self.centralized_metrics),
            }
            logging.debug(f"Sanitized state: {state}")
            return state
        except Exception as e:
            logging.error(f"Error in get_current_state: {e}")
            raise

    # Rimuovi il metodo personalizzato sanitize_data; utilizza la funzione importata

    def load_model(self):
        """
        Carica il modello globale addestrato.
        """
        try:
            if self.server and self.server.global_model:
                # Utilizza il modello globale dal server
                self.model = self.server.global_model
                logging.info("Model loaded from server's global model.")
            else:
                # Se non esiste un modello globale, carica un modello pre-addestrato o inizializza un nuovo modello
                model_path = os.path.join(parent_dir, 'global_model.h5')
                if os.path.exists(model_path):
                    self.model = tf.keras.models.load_model(model_path)
                    logging.info(f"Model loaded from {model_path}")
                else:
                    logging.warning("No global model found. Initializing a new model.")
                    self.model = create_model(self.dataset_name, self.input_shape, self.num_classes, self.config.get('learning_rate', 0.01))
        except Exception as e:
            logging.error(f"Error in load_model: {e}")
            raise e  # Indentato correttamente all'interno del blocco except

    def preprocess_images(self, images):
        """
        Preprocessa le immagini per l'input al modello.
        """
        images = images.astype('float32') / 255.0  # Normalizzazione

        # Aggiungi una dimensione canale se necessario
        if len(images.shape) == 3:
            images = np.expand_dims(images, axis=-1)  # Per immagini in scala di grigi

        # Gestisci mismatch canali (es. RGB -> grayscale o viceversa)
        expected_channels = self.input_shape[-1] if len(self.input_shape) == 3 else 1
        current_channels = images.shape[-1]

        if current_channels == 3 and expected_channels == 1:
            # Converti RGB in scala di grigi
            images = np.mean(images, axis=-1, keepdims=True)
        elif current_channels == 1 and expected_channels == 3:
            # Converti scala di grigi in RGB
            images = np.repeat(images, 3, axis=-1)

        # Ridimensiona le immagini se necessario
        target_size = self.input_shape[:2]  # Ottieni la dimensione di input del modello
        if images.shape[1:3] != target_size:
            images = tf.image.resize(images, target_size).numpy()

        return images

    def get_predicted_labels(self, images):
        """
        Prende in input un array di immagini e restituisce le etichette predette.
        """
        # Assicurati che il modello sia caricato
        try:
            if self.model is None:
                self.load_model()

            # Preprocessa le immagini
            preprocessed_images = self.preprocess_images(images)

            # Effettua le predizioni
            predictions = self.model.predict(preprocessed_images)

            # Gestisci diverse forme di output in base all'output del modello
            if predictions.shape[-1] == 1:
                # Classificazione binaria con un singolo neurone di output (sigmoid)
                predicted_labels = (predictions > 0.5).astype(int).flatten()
            else:
                # Classificazione multi-classe
                predicted_labels = np.argmax(predictions, axis=1)

            return predicted_labels.tolist()
        except Exception as e:
            logging.error(f"Error in get_predicted_labels: {e}")
            raise e  # Rilancia l'eccezione per essere gestita a un livello superiore

    def get_current_config(self):
        try:
            config_data = {
                "is_configured": self.is_configured,
                "dataset_name": self.dataset_name if self.dataset_name else "",
                "num_clients": self.num_clients if self.num_clients else 0,
                "client_types": self.config.get('client_types', {}),
                "client_dynamism": self.config.get('client_dynamism', {}),
                "learning_rate": self.config.get('learning_rate', 0.01),
                "local_epochs": self.config.get('local_epochs', 1),
                "batch_size": self.config.get('batch_size', 32),
                "mu": self.config.get('mu', 0.0),
                "quantization_bits": self.config.get('quantization_bits', 32),
                "nodes": self.config.get('nodes', []),
            }
            logging.debug(f"get_current_config: {config_data}")
            return config_data
        except Exception as e:
            logging.error(f"Error in get_current_config: {e}")
            raise
