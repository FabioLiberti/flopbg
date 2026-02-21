# main.py

import os
import yaml
import logging
import random
import numpy as np
import datetime
import time
import json
import threading
import shutil
import matplotlib.pyplot as plt
import tensorflow as tf

from typing import Dict, List, Optional, Tuple, Any
from data.data_loading import load_data, split_data_non_iid, split_data_among_clients
from clients.client import Client
from clients.client_manager import ClientManager
from server.server import Server
from utils.metrics import evaluate_with_metrics
from utils.visualization import (
    plot_overall_comparison,
    plot_results,
    print_and_plot_results_table,
    plot_centralized_vs_federated_comparison,
    plot_execution_times,
    plot_client_data_distribution,
    plot_client_participation,
    create_client_statistics_table,
    plot_client_training_times,
    plot_samples_per_client_across_datasets,
    plot_client_participation_across_datasets,
    plot_class_distribution_across_datasets,
    plot_combined_client_statistics_table
)

# Controllo della versione di TensorFlow
print("TensorFlow Version:", tf.__version__)

def select_active_clients(client_manager, participation_rate, round_num, max_rounds):
    """
    Seleziona un sottoinsieme casuale di client attivi in base al tasso di partecipazione.
    Regola dinamicamente il tasso di partecipazione nel tempo.
    """
    all_clients = client_manager.get_active_clients()
    num_clients = len(all_clients)
    # Regola dinamicamente il tasso di partecipazione (esempio: aumenta nel tempo)
    dynamic_rate = participation_rate + (1 - participation_rate) * (round_num / max_rounds)
    num_active = max(1, int(num_clients * dynamic_rate))
    active_clients = random.sample(all_clients, num_active)
    return active_clients

def plot_client_types(client_types_config, save_fig=False, fig_filename=None, show_fig=True):
    """
    Plot delle proporzioni dei tipi di client.
    """
    client_types = list(client_types_config.keys())
    proportions = [client_types_config[ctype]['proportion'] for ctype in client_types]
    plt.figure(figsize=(6,6))
    plt.pie(proportions, labels=client_types, autopct='%1.1f%%', startangle=140)
    plt.title('Proporzioni dei Tipi di Client')
    if save_fig and fig_filename:
        plt.savefig(fig_filename)
    if show_fig:
        plt.show()
    else:
        plt.close()

def create_dataset(images, labels, batch_size):
    """
    Crea un dataset TensorFlow da immagini ed etichette.
    """
    dataset = tf.data.Dataset.from_tensor_slices((images, labels))
    dataset = dataset.shuffle(buffer_size=1024).batch(batch_size)
    return dataset

def main():
    # Registra l'ora di inizio
    start_time = datetime.datetime.now()
    start_time_str = start_time.strftime("%Y%m%d_%H%M")

    # Carica la configurazione
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, 'config.yaml')

    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
    except FileNotFoundError:
        logging.error(f"File di configurazione non trovato al percorso: {config_path}")
        return

    # Estrae i parametri dalla configurazione
    global_epochs = config['global_epochs']
    local_epochs = config['local_epochs']
    num_clients = config['num_clients']
    participation_rate = config.get('participation_rate', 1.0)  # Default a 1.0 se non specificato
    learning_rate = config.get('learning_rate', 0.001)
    batch_size = config.get('batch_size', 32)
    quantization_bits = config.get('quantization_bits', 8)
    mu = config.get('mu', 0.1)  # Coefficiente per FedProx
    early_stopping_patience = config.get('early_stopping_patience', 5)  # Per early stopping

    # Estrae le tipologie di client dalla configurazione
    client_types_config = config.get('client_types', {})

    # Formatta i parametri per il nome della directory
    nn = f"{global_epochs:02d}eg"  # Numero di epoche globali
    mm = f"{local_epochs:02d}el"   # Numero di epoche locali
    zz = f"{num_clients:02d}cl"    # Numero di client

    # Crea la directory dei report con il nuovo formato
    reports_root_dir = os.path.join(script_dir, "_Reports_")
    execution_dir_name = f"rpt_{start_time_str}_{nn}{mm}{zz}"
    execution_dir = os.path.join(reports_root_dir, execution_dir_name)
    os.makedirs(execution_dir, exist_ok=True)

    # Salva una copia di config.yaml nella directory di esecuzione
    shutil.copy(config_path, os.path.join(execution_dir, 'config.yaml'))

    # Salva i parametri di esecuzione in un file JSON
    execution_parameters = {
        'global_epochs': global_epochs,
        'local_epochs': local_epochs,
        'num_clients': num_clients,
        'participation_rate': participation_rate,
        'learning_rate': learning_rate,
        'batch_size': batch_size,
        'quantization_bits': quantization_bits,
        'mu': mu,
        'early_stopping_patience': early_stopping_patience,
        'client_types': client_types_config,
        'datasets': config['datasets']
    }

    with open(os.path.join(execution_dir, 'execution_parameters.json'), 'w') as f:
        json.dump(execution_parameters, f, indent=4)

    # Configura il logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    # Plot delle proporzioni dei tipi di client
    plot_client_types(
        client_types_config,
        save_fig=True,
        fig_filename=os.path.join(execution_dir, 'client_types_proportions.png'),
        show_fig=False
    )

    data_split_method = 'non_iid'  # Cambia in 'iid' per utilizzare split_data_among_clients

    #all_results = {}
    all_results: Dict[str, Dict[str, Any]] = {}

    execution_times = {}

    # Dizionari per raccogliere dati tra i dataset
    client_datasets_per_dataset = {}
    client_participation_per_dataset = {}
    client_statistics_per_dataset = {}

    # Inizializza un dizionario per le metriche in tempo reale (per la dashboard)
    realtime_metrics = {
        'rounds': [],
        'federated_loss': [],
        'federated_accuracy': [],
        'centralized_loss': [],
        'centralized_accuracy': []
    }

    for dataset_info in config['datasets']:
        dataset_name = dataset_info['name']
        input_shape = tuple(dataset_info['input_shape'])
        num_classes = dataset_info['num_classes']

        logging.info(f"\nProcessing {dataset_name} dataset:")
        try:
            # Registra l'ora di inizio per il dataset
            dataset_start_time = time.time()

            # Carica e suddivide i dati
            (train_data, test_data) = load_data(dataset_name)
            if data_split_method == 'non_iid':
                client_datasets = split_data_non_iid(train_data[0], train_data[1], num_clients)
            else:
                client_datasets = split_data_among_clients(train_data[0], train_data[1], num_clients)

            # Raccoglie i dataset dei client
            client_datasets_per_dataset[dataset_name] = client_datasets

            # Inizializza il gestore dei client
            client_manager = ClientManager()

            # Assegna le capacit� ai client in base alle tipologie definite
            client_capabilities = {}
            client_ids = list(range(num_clients))
            random.shuffle(client_ids)  # Mescola gli ID dei client per assegnare casualmente le tipologie

            client_type_names = list(client_types_config.keys())
            client_type_proportions = [client_types_config[ctype]['proportion'] for ctype in client_type_names]

            # Calcola il numero di client per ogni tipologia
            client_type_counts = [int(num_clients * proportion) for proportion in client_type_proportions]
            # Aggiusta per eventuali arrotondamenti
            total_assigned = sum(client_type_counts)
            if total_assigned < num_clients:
                client_type_counts[0] += num_clients - total_assigned  # Aggiusta il primo tipo

            current_index = 0
            for count, ctype in zip(client_type_counts, client_type_names):
                for _ in range(count):
                    client_id = client_ids[current_index]
                    client_capabilities[client_id] = {
                        'computational_power': client_types_config[ctype]['computational_power'],
                        'network_speed': client_types_config[ctype]['network_speed'],
                        'local_epochs': local_epochs,
                        'batch_size': batch_size
                    }
                    current_index += 1

            # Inizializza i client e li registra nel gestore
            for client_id in range(num_clients):
                client_data = client_datasets[client_id]
                test_data_client = test_data  # Puoi suddividere i test_data se necessario

                capabilities = client_capabilities.get(client_id, {
                    'computational_power': 1.0,
                    'network_speed': 1.0,
                    'local_epochs': local_epochs,
                    'batch_size': batch_size
                })

                client = Client(
                    client_id=client_id,
                    client_data=client_data,
                    test_data=test_data_client,
                    input_shape=input_shape,
                    num_classes=num_classes,
                    learning_rate=learning_rate,
                    local_epochs=capabilities.get('local_epochs', local_epochs),
                    batch_size=capabilities.get('batch_size', batch_size),
                    computational_power=capabilities.get('computational_power', 1.0),
                    network_speed=capabilities.get('network_speed', 1.0)
                )
                client_manager.register_client(client)

            # Inizializza il server
            server = Server(input_shape, num_classes, learning_rate)

            # Addestramento centralizzato per confronto
            centralized_model = server.global_model
            # Crea dataset per addestramento centralizzato
            centralized_train_dataset = create_dataset(train_data[0], train_data[1], batch_size)
            centralized_model.fit(centralized_train_dataset, epochs=global_epochs, verbose='0')
            test_loss, test_acc = centralized_model.evaluate(test_data[0], test_data[1], verbose='0')
            metrics = evaluate_with_metrics(centralized_model, test_data[0], test_data[1])

            centralized_metrics = {
                'loss': test_loss,
                'accuracy': test_acc,
                'precision': metrics['precision'],
                'recall': metrics['recall'],
                'f1': metrics['f1_score']
            }
            logging.info(f"Centralized Metrics ({dataset_name}): {centralized_metrics}")

            # Salva le metriche centralizzate per la dashboard
            realtime_metrics['centralized_loss'].append(centralized_metrics['loss'])
            realtime_metrics['centralized_accuracy'].append(centralized_metrics['accuracy'])

            # Reinizializza il modello globale per il Federated Learning
            server.global_model = Server(input_shape, num_classes, learning_rate).global_model

            # Inizializza variabili per early stopping
            best_loss = float('inf')
            patience_counter = 0
            best_weights = None

            # Crea un writer per TensorBoard
            log_dir = os.path.join(execution_dir, f'logs_{dataset_name}')
            summary_writer = tf.summary.create_file_writer(log_dir)

            # Ciclo di addestramento federato
            federated_metrics = {
                'loss': [],
                'accuracy': [],
                'precision': [],
                'recall': [],
                'f1': []
            }

            # Dizionari per registrare la partecipazione e i tempi di addestramento dei client
            client_participation = {client_id: [] for client_id in range(num_clients)}
            client_training_times = {client_id: [] for client_id in range(num_clients)}

            for round_num in range(global_epochs):
                logging.info(f"Round {round_num + 1}/{global_epochs}")

                # Seleziona i client attivi
                active_clients = select_active_clients(client_manager, participation_rate, round_num, global_epochs)

                # Initialize lists to collect client updates
                client_weights = []
                client_samples = []

                # Record client participation and initialize training times
                for client in client_manager.get_active_clients():
                    if client in active_clients:
                        client_participation[client.client_id].append(1)
                        # Il tempo di addestramento verr� aggiunto durante l'addestramento
                    else:
                        client_participation[client.client_id].append(0)
                        # Aggiungi 0 al tempo di addestramento per questo round
                        client_training_times[client.client_id].append(0)

                # Funzione per addestrare un client (per threading)
                def train_client(
                    client: Client, 
                    server_weights: Any, 
                    quantization_bits: int, 
                    results: List[Optional[Tuple[int, Any, int]]], 
                    idx: int
                ) -> None:
                    try:
                        # Simula ritardi computazionali e di rete (ridotti al minimo)
                        computational_delay = 1.0 / client.computational_power * 0.001
                        network_delay = 1.0 / client.network_speed * 0.001

                        client_start_time = time.time()

                        # Simula il ritardo computazionale
                        time.sleep(computational_delay)

                        weights = client.train(
                            server_weights,
                            quantization_bits=quantization_bits,
                            personalize=False  # Imposta a True se vuoi eseguire la personalizzazione
                        )

                        # Simula il ritardo di rete
                        time.sleep(network_delay)

                        client_end_time = time.time()
                        training_time = client_end_time - client_start_time
                        client_training_times[client.client_id].append(training_time)
                        results[idx] = (client.client_id, weights, len(client.train_images))
                    except Exception as e:
                        logging.error(f"Error training client {client.client_id}: {e}", exc_info=True)
                        results[idx] = None  # Imposta esplicitamente a None per indicare un fallimento

                # Esegui l'addestramento dei client in parallelo
                threads = []
                results: List[Optional[Tuple[int, Any, int]]] = [None] * len(active_clients)
                for idx, client in enumerate(active_clients):
                    t = threading.Thread(target=train_client, args=(
                        client, server.global_model.get_weights(), quantization_bits, results, idx))
                    threads.append(t)
                    t.start()

                for t in threads:
                    t.join()

                # Raccogli i risultati
                for res in results:
                    if res is not None:
                        client_id, weights, num_samples = res
                        client_weights.append(weights)
                        client_samples.append(num_samples)
                    else:
                        logging.warning("Client update is None and will be skipped.")

                # Aggrega gli aggiornamenti utilizzando FedProx
                if client_weights:
                    server.aggregate_weights_prox(client_weights, client_samples, mu=mu)
                else:
                    logging.warning("No client updates received in this round.")

                # Valuta il modello globale
                test_loss, test_acc = server.global_model.evaluate(test_data[0], test_data[1], verbose='0')
                metrics = evaluate_with_metrics(server.global_model, test_data[0], test_data[1])

                federated_metrics['loss'].append(test_loss)
                federated_metrics['accuracy'].append(test_acc)
                federated_metrics['precision'].append(metrics['precision'])
                federated_metrics['recall'].append(metrics['recall'])
                federated_metrics['f1'].append(metrics['f1_score'])

                logging.info(f"Round {round_num + 1}, Test Loss: {test_loss:.4f}, Accuracy: {test_acc:.4f}, "
                             f"Precision: {metrics['precision']:.4f}, Recall: {metrics['recall']:.4f}, "
                             f"F1: {metrics['f1_score']:.4f}")

                # Aggiorna le metriche in tempo reale
                realtime_metrics['rounds'].append(round_num + 1)
                realtime_metrics['federated_loss'].append(test_loss)
                realtime_metrics['federated_accuracy'].append(test_acc)

                # Salva le metriche in un file JSON
                with open(os.path.join(execution_dir, 'realtime_metrics.json'), 'w') as f:
                    json.dump(realtime_metrics, f)

                # Logga le metriche su TensorBoard
                with summary_writer.as_default():
                    tf.summary.scalar('Federated Loss', test_loss, step=round_num + 1)
                    tf.summary.scalar('Federated Accuracy', test_acc, step=round_num + 1)
                    tf.summary.scalar('Federated Precision', metrics['precision'], step=round_num + 1)
                    tf.summary.scalar('Federated Recall', metrics['recall'], step=round_num + 1)
                    tf.summary.scalar('Federated F1 Score', metrics['f1_score'], step=round_num + 1)
                    summary_writer.flush()

                # Early Stopping
                if test_loss < best_loss:
                    best_loss = test_loss
                    patience_counter = 0
                    best_weights = server.global_model.get_weights()
                else:
                    patience_counter += 1

                if patience_counter >= early_stopping_patience:
                    logging.info(f"Early stopping al round {round_num + 1}")
                    break

                # Salvataggio del modello
                # server.global_model.save(os.path.join(execution_dir, f'global_model_round_{round_num + 1}_{dataset_name}.h5'))
                server.global_model.save(os.path.join(execution_dir, f'global_model_round_{round_num + 1}_{dataset_name}.keras'))

                
            # Ripristina i pesi migliori se necessario
            if best_weights is not None:
                server.global_model.set_weights(best_weights)

            all_results[dataset_name] = {'centralized': centralized_metrics, 'federated': federated_metrics}

            # Registra l'ora di fine per il dataset e calcola la durata
            dataset_end_time = time.time()
            dataset_duration = dataset_end_time - dataset_start_time
            execution_times[dataset_name] = dataset_duration
            logging.info(f"Processing time for {dataset_name}: {dataset_duration:.2f} seconds")

            # Registra la partecipazione dei client per il dataset
            client_participation_per_dataset[dataset_name] = client_participation

            # Crea la tabella delle statistiche dei client
            client_stats_df = create_client_statistics_table(
                client_datasets,
                client_participation,
                global_epochs,
                local_epochs,
                num_clients,
                dataset_name,
                save_csv=True,
                csv_filename=os.path.join(execution_dir, f'{dataset_name}_client_statistics.csv'),
                save_fig=True,
                fig_filename=os.path.join(execution_dir, f'{dataset_name}_client_statistics.png'),
                show_fig=False
            )

            # Raccoglie il DataFrame delle statistiche dei client
            client_statistics_per_dataset[dataset_name] = client_stats_df

            # Plot dei tempi di addestramento dei client
            plot_client_training_times(client_training_times, global_epochs, local_epochs, num_clients, dataset_name, save_fig=True,
                                       fig_filename=os.path.join(execution_dir, f'{dataset_name}_client_training_times.png'), show_fig=False)

            # Genera i plot utilizzando Matplotlib
            rounds = realtime_metrics['rounds']
            federated_loss = realtime_metrics['federated_loss']
            federated_accuracy = realtime_metrics['federated_accuracy']

            plt.figure()
            plt.plot(rounds, federated_loss, label='Federated Loss')
            plt.xlabel('Rounds')
            plt.ylabel('Loss')
            plt.title(f'Federated Loss su {dataset_name}')
            plt.legend()
            plt.savefig(os.path.join(execution_dir, f'{dataset_name}_federated_loss.png'))
            plt.close()

            plt.figure()
            plt.plot(rounds, federated_accuracy, label='Federated Accuracy')
            plt.xlabel('Rounds')
            plt.ylabel('Accuracy')
            plt.title(f'Federated Accuracy su {dataset_name}')
            plt.legend()
            plt.savefig(os.path.join(execution_dir, f'{dataset_name}_federated_accuracy.png'))
            plt.close()

        except Exception as e:
            logging.error(f"Error processing {dataset_name}: {e}", exc_info=True)

    # Visualizza e salva i risultati
    plot_overall_comparison(all_results, global_epochs, local_epochs, num_clients, save_fig=True,
                            filename_prefix=os.path.join(execution_dir, 'overall_comparison'), show_fig=False)

    plot_centralized_vs_federated_comparison(all_results, global_epochs, local_epochs, num_clients, save_fig=True,
                                             filename=os.path.join(execution_dir, 'centralized_vs_federated_comparison.png'), show_fig=False)

    for dataset_name, dataset_results in all_results.items():
        plot_results(dataset_results['centralized'], dataset_results['federated'], dataset_name, global_epochs, local_epochs, num_clients,
                     save_fig=True, filename_prefix=os.path.join(execution_dir, f'{dataset_name}_metrics_comparison'), show_fig=False)

    print_and_plot_results_table(all_results, global_epochs, local_epochs, num_clients, save_csv=True,
                                 csv_filename=os.path.join(execution_dir, 'results_table.csv'),
                                 save_fig=True, fig_filename=os.path.join(execution_dir, 'results_table.png'), show_fig=False)

    # Plot combinato della distribuzione dei dati dei client
    plot_samples_per_client_across_datasets(
        client_datasets_per_dataset,
        global_epochs,
        local_epochs,
        num_clients,
        save_fig=True,
        fig_filename=os.path.join(execution_dir, 'samples_per_client_across_datasets.png'),
        show_fig=False
    )

    # Plot combinato della partecipazione dei client
    plot_client_participation_across_datasets(
        client_participation_per_dataset,
        global_epochs,
        local_epochs,
        num_clients,
        save_fig=True,
        fig_filename=os.path.join(execution_dir, 'client_participation_across_datasets.png'),
        show_fig=False
    )

    # Plot combinato della distribuzione delle classi
    plot_class_distribution_across_datasets(
        client_datasets_per_dataset,
        global_epochs,
        local_epochs,
        num_clients,
        save_fig=True,
        fig_filename=os.path.join(execution_dir, 'class_distribution_across_datasets.png'),
        show_fig=False
    )

    # Plot della tabella combinata delle statistiche dei client
    plot_combined_client_statistics_table(
        client_statistics_per_dataset,
        global_epochs,
        local_epochs,
        num_clients,
        save_csv=True,
        csv_filename=os.path.join(execution_dir, 'combined_client_statistics.csv'),
        save_fig=True,
        fig_filename=os.path.join(execution_dir, 'combined_client_statistics.png'),
        show_fig=False
    )

    # Stampa i tempi di esecuzione
    end_time = datetime.datetime.now()
    duration = end_time - start_time

    print(f"\nExecution started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Execution ended at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total execution time: {duration}")

    # Stampa i tempi di esecuzione per ciascun dataset
    print("\nDataset Execution Times:")
    for dataset_name, dataset_duration in execution_times.items():
        print(f"{dataset_name}: {dataset_duration:.2f} seconds")

    # Plot dei tempi di esecuzione
    plot_execution_times(execution_times, save_fig=True,
                         fig_filename=os.path.join(execution_dir, 'execution_times.png'), show_fig=False)

if __name__ == '__main__':
    main()



