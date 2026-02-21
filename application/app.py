# application/app.py

import os
import io
import threading
import logging
import yaml
import numpy as np
import tensorflow as tf
import base64
import json
from datetime import datetime
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from federated_learning_system import FederatedLearningSystem
from utils.sanitization import sanitize_data
from report_manager import ReportManager
from reports.fl_reports import setup_fl_reports, save_results_for_reports


app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

# Set up the configuration file path relative to this file's directory
current_dir = os.path.abspath(os.path.dirname(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))
config_path = os.path.join(parent_dir, 'config.yaml')
reports_root_dir = os.path.join(current_dir, "_Reports_")
logging.info(f"Directory report: {reports_root_dir}")
logging.debug(f"Percorso assoluto cartella report: {os.path.abspath(reports_root_dir)}")


try:
    os.makedirs(reports_root_dir, exist_ok=True)
    test_file = os.path.join(reports_root_dir, 'test.txt')
    with open(test_file, 'w') as f:
        f.write('test')
    os.remove(test_file)
    logging.info(f"Reports root directory verified: {reports_root_dir}")
except Exception as e:
    logging.error(f"Error verifying reports directory: {e}")
    raise


# Verifica la creazione directory
if not os.path.exists(reports_root_dir):
    logging.info("Creazione directory _Reports_")
    os.makedirs(reports_root_dir, exist_ok=True)

# Load the configuration from config.yaml
try:
    with open(config_path, 'r') as config_file:
        config = yaml.safe_load(config_file)
except FileNotFoundError:
    logging.error(f"Config file not found at {config_path}")
    config = {}  # Initialize an empty config if the file is not found

# Inizializza il report manager
report_manager = ReportManager()
logging.info("Report Manager inizializzato")

# Initialize the federated learning system
fl_system = FederatedLearningSystem(config)

# List of valid dataset names
valid_datasets = [
    "mnist",
    "fashion_mnist",
    "cifar10",
    "cifar100",
    "svhn",
    "chest_xray",
    "isic",
    "brain_tumor", 
    "brain_tumor_mri",  
    "retinopathy",      
    "skin_cancer"       
]

@app.route('/api/datasets', methods=['GET'])
def get_datasets():
    datasets_generici = [
        {"name": "mnist", "display_name": "MNIST"},
        {"name": "fashion_mnist", "display_name": "Fashion MNIST"},
        {"name": "cifar10", "display_name": "CIFAR-10"},
        {"name": "cifar100", "display_name": "CIFAR-100"},
        {"name": "svhn", "display_name": "SVHN"}
    ]

    datasets_clinici = [
        {"name": "chest_xray", "display_name": "Chest X-ray"},
        {"name": "isic", "display_name": "ISIC"},
        {"name": "brain_tumor", "display_name": "Brain Tumor MRI", "highlight": True},
        {"name": "brain_tumor_mri", "display_name": "Brain Tumor MRI", "highlight": True},
        {"name": "retinopathy", "display_name": "Diabetic Retinopathy", "highlight": True},
        {"name": "skin_cancer", "display_name": "Skin Cancer", "highlight": True}  
    ]

    response = {
        "generici": datasets_generici,
        "clinici": datasets_clinici
    }

    return jsonify(response), 200

@app.route('/config', methods=['POST'])
def configure_experiment():
    try:
        config_data = request.get_json()
        logging.info(f"Received configuration: {config_data}")
        logging.info(f"Type of config_data: {type(config_data)}")

        if not config_data:
            return jsonify({"status": "error", "message": "No configuration data received"}), 400

        dataset_name = config_data.get('dataset_name')
        if not dataset_name:
            return jsonify({"status": "error", "message": "Dataset name is required"}), 400

        # Validate the dataset name
        if dataset_name not in valid_datasets:
            return jsonify({"status": "error", "message": f"Dataset '{dataset_name}' not supported"}), 400

        # start_time_str = datetime.datetime.now().strftime("%Y%m%d_%H%M")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        # execution_dir = os.path.join(reports_root_dir, f"rpt_{start_time_str}")
        execution_dir = os.path.join(reports_root_dir, f"rpt_{timestamp}")
        logging.debug(f"Creating reports directory at: {execution_dir}")


        try:
            os.makedirs(execution_dir, exist_ok=True)
            logging.debug(f"Reports directory created successfully")
        except Exception as e:
            logging.error(f"Error creating reports directory: {e}")
            raise
        
        # Configure reports con più log
        try:
            logging.debug("Configuring reports with report manager...")
            setup_fl_reports(report_manager, execution_dir)
            logging.debug("Reports configured successfully")
            
            logging.debug("Starting report scheduler...")
            report_manager.start_scheduler()
            logging.debug("Report scheduler started successfully")
        except Exception as e:
            logging.error(f"Error in report setup: {e}")
            raise

        logging.info(f"Reports configuration complete. Directory: {execution_dir}")

        
        setup_fl_reports(report_manager, execution_dir)
        report_manager.start_scheduler()
        logging.info(f"Report configurati in: {execution_dir}")

        num_clients = int(config_data.get('num_clients', config.get('num_clients', 10)))
        client_types = config_data.get('client_types', config.get('client_types', {}))
        client_dynamism = config_data.get('client_dynamism', config.get('client_dynamism', {}))

        # Debugging logs
        logging.info(f"Dataset Name: {dataset_name}")
        logging.info(f"Num Clients: {num_clients}")
        logging.info(f"Client Types: {client_types}")
        logging.info(f"Client Dynamism: {client_dynamism}")

        # Configure the federated learning system
        fl_system.configure(
            dataset_name=dataset_name,
            num_clients=num_clients,
            client_types=client_types,
            client_dynamism=client_dynamism,
        )

        # Update the global configuration
        config.update(config_data)

        # Update nodes if present
        if 'nodes' in config_data:
            config['nodes'] = config_data['nodes']

        # Save the updated configuration to file
        with open(config_path, 'w') as f:
            yaml.dump(config, f)

        return jsonify({"message": "System configured successfully", "status": "success"}), 200
    except Exception as e:
        logging.error(f"Error in /config: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/config', methods=['GET'])
def get_config():
    try:
        # Return the current configuration
        config_data = fl_system.get_current_config()
        return jsonify(config_data), 200
    except Exception as e:
        logging.error(f"Error in /config (GET): {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/start', methods=['POST'])
def start_experiment():
    try:
        data = request.json
        logging.info(f"Received start request with data: {data}")

        if not fl_system.is_configured:
            return jsonify({"message": "System not configured. Call /config first.", "status": "error"}), 400


        # Crea una nuova directory per questo esperimento
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        experiment_dir = os.path.join(reports_root_dir, f"rpt_{timestamp}")
        logging.debug(f"Creating experiment directory: {experiment_dir}")
        
        try:
            os.makedirs(experiment_dir, exist_ok=True)
            logging.info(f"Created experiment directory at: {experiment_dir}")
        except Exception as e:
            logging.error(f"Failed to create experiment directory: {e}")
            return jsonify({"status": "error", "message": str(e)}), 400


        # Prima di avviare l'esperimento, salva la configurazione
        config_file = os.path.join(experiment_dir, 'experiment_config.json')
        try:
            experiment_config = {
                'num_rounds' : int(data.get('num_rounds', config.get('global_epochs', 5))),
                'local_epochs' : int(data.get('local_epochs', config.get('local_epochs', 1))),
                'batch_size' : int(data.get('batch_size', config.get('batch_size', 32))),
                'learning_rate' : float(data.get('learning_rate', config.get('learning_rate', 0.01))),
                'mu' : float(data.get('mu', config.get('mu', 0.0))),
                'quantization_bits' : int(data.get('quantization_bits', config.get('quantization_bits', 32))),
                'global_participation_rate' : float(data.get('global_participation_rate', config.get('global_participation_rate', 1.0)))
            }
            
            # Debugging logs
            for key, value in experiment_config.items():
                logging.info(f"{key}: {value}")

            with open(config_file, 'w') as f:
                json.dump(experiment_config, f, indent=4)
            logging.info(f"Saved experiment configuration to: {config_file}")
        except Exception as e:
            logging.error(f"Failed to save experiment configuration: {e}")
            return jsonify({"status": "error", "message": str(e)}), 400


        # Reset the federated learning system's state
        fl_system.reset_state()

        # Define a function to run the experiment
        def run_experiment():
            try:
                fl_system.start_experiment(**experiment_config)
                
                # Salva i risultati iniziali
                initial_results = {
                    'timestamp': timestamp,
                    'config': experiment_config,
                    'status': 'started'
                }
                save_results_for_reports(initial_results, experiment_dir)
                logging.info(f"Initial results saved in: {experiment_dir}")
                
            except Exception as e:
                logging.error(f"Error during experiment: {str(e)}")
                save_results_for_reports({
                    'timestamp': timestamp,
                    'status': 'error',
                    'error': str(e)
                }, experiment_dir)

        # Start the experiment in a new thread
        experiment_thread = threading.Thread(target=run_experiment)
        experiment_thread.start()

        return jsonify({
            "message": "Experiment started", 
            "status": "success",
            "experiment_dir": experiment_dir
        }), 200
        
    except Exception as e:
            logging.error(f"Error during experiment: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 400
    
    except Exception as e:
        logging.error(f"Error in /start: {str(e)}")
        return jsonify({"message": str(e), "status": "error"}), 400

@app.route('/status', methods=['GET'])
def get_status():
    try:
        state = fl_system.get_current_state()
        sanitized_state = sanitize_data(state)
        return jsonify(sanitized_state), 200
    except Exception as e:
        logging.error(f"Error in /status: {str(e)}")
        return jsonify({"message": str(e), "status": "error"}), 400

@app.route('/stop', methods=['POST'])
def stop_experiment():
    try:
        fl_system.stop_experiment()
        return jsonify({"message": "Experiment stopped", "status": "success"}), 200
    except Exception as e:
        logging.error(f"Error in /stop: {str(e)}")
        return jsonify({"message": str(e), "status": "error"}), 400

# Endpoint to get real and predicted images
@app.route('/api/images', methods=['GET'])
def get_images():
    try:
        # Get the dataset name from the request parameters (default: chest_xray)
        dataset_name = request.args.get('dataset_name')
        num_images = int(request.args.get('num_images', 10))  # Number of images to return

        if not dataset_name:
            logging.error("Dataset name is required.")
            return jsonify({"message": "Dataset name is required."}), 400

        # Datasets loaded in memory
        memory_datasets = ['mnist', 'fashion_mnist', 'cifar10', 'cifar100']

        if dataset_name in memory_datasets:
            return get_memory_images(dataset_name, num_images)

        # Mapping of dataset paths
        dataset_paths = {
            'chest_xray': os.path.join(parent_dir, 'data', 'chest_xray', 'test'),
            'isic': os.path.join(parent_dir, 'data', 'ISIC', 'test'),
            'svhn': os.path.join(parent_dir, 'data', 'svhn', 'test'),
            'brain_tumor': os.path.join(parent_dir, 'data', 'Brain_Tumor'),
            'brain_tumor_mri': os.path.join(parent_dir, 'data', 'Brain Tumor MRI', 'Testing'),
            'retinopathy': os.path.join(parent_dir, 'data', 'Retinopatia'),        
            'skin_cancer': os.path.join(parent_dir, 'data', 'Skin Cancer', 'test')
        }

        # Verify that the dataset is supported
        if dataset_name not in dataset_paths:
            logging.error(f"Dataset '{dataset_name}' not supported.")
            return jsonify({"message": f"Dataset '{dataset_name}' not supported."}), 400

        # Get the correct path for the dataset
        real_images_path = dataset_paths[dataset_name]

        # Get all subfolders representing classes
        try:
            classes = [cls for cls in os.listdir(real_images_path) if os.path.isdir(os.path.join(real_images_path, cls))]
        except FileNotFoundError:
            logging.error(f"Path '{real_images_path}' not found.")
            return jsonify({"message": f"Path '{real_images_path}' not found."}), 404

        real_images = []
        images = []
        real_labels = []
        total_images_collected = 0

        for class_name in classes:
            class_dir = os.path.join(real_images_path, class_name)
            try:
                class_images = os.listdir(class_dir)
            except FileNotFoundError:
                logging.error(f"Class path '{class_dir}' not found.")
                return jsonify({"message": f"Class path '{class_dir}' not found."}), 404

            # Debugging log
            logging.info(f"Class directory: {class_dir}")

            for image_name in class_images:
                if total_images_collected >= num_images:
                    break
                image_path = os.path.join(class_dir, image_name)
                try:
                    # Load the image and add it to the list
                    img = Image.open(image_path)
                    img = img.convert('RGB')
                    if fl_system.input_shape:
                        img = img.resize(fl_system.input_shape[:2])  # Ensure fl_system.input_shape is defined
                    img_array = np.array(img)
                    images.append(img_array)
                    real_labels.append(class_name)

                    # Encode the image in base64
                    buffered = io.BytesIO()
                    img.save(buffered, format='PNG')
                    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                    real_images.append({
                        "data": img_str,
                        "format": 'PNG'
                    })

                    total_images_collected += 1
                    logging.info(f"Image filename: {image_name}")
                except Exception as e:
                    logging.error(f"Error loading image {image_name}: {e}")

            if total_images_collected >= num_images:
                break

        if not images:
            logging.error("No images found.")
            return jsonify({"message": "No images found."}), 404

        # Ensure the system is configured and the model is available
        if not fl_system.is_configured:
            logging.error("Federated Learning System is not configured.")
            return jsonify({"message": "System not configured.", "status": "error"}), 400

        try:
            # Get predictions using the loaded images
            images_array = np.array(images)
            logging.info(f"Images array shape: {images_array.shape}, dtype: {images_array.dtype}")
            predicted_labels = fl_system.get_predicted_labels(images_array)
        except Exception as e:
            logging.exception(f"Error getting predicted labels: {e}")
            return jsonify({"message": f"Error getting predicted labels: {str(e)}"}), 500

        # Prepare the JSON response with images and predictions
        response = {
            "real_images": real_images,  # Images encoded in base64
            "real_labels": real_labels,  # Real labels
            "predicted_labels": predicted_labels  # Predicted labels
        }

        logging.info(f"Response prepared with {len(real_images)} images.")

        return jsonify(response)

    except Exception as e:
        logging.exception(f"Error in /api/images endpoint: {e}")
        return jsonify({"message": "Internal Server Error"}), 500

# Function to handle datasets loaded in memory
def get_memory_images(dataset_name, num_images):
    try:
        if dataset_name == 'mnist':
            (x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
            x_data, y_data = x_test, y_test
        elif dataset_name == 'fashion_mnist':
            (x_train, y_train), (x_test, y_test) = tf.keras.datasets.fashion_mnist.load_data()
            x_data, y_data = x_test, y_test
        elif dataset_name == 'cifar10':
            (x_train, y_train), (x_test, y_test) = tf.keras.datasets.cifar10.load_data()
            x_data, y_data = x_test, y_test
            y_data = y_data.flatten()
        elif dataset_name == 'cifar100':
            (x_train, y_train), (x_test, y_test) = tf.keras.datasets.cifar100.load_data()
            x_data, y_data = x_test, y_test
            y_data = y_data.flatten()
        else:
            logging.error(f"Dataset '{dataset_name}' not supported in memory.")
            return jsonify({"message": f"Dataset '{dataset_name}' not supported."}), 400

        # Select a subset of images
        x_data = x_data[:num_images]
        y_data = y_data[:num_images]

        real_images = []
        images = []
        real_labels = y_data.tolist()
        
        # Process images
        for img_array in x_data:
            if dataset_name in ['mnist', 'fashion_mnist']:
                # For grayscale images, convert to RGB
                img_array = np.stack((img_array,)*3, axis=-1)
            img = Image.fromarray(img_array.astype('uint8'), 'RGB')

            if fl_system.input_shape:
                img = img.resize(fl_system.input_shape[:2])

            img_array = np.array(img)
            images.append(img_array)

            # Encode the image in base64
            buffered = io.BytesIO()
            img.save(buffered, format='PNG')
            img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
            real_images.append({
                "data": img_str,
                "format": 'PNG'
            })

        if not images:
            logging.error("No images found.")
            return jsonify({"message": "No images found."}), 404

        # Ensure the system is configured and the model is available
        if not fl_system.is_configured:
            logging.error("Federated Learning System is not configured.")
            return jsonify({"message": "System not configured.", "status": "error"}), 400

        try:
            # Get predictions using the loaded images
            images_array = np.array(images)
            logging.info(f"Memory images array shape: {images_array.shape}, dtype: {images_array.dtype}")
            predicted_labels = fl_system.get_predicted_labels(images_array)
        except Exception as e:
            logging.exception(f"Error getting predicted labels: {e}")
            return jsonify({"message": f"Error getting predicted labels: {str(e)}"}), 500

        # Prepare the JSON response with images and predictions
        response = {
            "real_images": real_images,      # Images encoded in base64
            "real_labels": real_labels,      # Real labels
            "predicted_labels": predicted_labels  # Already a Python list from get_predicted_labels()
        }

        logging.info(f"Response prepared with {len(real_images)} images.")

        return jsonify(response)

    except Exception as e:
        logging.exception("Exception occurred in get_memory_images")
        return jsonify({"message": "Error processing memory dataset."}), 500
    

@app.route('/data/<dataset_name>/test/<path:filename>')
def serve_image(dataset_name, filename):
    # Mapping of known dataset paths
    dataset_paths = {
        'chest_xray': os.path.join(parent_dir, 'data', 'chest_xray', 'test'),
        'isic': os.path.join(parent_dir, 'data', 'ISIC', 'test'),
        'svhn': os.path.join(parent_dir, 'data', 'svhn', 'test')
    }

    # Verify that the dataset is supported
    if dataset_name not in dataset_paths:
        return jsonify({"message": f"Dataset '{dataset_name}' not supported."}), 400

    # Get the correct dataset path
    real_images_path = dataset_paths[dataset_name]

    # Return the requested image file
    return send_from_directory(real_images_path, filename)


"""
@app.route('/nodes', methods=['GET'])
def get_nodes():
    try:
        # Load the config.yaml file
        with open(config_path, 'r') as config_file:
            config = yaml.safe_load(config_file)

        # Assume nodes are defined in config['nodes']
        nodes = config.get('nodes', [])
        return jsonify({'nodes': nodes}), 200
    except Exception as e:
        logging.error(f"Error in /nodes: {e}")
        return jsonify({"message": "Error fetching nodes."}), 500

"""

@app.route('/nodes', methods=['GET'])
def get_nodes():
    try:
        nodes_file_path = os.path.join(os.path.dirname(__file__), 'nodes.json')
        with open(nodes_file_path, 'r') as f:
            nodes = json.load(f)
        return jsonify({'nodes': nodes}), 200
    except Exception as e:
        print(f"Error reading nodes.json: {e}")
        return jsonify({'error': 'Failed to load nodes'}), 500


@app.route('/nodes', methods=['POST'])
def save_nodes():
    try:
        data = request.get_json()
        nodes = data.get('nodes')
        if not nodes:
            return jsonify({"message": "Nodes data is required."}), 400

        # Update the config with the new nodes
        config['nodes'] = nodes

        # Save the updated configuration to file
        with open(config_path, 'w') as f:
            yaml.dump(config, f)

        logging.info("Nodes saved successfully.")

        return jsonify({"message": "Nodes saved successfully."}), 200
    except Exception as e:
        logging.error(f"Error in /nodes (POST): {e}")
        return jsonify({"message": "Error saving nodes."}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
