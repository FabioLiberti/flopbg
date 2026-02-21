# federated_learning_system.py

import sys
import os
import logging
import random
import numpy as np
import tensorflow as tf
import math
import threading
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
        logging.info("FederatedLearningSystem initialized.")

    def start_experiment(self, num_rounds, local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate):
        if not self.is_configured:
            raise ValueError("System not configured. Call configure() first.")
        self.max_rounds = num_rounds
        self.is_running = True
        self.current_round = 0  # Reset current round
        # Avvia l'esperimento in un thread separato
        threading.Thread(
            target=self.run_experiment,
            args=(local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate)
        ).start()
        logging.info(f"Experiment started with {num_rounds} rounds.")

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

    def run_experiment(self, local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate):
        try:
            # Addestra il modello centralizzato e ottieni le metriche
            centralized_metrics = self.train_centralized_model()

            # Aggiungi le metriche centralizzate ai dati di accuratezza
            self.accuracy_data.append(centralized_metrics)

            while self.is_running and self.current_round < self.max_rounds:
                logging.info(f"Starting federated round {self.current_round + 1}/{self.max_rounds}")
                try:
                    # Esegui un singolo round di federated learning
                    metrics = self.run_round(local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate)
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

        except Exception as e:
            logging.error(f"Error during experiment: {e}")
        finally:
            self.is_running = False
            logging.info("Experiment has ended.")

    def run_round(self, local_epochs, batch_size, learning_rate, mu, quantization_bits, global_participation_rate):
        if self.client_manager is None or self.server is None or self.test_data is None:
            raise ValueError("System not properly initialized. Call configure() first.")

        # Seleziona i client attivi
        active_clients = self.select_active_clients(global_participation_rate)
        active_client_ids = [client.client_id for client in active_clients]
        self.client_participation[self.current_round + 1] = active_client_ids  # Registra i client partecipanti
        logging.info(f"Round {self.current_round + 1}: Selected Clients: {active_client_ids}")

        client_weights = []
        client_samples = []
        for client in active_clients:
            # Imposta i parametri del client
            client.local_epochs = local_epochs
            client.batch_size = batch_size
            client.learning_rate = learning_rate

            # Addestra il modello del client
            weights = client.train(self.server.global_model.get_weights())
            client_weights.append(weights)
            client_samples.append(len(client.train_images))
            self.client_training_times[client.client_id] = client.get_training_time()
            logging.debug(f"Client {client.client_id} contributed {len(client.train_images)} samples.")

        # Aggrega i pesi dei client utilizzando FedAvg
        self.server.aggregate_weights(client_weights, client_samples)
        
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
