# models/model_definition.py

import tensorflow as tf
import logging

def create_model(dataset_name, input_shape, num_classes, learning_rate=0.001):
    logging.info(f"Creating model for dataset: {dataset_name} with input_shape: {input_shape}, num_classes: {num_classes}")

    """
    Creates and compiles a Keras model specific to the provided dataset.

    Parameters:
        dataset_name (str): Name of the dataset.
        input_shape (tuple): Shape of the input data.
        num_classes (int): Number of classes for classification.
        learning_rate (float): Learning rate for the optimizer.

    Returns:
        tf.keras.Model: The compiled Keras model.
    """
    logging.info(f"Creating model for dataset: {dataset_name}")
    if dataset_name in ['mnist', 'fashion_mnist']:
        # Model for grayscale images 28x28x1
        model = tf.keras.models.Sequential([
            tf.keras.layers.InputLayer(shape=input_shape),
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dense(num_classes, activation='softmax')  # For multiclass
        ])
    elif dataset_name in ['cifar10', 'cifar100', 'svhn']:
        # Model for color images 32x32x3
        model = tf.keras.models.Sequential([
            tf.keras.layers.InputLayer(shape=input_shape),
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(512, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(num_classes, activation='softmax')  # For multiclass
        ])
    elif dataset_name == 'chest_xray':
        # Model for binary classification, images 150x150x3
        if num_classes != 1:
            logging.warning("For 'chest_xray', num_classes should be 1 for binary classification.")
        model = tf.keras.models.Sequential([
            tf.keras.layers.InputLayer(shape=input_shape),
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(512, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(1, activation='sigmoid')  # For binary classification
        ])
    elif dataset_name in ['isic', 'brain_tumor', 'brain_tumor_mri']:
        # Model for multiclass classification, images 224x224x3
        model = tf.keras.models.Sequential([
            tf.keras.layers.InputLayer(shape=input_shape),
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(512, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(num_classes, activation='softmax')  # For multiclass
        ])
    else:
        raise ValueError(f"Dataset '{dataset_name}' not supported.")

    # Select loss function
    if dataset_name == 'chest_xray':
        loss = 'binary_crossentropy'
    else:
        loss = 'sparse_categorical_crossentropy'

    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)

    model.compile(optimizer=optimizer, loss=loss, metrics=['accuracy'])
    logging.info(f"Model for dataset '{dataset_name}' created and compiled.")
    return model

def create_global_model(dataset_name, input_shape, num_classes, learning_rate=0.001):
    """
    Creates the global model used by the server.

    Parameters:
        dataset_name (str): Name of the dataset.
        input_shape (tuple): Shape of the input data.
        num_classes (int): Number of classes for classification.
        learning_rate (float): Learning rate for the optimizer.

    Returns:
        tf.keras.Model: The compiled Keras model.
    """
    return create_model(dataset_name, input_shape, num_classes, learning_rate)
