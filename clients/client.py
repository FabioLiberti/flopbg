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

    def _get_loss_fn(self):
        """Returns the appropriate loss function based on the dataset."""
        if self.dataset_name in ['chest_xray', 'skin_cancer']:
            return tf.keras.losses.BinaryCrossentropy()
        else:
            return tf.keras.losses.SparseCategoricalCrossentropy()

    def train_fedprox(self, global_weights, mu=0.1, quantization_bits=8):
        """
        Trains the client's model using FedProx (with proximal term in the loss).

        Parameters:
            global_weights (list): Weights from the global model.
            mu (float): Proximal term coefficient.
            quantization_bits (int): Number of bits for weight quantization.

        Returns:
            list: Quantized weights after local training.
        """
        self.model.set_weights(global_weights)

        # Save global trainable weights for proximal term
        global_trainable = [tf.constant(w.numpy()) for w in self.model.trainable_weights]

        loss_fn = self._get_loss_fn()
        optimizer = self.model.optimizer

        dataset = tf.data.Dataset.from_tensor_slices((self.train_images, self.train_labels))
        dataset = dataset.shuffle(len(self.train_images)).batch(self.batch_size)

        start_time = time.time()
        for epoch in range(self.local_epochs):
            for x_batch, y_batch in dataset:
                with tf.GradientTape() as tape:
                    preds = self.model(x_batch, training=True)
                    loss = loss_fn(y_batch, preds)
                    # Proximal term: (mu/2) * ||w - w_global||^2
                    prox_term = 0.0
                    for w, gw in zip(self.model.trainable_weights, global_trainable):
                        prox_term += tf.reduce_sum(tf.square(w - gw))
                    loss += (mu / 2.0) * prox_term
                grads = tape.gradient(loss, self.model.trainable_weights)
                optimizer.apply_gradients(zip(grads, self.model.trainable_weights))

        self.last_training_time = time.time() - start_time
        logging.info(f"Client {self.client_id} trained with FedProx (mu={mu}) for {self.last_training_time:.2f}s.")

        local_weights = self.model.get_weights()
        return quantize_weights(local_weights, bits=quantization_bits)

    def train_scaffold(self, global_weights, server_control, client_control, quantization_bits=8):
        """
        Trains the client's model using SCAFFOLD (with control variate correction).

        Parameters:
            global_weights (list): Weights from the global model (all weights).
            server_control (list): Server control variate (all weights shape).
            client_control (list): Client control variate (all weights shape).
            quantization_bits (int): Number of bits for weight quantization.

        Returns:
            tuple: (quantized_weights, new_client_control, delta_control)
        """
        self.model.set_weights(global_weights)

        loss_fn = self._get_loss_fn()
        optimizer = self.model.optimizer

        # Build index mapping: which positions in get_weights() correspond to trainable_weights
        all_weight_names = [w.name for w in self.model.weights]
        trainable_names = [w.name for w in self.model.trainable_weights]
        trainable_indices = [i for i, name in enumerate(all_weight_names) if name in trainable_names]

        # Extract control variates for trainable weights only
        server_ctrl_trainable = [tf.constant(server_control[i], dtype=tf.float32) for i in trainable_indices]
        client_ctrl_trainable = [tf.constant(client_control[i], dtype=tf.float32) for i in trainable_indices]

        dataset = tf.data.Dataset.from_tensor_slices((self.train_images, self.train_labels))
        dataset = dataset.shuffle(len(self.train_images)).batch(self.batch_size)

        start_time = time.time()
        for epoch in range(self.local_epochs):
            for x_batch, y_batch in dataset:
                with tf.GradientTape() as tape:
                    preds = self.model(x_batch, training=True)
                    loss = loss_fn(y_batch, preds)
                grads = tape.gradient(loss, self.model.trainable_weights)
                # SCAFFOLD correction: grad_corrected = grad - c_i + c
                corrected_grads = []
                for g, ci, c in zip(grads, client_ctrl_trainable, server_ctrl_trainable):
                    corrected_grads.append(g - ci + c)
                optimizer.apply_gradients(zip(corrected_grads, self.model.trainable_weights))

        self.last_training_time = time.time() - start_time
        logging.info(f"Client {self.client_id} trained with SCAFFOLD for {self.last_training_time:.2f}s.")

        new_weights = self.model.get_weights()

        # Update client control variate (Option II from SCAFFOLD paper):
        # c_i_new = c_i - c + (w_global - w_local) / (K * lr)
        K = self.local_epochs * int(np.ceil(len(self.train_images) / self.batch_size))
        new_client_control = []
        delta_control = []
        for l in range(len(client_control)):
            c_new = client_control[l] - server_control[l] + \
                     (global_weights[l] - new_weights[l]) / (K * self.learning_rate)
            new_client_control.append(c_new)
            delta_control.append(c_new - client_control[l])

        return quantize_weights(new_weights, bits=quantization_bits), new_client_control, delta_control

    def train_fednova(self, global_weights, quantization_bits=8):
        """
        Trains the client's model using FedNova.
        Same as FedAvg training, but also returns the number of local gradient steps (tau).

        Parameters:
            global_weights (list): Weights from the global model.
            quantization_bits (int): Number of bits for weight quantization.

        Returns:
            tuple: (quantized_weights, tau)
        """
        weights = self.train(global_weights, quantization_bits)
        tau = self.local_epochs * int(np.ceil(len(self.train_images) / self.batch_size))
        return weights, tau

    def train_feddyn(self, global_weights, alpha, h_i, quantization_bits=8):
        """
        Trains the client's model using FedDyn (Dynamic Regularization).
        loss = loss_task + (alpha/2)||w - w_global||² - <h_i, w>

        Parameters:
            global_weights (list): Weights from the global model.
            alpha (float): Dynamic regularization coefficient.
            h_i (list): Client's dynamic regularizer state (all weights shape).
            quantization_bits (int): Number of bits for weight quantization.

        Returns:
            tuple: (quantized_weights, new_h_i)
        """
        self.model.set_weights(global_weights)

        # Save global trainable weights for regularization term
        global_trainable = [tf.constant(w.numpy()) for w in self.model.trainable_weights]

        # Map h_i (all weights) to trainable-only indices
        all_weight_names = [w.name for w in self.model.weights]
        trainable_names = [w.name for w in self.model.trainable_weights]
        trainable_indices = [i for i, name in enumerate(all_weight_names) if name in trainable_names]
        h_i_trainable = [tf.constant(h_i[idx], dtype=tf.float32) for idx in trainable_indices]

        loss_fn = self._get_loss_fn()
        optimizer = self.model.optimizer

        dataset = tf.data.Dataset.from_tensor_slices((self.train_images, self.train_labels))
        dataset = dataset.shuffle(len(self.train_images)).batch(self.batch_size)

        start_time = time.time()
        for epoch in range(self.local_epochs):
            for x_batch, y_batch in dataset:
                with tf.GradientTape() as tape:
                    preds = self.model(x_batch, training=True)
                    loss = loss_fn(y_batch, preds)
                    # Dynamic regularization: (alpha/2)||w - w_global||² - <h_i, w>
                    reg_term = 0.0
                    lin_term = 0.0
                    for w, gw, hi in zip(self.model.trainable_weights, global_trainable, h_i_trainable):
                        reg_term += tf.reduce_sum(tf.square(w - gw))
                        lin_term += tf.reduce_sum(hi * w)
                    loss += (alpha / 2.0) * reg_term - lin_term
                grads = tape.gradient(loss, self.model.trainable_weights)
                optimizer.apply_gradients(zip(grads, self.model.trainable_weights))

        self.last_training_time = time.time() - start_time
        logging.info(f"Client {self.client_id} trained with FedDyn (alpha={alpha}) for {self.last_training_time:.2f}s.")

        new_weights = self.model.get_weights()

        # Update h_i: h_i_new = h_i - alpha * (w_local - w_global)
        new_h_i = []
        for l in range(len(h_i)):
            new_h_i.append(h_i[l] - alpha * (new_weights[l] - global_weights[l]))

        return quantize_weights(new_weights, bits=quantization_bits), new_h_i

    def train_moon(self, global_weights, prev_local_weights, mu=1.0, temperature=0.5, quantization_bits=8):
        """
        Trains using MOON (Model-Contrastive FL).
        loss = loss_task + mu * L_con
        L_con uses cosine similarity to align local reps with global and diverge from previous local.
        """
        self.model.set_weights(global_weights)

        # Find the last Dense layer before the output (representation layer)
        rep_layer_idx = -2
        for i in range(len(self.model.layers) - 2, -1, -1):
            if isinstance(self.model.layers[i], tf.keras.layers.Dense):
                rep_layer_idx = i
                break
        feature_extractor = tf.keras.Model(
            inputs=self.model.input, outputs=self.model.layers[rep_layer_idx].output
        )

        # Build global and previous feature extractors (fixed weights)
        global_model = create_model(self.dataset_name, self.input_shape, self.num_classes, self.learning_rate)
        global_model.set_weights(global_weights)
        global_fe = tf.keras.Model(inputs=global_model.input, outputs=global_model.layers[rep_layer_idx].output)

        prev_model = create_model(self.dataset_name, self.input_shape, self.num_classes, self.learning_rate)
        prev_model.set_weights(prev_local_weights)
        prev_fe = tf.keras.Model(inputs=prev_model.input, outputs=prev_model.layers[rep_layer_idx].output)

        loss_fn = self._get_loss_fn()
        optimizer = self.model.optimizer
        tau = temperature

        dataset = tf.data.Dataset.from_tensor_slices((self.train_images, self.train_labels))
        dataset = dataset.shuffle(len(self.train_images)).batch(self.batch_size)

        start_time = time.time()
        for epoch in range(self.local_epochs):
            for x_batch, y_batch in dataset:
                with tf.GradientTape() as tape:
                    preds = self.model(x_batch, training=True)
                    task_loss = loss_fn(y_batch, preds)

                    # Representations
                    z_local = feature_extractor(x_batch, training=False)
                    z_global = global_fe(x_batch, training=False)
                    z_prev = prev_fe(x_batch, training=False)

                    # Cosine similarities
                    z_local_norm = tf.nn.l2_normalize(z_local, axis=1)
                    z_global_norm = tf.nn.l2_normalize(z_global, axis=1)
                    z_prev_norm = tf.nn.l2_normalize(z_prev, axis=1)

                    sim_global = tf.reduce_sum(z_local_norm * z_global_norm, axis=1) / tau
                    sim_prev = tf.reduce_sum(z_local_norm * z_prev_norm, axis=1) / tau

                    # Contrastive loss: -log(exp(sim_glob) / (exp(sim_glob) + exp(sim_prev)))
                    con_loss = -tf.reduce_mean(
                        sim_global - tf.math.log(tf.exp(sim_global) + tf.exp(sim_prev))
                    )

                    loss = task_loss + mu * con_loss
                grads = tape.gradient(loss, self.model.trainable_weights)
                optimizer.apply_gradients(zip(grads, self.model.trainable_weights))

        self.last_training_time = time.time() - start_time
        logging.info(f"Client {self.client_id} trained with MOON (mu={mu}) for {self.last_training_time:.2f}s.")

        local_weights = self.model.get_weights()
        return quantize_weights(local_weights, bits=quantization_bits)

    def train_fedspeed(self, global_weights, mu=0.1, quantization_bits=8):
        """
        Trains using FedSpeed (Proximal + gradient perturbation correction).
        loss = loss_task + (mu/2)||w - w_g||^2 - <d, w>
        where d = grad_L(w_g) is the gradient at the global model point.
        """
        self.model.set_weights(global_weights)
        global_trainable = [tf.constant(w.numpy()) for w in self.model.trainable_weights]

        loss_fn = self._get_loss_fn()
        optimizer = self.model.optimizer

        dataset = tf.data.Dataset.from_tensor_slices((self.train_images, self.train_labels))
        dataset = dataset.shuffle(len(self.train_images)).batch(self.batch_size)

        # Compute reference gradient at global point (perturbation vector)
        perturbation = [tf.zeros_like(w) for w in self.model.trainable_weights]
        n_batches = 0
        for x_batch, y_batch in dataset.take(5):
            with tf.GradientTape() as tape:
                preds = self.model(x_batch, training=True)
                loss = loss_fn(y_batch, preds)
            grads = tape.gradient(loss, self.model.trainable_weights)
            for j in range(len(perturbation)):
                perturbation[j] = perturbation[j] + grads[j]
            n_batches += 1
        perturbation = [p / n_batches for p in perturbation]

        # Reset to global weights (BatchNorm stats may have changed)
        self.model.set_weights(global_weights)

        start_time = time.time()
        for epoch in range(self.local_epochs):
            for x_batch, y_batch in dataset:
                with tf.GradientTape() as tape:
                    preds = self.model(x_batch, training=True)
                    loss = loss_fn(y_batch, preds)
                    # Proximal term
                    prox_term = 0.0
                    for w, gw in zip(self.model.trainable_weights, global_trainable):
                        prox_term += tf.reduce_sum(tf.square(w - gw))
                    loss += (mu / 2.0) * prox_term
                    # Perturbation correction: -<d, w>
                    pert_term = 0.0
                    for w, d in zip(self.model.trainable_weights, perturbation):
                        pert_term += tf.reduce_sum(d * w)
                    loss -= pert_term
                grads = tape.gradient(loss, self.model.trainable_weights)
                optimizer.apply_gradients(zip(grads, self.model.trainable_weights))

        self.last_training_time = time.time() - start_time
        logging.info(f"Client {self.client_id} trained with FedSpeed (mu={mu}) for {self.last_training_time:.2f}s.")

        return quantize_weights(self.model.get_weights(), bits=quantization_bits)

    def train_deepafl(self, global_weights, quantization_bits=8):
        """
        Trains using DeepAFL (Analytic FL).
        Freezes feature layers, extracts representations, solves classifier via least squares.
        W = (X^T X + lambda I)^{-1} X^T Y
        """
        self.model.set_weights(global_weights)

        # Feature extractor: all layers except the last Dense (classifier)
        feature_model = tf.keras.Model(
            inputs=self.model.input,
            outputs=self.model.layers[-2].output
        )

        start_time = time.time()

        # Extract features (no gradient needed)
        features = feature_model.predict(self.train_images, batch_size=self.batch_size, verbose=0)

        # Prepare targets
        if self.dataset_name in ['chest_xray', 'skin_cancer']:
            targets = self.train_labels.reshape(-1, 1).astype(np.float32)
        else:
            targets = tf.keras.utils.to_categorical(
                self.train_labels, self.num_classes
            ).astype(np.float32)

        # Add bias column: X = [features, 1]
        X = np.hstack([features, np.ones((features.shape[0], 1), dtype=np.float32)])

        # Ridge regression: W = (X^T X + lambda*I)^{-1} X^T Y
        lambda_reg = 1e-4
        XtX = X.T @ X + lambda_reg * np.eye(X.shape[1], dtype=np.float32)
        XtY = X.T @ targets
        W_solution = np.linalg.solve(XtX, XtY)

        # Update only the classifier layer weights (last Dense)
        new_weights = [w.copy() for w in global_weights]
        new_weights[-2] = W_solution[:-1, :].astype(np.float32)  # kernel
        new_weights[-1] = W_solution[-1, :].astype(np.float32)   # bias

        self.last_training_time = time.time() - start_time
        logging.info(f"Client {self.client_id} trained with DeepAFL (analytic) for {self.last_training_time:.2f}s.")

        return quantize_weights(new_weights, bits=quantization_bits)

    def train_fedel(self, global_weights, budget=0.5, quantization_bits=8):
        """
        Trains using FedEL (Elastic Learning).
        Standard training + dynamic tensor selection by importance.
        Only top-budget% of layers are communicated.
        Returns (weights, selected_layer_indices).
        """
        # Standard training (same as FedAvg)
        updated_weights = self.train(global_weights, quantization_bits)

        # Compute layer importance: ||delta_w_l|| / (||w_global_l|| + eps)
        importances = []
        for l in range(len(updated_weights)):
            delta_norm = np.linalg.norm(updated_weights[l].flatten() - global_weights[l].flatten())
            ref_norm = np.linalg.norm(global_weights[l].flatten()) + 1e-10
            importances.append(delta_norm / ref_norm)

        # Select top layers by budget fraction
        n_select = max(1, int(len(updated_weights) * budget))
        selected = set(np.argsort(importances)[-n_select:].tolist())

        # Mask: keep global weights for non-selected layers
        masked_weights = []
        for l in range(len(updated_weights)):
            if l in selected:
                masked_weights.append(updated_weights[l])
            else:
                masked_weights.append(global_weights[l].copy())

        logging.info(f"Client {self.client_id} FedEL: selected {len(selected)}/{len(updated_weights)} layers (budget={budget}).")

        return quantize_weights(masked_weights, bits=quantization_bits), list(selected)

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
        