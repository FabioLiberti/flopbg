import numpy as np
import tensorflow as tf
import logging
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    accuracy_score, confusion_matrix, roc_auc_score, roc_curve
)
from typing import Optional, Dict, Any

try:
    from typing import Literal
except ImportError:
    from typing_extensions import Literal

def evaluate_with_metrics(
    model,
    test_images: np.ndarray,
    test_labels: np.ndarray,
    average: Optional[Literal['micro', 'macro', 'samples', 'weighted', 'binary']] = 'macro'
) -> Dict[str, Any]:
    """
    Evaluates the model using precision, recall, F1-score, accuracy, AUC-ROC, and ROC Curve.

    Parameters:
        model: Trained model that implements the predict method.
        test_images (np.ndarray): Test data (input).
        test_labels (np.ndarray): Test labels (target).
        average (str): Type of averaging for the metrics.

    Returns:
        dict: Dictionary containing the calculated metrics.
    """
    # Check dimensions
    if len(test_images) != len(test_labels):
        raise ValueError("Number of images and labels must be the same.")
    # Check the model
    if not hasattr(model, 'predict'):
        raise AttributeError("The provided model does not have a 'predict' method.")

    # Predictions
    predictions = model.predict(test_images)
    if predictions.ndim > 1 and predictions.shape[1] > 1:
        # Probabilities for multiclass problems
        predicted_classes = np.argmax(predictions, axis=1)
    else:
        # Predictions for binary problems
        predicted_classes = (predictions > 0.5).astype(int).flatten()

    # Ensure labels are scalar
    if test_labels.ndim > 1 and test_labels.shape[1] > 1:
        test_labels = np.argmax(test_labels, axis=1)
    elif test_labels.ndim > 1:
        test_labels = test_labels.flatten()

    # Convert labels and predictions to integer type
    test_labels = test_labels.astype(int)
    predicted_classes = predicted_classes.astype(int)

    # Calculate metrics
    precision = precision_score(test_labels, predicted_classes, average=average, zero_division=0)
    recall = recall_score(test_labels, predicted_classes, average=average, zero_division=0)
    f1 = f1_score(test_labels, predicted_classes, average=average, zero_division=0)
    accuracy = accuracy_score(test_labels, predicted_classes)

    # Calculate AUC-ROC, ROC Curve and Confusion Matrix
    try:
        num_classes = model.output_shape[-1]

        # Confusion matrix with explicit labels to always include all classes
        if num_classes is not None and num_classes > 1:
            cm = confusion_matrix(test_labels, predicted_classes, labels=list(range(num_classes)))
        else:
            cm = confusion_matrix(test_labels, predicted_classes)

        if num_classes == 1 or num_classes is None:
            # Binary classification
            auc_roc = roc_auc_score(test_labels, predictions.ravel())
            fpr, tpr, thresholds = roc_curve(test_labels, predictions.ravel())
            roc_curve_data = {'fpr': fpr.tolist(), 'tpr': tpr.tolist()}
        else:
            # Multiclass classification
            y_test_binary = tf.keras.utils.to_categorical(test_labels, num_classes)
            auc_roc = roc_auc_score(y_test_binary, predictions, average='macro', multi_class='ovr')
            # Calculate ROC Curve for each class
            roc_curve_data = {}
            for i in range(num_classes):
                fpr, tpr, thresholds = roc_curve(y_test_binary[:, i], predictions[:, i])
                roc_curve_data[str(i)] = {'fpr': fpr.tolist(), 'tpr': tpr.tolist()}
    except Exception as e:
        logging.error(f"Error in calculating AUC-ROC: {e}")
        auc_roc = None
        roc_curve_data = None
        if 'cm' not in dir():
            cm = confusion_matrix(test_labels, predicted_classes)

    # Convert confusion matrix to list for JSON serialization
    cm_list = cm.tolist()

    # Convert all metric values to Python floats
    metrics = {
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'accuracy': float(accuracy),
        'auc_roc': float(auc_roc) if auc_roc is not None else None,
        'roc_curve_data': roc_curve_data,
        'confusion_matrix': cm_list,
        'predicted_labels': predicted_classes.tolist()  # Adding predicted labels        
    }

    # Log the metrics for debugging
    logging.info("Metrics calculated:")
    for key, value in metrics.items():
        logging.info(f"{key}: {value}")

    return metrics
