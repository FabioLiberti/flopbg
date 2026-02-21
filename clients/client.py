import numpy as np
import tensorflow as tf
import time  # Necessary for measuring training time
from models.model_definition import create_model
import logging

def quantize_weights(weights, bits=8):
    """
    Quantizes weights to reduce the size of model updates.

    Parameters:
        weights (list): List of NumPy arrays representing model weights.
        bits (int): Number of bits to use for quantization.

    Returns:
        list: Quantized weights.
    """
    scale = 2 ** bits - 1
    quantized_weights = []
    for w in weights:
        w_min = np.min(w)
        w_max = np.max(w)
        # Avoid division by zero
        if w_max - w_min == 0:
            q_w = np.zeros_like(w)
        else:
            # Scale and quantize
            q_w = np.round((w - w_min) / (w_max - w_min) * scale)
            # Restore original scale
            q_w = q_w / scale * (w_max - w_min) + w_min
        quantized_weights.append(q_w)
    return quantized_weights

class Client:
    def __init__(self, client_id, client_data, test_data, dataset_name, input_shape, num_classes, learning_rate,
                 local_epochs=1, batch_size=32, computational_power=1.0, network_speed=1.0, client_type='medium',
                 participation_rate=1.0, dynamism_type='normal'):
        """
        Initializes a Client instance.

        Parameters:
            client_id (int): Unique identifier for the client.
            client_data (tuple): Tuple containing training images and labels.
            test_data (tuple): Tuple containing test images and labels.
            dataset_name (str): Name of the dataset.
            input_shape (tuple): Shape of input data.
            num_classes (int): Number of classes in the dataset.
            learning_rate (float): Learning rate for the optimizer.
            local_epochs (int): Number of local epochs for training.
            batch_size (int): Batch size for training.
            computational_power (float): Computational power of the client (optional).
            network_speed (float): Network speed of the client (optional).
            client_type (str): Type of client (e.g., 'fast', 'medium', 'slow').
            participation_rate (float): Client's participation rate (probability of participating in a round).
            dynamism_type (str): Type of dynamism (e.g., 'fast', 'normal', 'slow').
        """
        self.client_id = client_id
        self.client_type = client_type
        self.train_images, self.train_labels = client_data
        self.test_images, self.test_labels = test_data
        self.computational_power = computational_power
        self.network_speed = network_speed
        self.dataset_name = dataset_name
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.learning_rate = learning_rate
        self.local_epochs = local_epochs
        self.batch_size = batch_size
        self.model = create_model(self.dataset_name, self.input_shape, self.num_classes, self.learning_rate)
        self.last_training_time = 0  # Initialize training time
        self.participation_rate = participation_rate
        self.dynamism_type = dynamism_type
        logging.info(f"Client {self.client_id} initialized.")

    def train(self, global_weights, quantization_bits=8, personalize=False):
        """
        Trains the client's model on local data.

        Parameters:
            global_weights (list): Weights from the global model.
            quantization_bits (int): Number of bits for weight quantization.
            personalize (bool): If True, personalize the model after training.

        Returns:
            list: Quantized weights after local training.
        """
        # Set the model weights to global weights
        self.model.set_weights(global_weights)
        logging.debug(f"Client {self.client_id} set global weights.")

        # Measure training time
        start_time = time.time()

        # Train the model on local data
        self.model.fit(
            self.train_images, self.train_labels,
            epochs=self.local_epochs,
            batch_size=self.batch_size,
            verbose=0
        )

        # Calculate training time
        training_time = time.time() - start_time
        self.last_training_time = training_time  # Save training time
        logging.info(f"Client {self.client_id} trained for {training_time:.2f} seconds.")

        if personalize:
            self.personalize_model()

        # Get updated weights
        local_weights = self.model.get_weights()

        # Quantize weights before sending to the server
        quantized_weights = quantize_weights(local_weights, bits=quantization_bits)
        logging.debug(f"Client {self.client_id} quantized weights.")

        return quantized_weights

    def personalize_model(self):
        """
        Personalizes the global model on the client's data.
        """
        personalized_epochs = 2  # Number of personalization epochs
        self.model.fit(
            self.train_images, self.train_labels,
            epochs=personalized_epochs,
            batch_size=self.batch_size,
            verbose=0
        )
        logging.info(f"Client {self.client_id} personalized the model.")

        # Evaluate the personalized model
        loss, accuracy = self.model.evaluate(self.test_images, self.test_labels, verbose=0)
        logging.info(f"Client {self.client_id} personalized model accuracy: {accuracy:.4f}")

    def get_training_time(self):
        """
        Returns the last training time.

        Returns:
            float: Training time in seconds.
        """
        return self.last_training_time

    def reset(self):
        """
        Resets the client's state, including reinitializing the local model.
        """
        self.model = create_model(self.dataset_name, self.input_shape, self.num_classes, self.learning_rate)
        self.training_time = 0
        logging.info(f"Client {self.client_id} state has been reset.")
        