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
        self.global_model = create_model(dataset_name, input_shape, num_classes, learning_rate) # verificare...
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

    def reset(self):
        """
        Resetta lo stato del server, incluso il re-inizializzare il modello globale.
        """
        self.global_model = create_model(self.dataset_name, self.input_shape, self.num_classes, self.learning_rate)
        logging.info("Server state has been reset. Global model reinitialized.")

    def save_global_model(self):
        model_path = os.path.join(parent_dir, 'global_model.h5')
        try:
            self.global_model.save(model_path)
            logging.info(f"Global model saved to {model_path}")
        except Exception as e:
            logging.error(f"Error saving global model: {e}")
        
