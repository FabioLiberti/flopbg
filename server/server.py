import os, sys
import numpy as np
import tensorflow as tf
import logging
from models.model_definition import create_model

# Configure the path to import custom modules
current_dir = os.path.abspath(os.path.dirname(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.insert(0, parent_dir)


class Server:
    def __init__(self, dataset_name, input_shape, num_classes, learning_rate):
        """
        Initializes a Server instance.

        Parameters:
            dataset_name (str): Name of the dataset.
            input_shape (tuple): Shape of input data.
            num_classes (int): Number of classes in the dataset.
            learning_rate (float): Learning rate for the optimizer.
        """
        self.dataset_name = dataset_name
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.learning_rate = learning_rate
        self.global_model = create_model(dataset_name, input_shape, num_classes, learning_rate)
        # SCAFFOLD control variates (initialized on first use)
        self.server_control_variate = None
        logging.info("Server initialized with global model.")

    def create_model(self):
        """
        Creates the global model using the model definition.

        Returns:
            tf.keras.Model: The compiled Keras model.
        """
        model = create_model(
            dataset_name=self.dataset_name,
            input_shape=self.input_shape,
            num_classes=self.num_classes,
            learning_rate=self.learning_rate
        )
        logging.info("Global model created.")
        return model

    def aggregate_weights(self, client_weights, client_samples):
        """
        Aggregates client weights using Federated Averaging (FedAvg).

        Parameters:
            client_weights (list): List of client weight updates.
            client_samples (list): List of sample counts for each client.
        """
        logging.info("Aggregating weights using FedAvg.")
        total_samples = sum(client_samples)
        new_weights = [np.zeros_like(w) for w in self.global_model.get_weights()]

        for client_idx, client_weight in enumerate(client_weights):
            weight_scale = client_samples[client_idx] / total_samples
            for layer_idx, layer_weight in enumerate(client_weight):
                new_weights[layer_idx] += weight_scale * layer_weight
                logging.debug(f"Client {client_idx}: Layer {layer_idx} aggregated with scale {weight_scale}.")

        self.global_model.set_weights(new_weights)
        logging.info("Weights aggregated and global model updated.")

    def aggregate_weights_prox(self, client_weights, client_samples, mu=0.1):
        """
        Aggregates client weights using FedProx.

        Parameters:
            client_weights (list): List of client weight updates.
            client_samples (list): List of sample counts for each client.
            mu (float): Proximal term coefficient.
        """
        logging.info("Aggregating weights using FedProx.")
        total_samples = sum(client_samples)
        aggregated_weights = [np.zeros_like(w) for w in self.global_model.get_weights()]

        for client_idx, client_weight in enumerate(client_weights):
            weight_scale = client_samples[client_idx] / total_samples
            for layer_idx, layer_weight in enumerate(client_weight):
                aggregated_weights[layer_idx] += weight_scale * layer_weight
                logging.debug(f"Client {client_idx}: Layer {layer_idx} aggregated with scale {weight_scale}.")

        # Apply FedProx proximal term
        global_weights = self.global_model.get_weights()
        prox_weights = []
        for layer_idx, (gw, agw) in enumerate(zip(global_weights, aggregated_weights)):
            prox_weight = gw - mu * (gw - agw)
            prox_weights.append(prox_weight)
            logging.debug(f"Layer {layer_idx}: Proximal term applied.")

        self.global_model.set_weights(prox_weights)
        logging.info("Weights aggregated with FedProx and global model updated.")

    def aggregate_scaffold(self, client_weights, client_samples, client_delta_controls):
        """
        Aggregates client weights using SCAFFOLD.
        FedAvg aggregation of weights + update of server control variate.

        Parameters:
            client_weights (list): List of client weight updates.
            client_samples (list): List of sample counts for each client.
            client_delta_controls (list): List of delta control variates from each client.
        """
        logging.info("Aggregating weights using SCAFFOLD.")
        # Standard FedAvg aggregation of model weights
        total_samples = sum(client_samples)
        new_weights = [np.zeros_like(w) for w in self.global_model.get_weights()]
        for client_idx, client_weight in enumerate(client_weights):
            weight_scale = client_samples[client_idx] / total_samples
            for layer_idx, layer_weight in enumerate(client_weight):
                new_weights[layer_idx] += weight_scale * layer_weight
        self.global_model.set_weights(new_weights)

        # Update server control variate: c = c + (1/N) * sum(delta_c_i)
        N = len(client_weights)
        if self.server_control_variate is None:
            self.server_control_variate = [np.zeros_like(w) for w in new_weights]
        for delta_c in client_delta_controls:
            for layer_idx in range(len(self.server_control_variate)):
                self.server_control_variate[layer_idx] += delta_c[layer_idx] / N
        logging.info("SCAFFOLD aggregation complete. Server control variate updated.")

    def aggregate_fednova(self, client_weights, client_samples, client_tau):
        """
        Aggregates client weights using FedNova (Normalized Averaging).
        Normalizes client contributions by the number of local gradient steps.

        Parameters:
            client_weights (list): List of client weight updates.
            client_samples (list): List of sample counts for each client.
            client_tau (list): List of gradient step counts (tau_i) for each client.
        """
        logging.info("Aggregating weights using FedNova.")
        total_samples = sum(client_samples)
        global_w = self.global_model.get_weights()

        # Effective number of steps: tau_eff = sum(p_i * tau_i)
        tau_eff = sum(
            client_samples[i] / total_samples * client_tau[i]
            for i in range(len(client_weights))
        )

        # Normalized pseudo-gradients: delta_i = (w_global - w_i) / tau_i
        agg_normalized_grad = [np.zeros_like(w) for w in global_w]
        for i, cw in enumerate(client_weights):
            p_i = client_samples[i] / total_samples
            for layer_idx in range(len(global_w)):
                delta = (global_w[layer_idx] - cw[layer_idx]) / client_tau[i]
                agg_normalized_grad[layer_idx] += p_i * delta

        # New weights: w_new = w_global - tau_eff * agg_normalized_grad
        new_weights = []
        for layer_idx in range(len(global_w)):
            new_weights.append(global_w[layer_idx] - tau_eff * agg_normalized_grad[layer_idx])
        self.global_model.set_weights(new_weights)
        logging.info("FedNova aggregation complete.")

    def reset(self):
        """
        Resetta lo stato del server, incluso il re-inizializzare il modello globale.
        """
        self.global_model = create_model(self.dataset_name, self.input_shape, self.num_classes, self.learning_rate)
        self.server_control_variate = None
        logging.info("Server state has been reset. Global model reinitialized.")

    def save_global_model(self):
        model_path = os.path.join(parent_dir, 'global_model.h5')
        try:
            self.global_model.save(model_path)
            logging.info(f"Global model saved to {model_path}")
        except Exception as e:
            logging.error(f"Error saving global model: {e}")
        
