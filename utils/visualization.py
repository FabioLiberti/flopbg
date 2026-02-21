# utils/visualization.py

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import math
import os

def plot_overall_comparison(all_results, global_epochs, local_epochs, num_clients, save_fig=False, filename_prefix='overall_comparison', show_fig=False):
    """
    Compares centralized and federated metrics across all datasets.

    Parameters:
        all_results (dict): Dictionary containing results for all datasets.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        save_fig (bool): If True, saves the plots as PNG files.
        filename_prefix (str): Prefix for the file names if save_fig is True.
        show_fig (bool): If True, displays the plots.
    """
    metrics = ['loss', 'accuracy', 'precision', 'recall', 'f1']

    for metric in metrics:
        plt.figure(figsize=(10, 6))

        for dataset_name, results in all_results.items():
            rounds = range(1, len(results['federated'][metric]) + 1)
            plt.plot(rounds, [results['centralized'][metric]] * len(rounds),
                     label=f'{dataset_name} Centralized {metric.capitalize()}')
            plt.plot(rounds, results['federated'][metric], linestyle='--',
                     label=f'{dataset_name} Federated {metric.capitalize()}')

        plt.xlabel('Federated Rounds')
        plt.ylabel(metric.capitalize())
        plt.title(f'{metric.capitalize()} Comparison Across Datasets\n(Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})')
        plt.legend()
        plt.tight_layout()

        if save_fig:
            plt.savefig(f'{filename_prefix}_{metric}.png', bbox_inches='tight', dpi=300)

        if show_fig:
            plt.show()
        else:
            plt.close()

def print_and_plot_results_table(all_results, global_epochs, local_epochs, num_clients, *, save_csv=False, csv_filename='results_table.csv', save_fig=False, fig_filename='results_table.png', show_fig=False):
    """
    Prints and displays a results table, with options to save as CSV and as an image.

    Parameters:
        all_results (dict): Dictionary containing results for all datasets.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        save_csv (bool): If True, saves the table to a CSV file.
        csv_filename (str): Name of the CSV file if save_csv is True.
        save_fig (bool): If True, saves the table as an image.
        fig_filename (str): Name of the PNG file if save_fig is True.
        show_fig (bool): If True, displays the table.
    """
    table_data = []

    for dataset_name, results in all_results.items():
        centralized_metrics = results['centralized']
        federated_metrics = results['federated']
        rounds = len(federated_metrics['accuracy'])

        table_data.append([dataset_name, 'Centralized',
                           round(centralized_metrics['loss'], 4), round(centralized_metrics['accuracy'], 4),
                           round(centralized_metrics['precision'], 4), round(centralized_metrics['recall'], 4),
                           round(centralized_metrics['f1'], 4)])

        avg_federated_loss = np.mean(federated_metrics['loss'])
        avg_federated_acc = np.mean(federated_metrics['accuracy'])
        avg_federated_prec = np.mean(federated_metrics['precision'])
        avg_federated_rec = np.mean(federated_metrics['recall'])
        avg_federated_f1 = np.mean(federated_metrics['f1'])

        table_data.append([dataset_name, 'Federated (avg)',
                           round(avg_federated_loss, 4), round(avg_federated_acc, 4),
                           round(avg_federated_prec, 4), round(avg_federated_rec, 4),
                           round(avg_federated_f1, 4)])

    results_df = pd.DataFrame(table_data, columns=['Dataset', 'Mode', 'Loss', 'Accuracy', 'Precision', 'Recall', 'F1 Score'])
    print("\nResults Table:")
    print(results_df.to_string(index=False))

    if save_csv:
        results_df.to_csv(csv_filename, index=False)

    # Convert DataFrame values to strings
    cell_text = results_df.astype(str).values.tolist()
    col_labels = results_df.columns.astype(str).tolist()

    fig, ax = plt.subplots(figsize=(12, len(results_df) * 0.5 + 2))
    ax.axis('off')
    table = ax.table(cellText=cell_text, colLabels=col_labels, cellLoc='center', loc='upper left')
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1.2, 1.2)
    plt.title(f"Results Table\n(Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})")
    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

    return results_df

def plot_results(centralized_metrics, federated_metrics, dataset_name, global_epochs, local_epochs, num_clients, save_fig=False, filename_prefix=None, show_fig=False):
    """
    Compares centralized and federated metrics for a single dataset.

    Parameters:
        centralized_metrics (dict): Centralized metrics.
        federated_metrics (dict): Federated metrics.
        dataset_name (str): Name of the dataset.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        save_fig (bool): If True, saves the plots as PNG files.
        filename_prefix (str): Prefix for the file names if save_fig is True.
        show_fig (bool): If True, displays the plots.
    """
    rounds = range(1, len(federated_metrics['accuracy']) + 1)
    metrics = ['accuracy', 'loss', 'precision', 'recall', 'f1']

    n_metrics = len(metrics)
    n_cols = 2
    n_rows = math.ceil(n_metrics / n_cols)
    fig, axs = plt.subplots(n_rows, n_cols, figsize=(15, 5 * n_rows))
    fig.suptitle(f'{dataset_name}: Centralized vs Federated Learning Metrics\n(Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})', fontsize=16)

    for i, metric in enumerate(metrics):
        ax = axs.flatten()[i]
        ax.plot(rounds, [centralized_metrics[metric]] * len(rounds), label='Centralized', color='blue')
        ax.plot(rounds, federated_metrics[metric], label='Federated', color='green', linestyle='--')
        ax.set_xlabel('Rounds')
        ax.set_ylabel(metric.capitalize())
        ax.set_title(f'{metric.capitalize()} Comparison')
        ax.legend()

    # Remove any empty subplots
    if n_metrics % n_cols != 0:
        for i in range(n_metrics, n_rows * n_cols):
            fig.delaxes(axs.flatten()[i])

    plt.tight_layout()
    plt.subplots_adjust(top=0.9)

    if save_fig:
        if filename_prefix is None:
            filename_prefix = dataset_name.replace(' ', '_') + '_metrics_comparison'
        plt.savefig(f'{filename_prefix}.png', bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

def plot_centralized_vs_federated_comparison(all_results, global_epochs, local_epochs, num_clients, *, fontsize=14, rotation=45, figsize=(15, 20), save_fig=False, filename='centralized_vs_federated_comparison.png', show_fig=False):
    """
    Creates bar charts to compare centralized and federated metrics (average) across datasets.

    Parameters:
        all_results (dict): Dictionary containing results for all datasets.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        fontsize (int): Font size for texts and titles.
        rotation (int): Rotation angle for x-axis labels.
        figsize (tuple): Figure size.
        save_fig (bool): If True, saves the plot as a PNG file.
        filename (str): Name of the file if save_fig is True.
        show_fig (bool): If True, displays the plot.
    """
    metrics = ['Loss', 'Accuracy', 'Precision', 'Recall', 'F1']
    datasets = list(all_results.keys())

    n_metrics = len(metrics)
    n_cols = 2
    n_rows = math.ceil(n_metrics / n_cols)
    fig, axs = plt.subplots(n_rows, n_cols, figsize=figsize)
    fig.suptitle(f'Centralized vs Federated Learning - Metric Comparison\n(Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})', fontsize=fontsize + 2)

    for i, metric in enumerate(metrics):
        ax = axs.flatten()[i]
        x = np.arange(len(datasets))
        width = 0.35

        centralized_values = []
        federated_values = []
        federated_std = []
        for dataset in datasets:
            results = all_results[dataset]
            centralized_values.append(results['centralized'][metric.lower()])
            federated_metric_values = results['federated'][metric.lower()]
            federated_values.append(np.mean(federated_metric_values))
            federated_std.append(np.std(federated_metric_values))

        rects1 = ax.bar(x - width/2, centralized_values, width, label='Centralized', color='#1f77b4')
        rects2 = ax.bar(x + width/2, federated_values, width, yerr=federated_std, capsize=5,
                        label='Federated (avg)', color='#ff7f0e')

        ax.set_ylabel(metric, fontsize=fontsize)
        ax.set_title(f'Comparison of {metric}', fontsize=fontsize)
        ax.set_xticks(x)
        ax.set_xticklabels(datasets, rotation=rotation, ha='right', fontsize=fontsize)
        ax.legend(fontsize=fontsize)

        if metric.lower() == 'loss':
            ax.set_ylim(0, max(max(centralized_values), max(federated_values)) * 1.1)
        else:
            ax.set_ylim(0, 1)

        def autolabel(rects):
            for rect in rects:
                height = rect.get_height()
                ax.annotate(f'{height:.2f}',
                            xy=(rect.get_x() + rect.get_width() / 2, height),
                            xytext=(0, 3),
                            textcoords="offset points",
                            ha='center', va='bottom', fontsize=fontsize - 2)

        autolabel(rects1)
        autolabel(rects2)

        ax.tick_params(axis='both', which='major', labelsize=fontsize)

    # Remove any empty subplots
    if n_metrics % n_cols != 0:
        for i in range(n_metrics, n_rows * n_cols):
            fig.delaxes(axs.flatten()[i])

    plt.tight_layout()
    plt.subplots_adjust(top=0.95, hspace=0.3)

    if save_fig:
        plt.savefig(filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

def plot_client_data_distribution(client_datasets, global_epochs, local_epochs, num_clients, dataset_name, save_fig=False, fig_filename='client_data_distribution.png', show_fig=False):
    """
    Creates a plot showing the number of samples per client and class distribution.

    Parameters:
        client_datasets (dict): Dictionary with client data.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        dataset_name (str): Name of the dataset.
        save_fig (bool): If True, saves the plot as a PNG file.
        fig_filename (str): Name of the PNG file if save_fig is True.
        show_fig (bool): If True, displays the plot.
    """
    client_ids = []
    num_samples = []
    class_distributions = {}

    for client_id, (images, labels) in client_datasets.items():
        client_ids.append(client_id)
        num_samples.append(len(labels))
        unique, counts = np.unique(labels, return_counts=True)
        class_distribution = dict(zip(unique, counts))
        class_distributions[client_id] = class_distribution

    # Plot number of samples per client
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.bar(client_ids, num_samples, color='skyblue')
    ax.set_xlabel('Client ID')
    ax.set_ylabel('Number of Samples')
    ax.set_title(f'Number of Samples per Client\n(Dataset: {dataset_name}, Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})')
    plt.xticks(client_ids)
    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename.replace('.png', '_samples.png'), bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

    # Plot class distribution per client
    num_clients = len(client_datasets)
    num_classes = len(np.unique(np.concatenate([labels for _, labels in client_datasets.values()])))
    fig, axs = plt.subplots(math.ceil(num_clients / 2), 2, figsize=(15, 5 * math.ceil(num_clients / 2)))
    axs = axs.flatten()
    for idx, client_id in enumerate(client_ids):
        ax = axs[idx]
        class_dist = class_distributions[client_id]
        classes = list(class_dist.keys())
        counts = list(class_dist.values())
        ax.bar(classes, counts)
        ax.set_xlabel('Class')
        ax.set_ylabel('Number of Samples')
        ax.set_title(f'Client {client_id} Class Distribution\n(Dataset: {dataset_name})')
        ax.set_xticks(classes)
    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename.replace('.png', '_class_distribution.png'), bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

def plot_client_participation(client_participation, global_epochs, local_epochs, num_clients, dataset_name, save_fig=False, fig_filename='client_participation.png', show_fig=False):
    """
    Creates a plot showing client participation in each round.

    Parameters:
        client_participation (dict): Dictionary with client participation per round.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        dataset_name (str): Name of the dataset.
        save_fig (bool): If True, saves the plot as a PNG file.
        fig_filename (str): Name of the PNG file if save_fig is True.
        show_fig (bool): If True, displays the plot.
    """
    participation_matrix = np.array([client_participation[client_id] for client_id in sorted(client_participation.keys())])

    fig, ax = plt.subplots(figsize=(12, 6))
    cax = ax.imshow(participation_matrix, aspect='auto', cmap='Greys', interpolation='nearest')
    ax.set_xlabel('Global Rounds')
    ax.set_ylabel('Client ID')
    ax.set_title(f'Client Participation Over Rounds\n(Dataset: {dataset_name}, Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})')
    ax.set_yticks(range(num_clients))
    ax.set_yticklabels(sorted(client_participation.keys()))
    ax.set_xticks(range(global_epochs))
    ax.set_xticklabels([str(i) for i in range(1, global_epochs + 1)])
    plt.colorbar(cax, ax=ax, label='Participation (1=Active, 0=Inactive)')
    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

def create_client_statistics_table(client_datasets, client_participation, global_epochs, local_epochs, num_clients, dataset_name, *, save_csv=False, csv_filename='client_statistics.csv', save_fig=False, fig_filename='client_statistics.png', show_fig=False):
    """
    Creates a table with client statistics and displays it.

    Parameters:
        client_datasets (dict): Dictionary with client data.
        client_participation (dict): Dictionary with client participation per round.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        dataset_name (str): Name of the dataset.
        save_csv (bool): If True, saves the table to a CSV file.
        csv_filename (str): Name of the CSV file if save_csv is True.
        save_fig (bool): If True, saves the table as an image.
        fig_filename (str): Name of the PNG file if save_fig is True.
        show_fig (bool): If True, displays the table.
    """
    data = []
    for client_id, (images, labels) in client_datasets.items():
        num_samples = len(labels)
        unique_classes = np.unique(labels)
        num_classes = len(unique_classes)
        participation_rate = sum(client_participation[client_id]) / global_epochs
        data.append([client_id, num_samples, num_classes, participation_rate])

    df = pd.DataFrame(data, columns=['Client ID', 'Num Samples', 'Num Classes', 'Participation Rate'])
    print("\nClient Statistics:")
    print(df.to_string(index=False))

    if save_csv:
        df.to_csv(csv_filename, index=False)

    # Display the table
    cell_text = df.astype(str).values.tolist()
    col_labels = df.columns.astype(str).tolist()

    fig, ax = plt.subplots(figsize=(12, len(df) * 0.5 + 2))
    ax.axis('off')
    table = ax.table(cellText=cell_text, colLabels=col_labels, cellLoc='center', loc='upper left')
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1.2, 1.2)
    plt.title(f"Client Statistics\n(Dataset: {dataset_name}, Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})")
    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

    return df

def plot_client_training_times(client_training_times, global_epochs, local_epochs, num_clients, dataset_name, save_fig=False, fig_filename='client_training_times.png', show_fig=False):
    """
    Creates a plot showing the training time for each client in each round.

    Parameters:
        client_training_times (dict): Dictionary with training times per client and per round.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        dataset_name (str): Name of the dataset.
        save_fig (bool): If True, saves the plot as a PNG file.
        fig_filename (str): Name of the PNG file if save_fig is True.
        show_fig (bool): If True, displays the plot.
    """
    fig, ax = plt.subplots(figsize=(12, 6))

    max_rounds = max(len(times) for times in client_training_times.values())


    for client_id, times in client_training_times.items():
        if times:  # Check if the list of times is not empty
            rounds = range(1, len(times) + 1)
            ax.plot(rounds, times, label=f'Client {client_id}', marker='o')

    ax.set_xlabel('Round')
    ax.set_ylabel('Training Time (seconds)')
    ax.set_title(f'Client Training Times Over Rounds\n(Dataset: {dataset_name}, Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})')
    ax.legend()
    ax.set_xticks(range(1, global_epochs + 1))
    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

def plot_execution_times(execution_times, save_fig=False, fig_filename='execution_times.png', show_fig=False):
    """
    Plots the execution times for each dataset.

    Parameters:
        execution_times (dict): Dictionary with execution times per dataset.
        save_fig (bool): If True, saves the plot as a PNG file.
        fig_filename (str): Name of the PNG file if save_fig is True.
        show_fig (bool): If True, displays the plot.
    """
    datasets = list(execution_times.keys())
    times = list(execution_times.values())

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.bar(datasets, times, color='coral')
    ax.set_xlabel('Dataset')
    ax.set_ylabel('Execution Time (seconds)')
    ax.set_title('Execution Times per Dataset')

    x = np.arange(len(datasets))
    ax.set_xticks(x)
    ax.set_xticklabels(datasets, rotation=45, ha='right')
    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

def plot_samples_per_client_across_datasets(client_datasets_per_dataset, global_epochs, local_epochs, num_clients, save_fig=False, fig_filename='samples_per_client_across_datasets.png', show_fig=False):
    """
    Plots the number of samples per client for all datasets in a single plot.

    Parameters:
        client_datasets_per_dataset (dict): Dictionary where keys are dataset names and values are client datasets.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        save_fig (bool): If True, saves the plot as a PNG file.
        fig_filename (str): Name of the PNG file if save_fig is True.
        show_fig (bool): If True, displays the plot.
    """
    datasets = list(client_datasets_per_dataset.keys())
    num_datasets = len(datasets)
    fig, axs = plt.subplots(1, num_datasets, figsize=(6 * num_datasets, 5), sharey=True)

    if num_datasets == 1:
        axs = [axs]  # Ensure axs is iterable when there's only one dataset

    for idx, dataset_name in enumerate(datasets):
        client_datasets = client_datasets_per_dataset[dataset_name]
        client_ids = []
        num_samples = []

        for client_id, (images, labels) in client_datasets.items():
            client_ids.append(client_id)
            num_samples.append(len(labels))

        ax = axs[idx]
        ax.bar(client_ids, num_samples, color='skyblue')
        ax.set_xlabel('Client ID')
        ax.set_ylabel('Number of Samples')
        ax.set_title(f'{dataset_name}: Samples per Client\n(Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})')
        ax.set_xticks(client_ids)

    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

def plot_client_participation_across_datasets(client_participation_per_dataset, global_epochs, local_epochs, num_clients, save_fig=False, fig_filename='client_participation_across_datasets.png', show_fig=False):
    """
    Plots client participation over rounds for all datasets in a single plot.

    Parameters:
        client_participation_per_dataset (dict): Dictionary where keys are dataset names and values are client participation dictionaries.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        save_fig (bool): If True, saves the plot as a PNG file.
        fig_filename (str): Name of the PNG file if save_fig is True.
        show_fig (bool): If True, displays the plot.
    """
    datasets = list(client_participation_per_dataset.keys())
    num_datasets = len(datasets)
    fig, axs = plt.subplots(num_datasets, 1, figsize=(12, 5 * num_datasets))

    if num_datasets == 1:
        axs = [axs]  # Ensure axs is iterable when there's only one dataset

    for idx, dataset_name in enumerate(datasets):
        client_participation = client_participation_per_dataset[dataset_name]
        num_clients = len(client_participation)
        participation_matrix = np.array([client_participation[client_id] for client_id in sorted(client_participation.keys())])

        ax = axs[idx]
        cax = ax.imshow(participation_matrix, aspect='auto', cmap='Greys', interpolation='nearest')
        ax.set_xlabel('Global Rounds')
        ax.set_ylabel('Client ID')
        ax.set_title(f'{dataset_name}: Client Participation Over Rounds\n(Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})')
        ax.set_yticks(range(num_clients))
        ax.set_yticklabels(sorted(client_participation.keys()))
        ax.set_xticks(range(global_epochs))
        ax.set_xticklabels([str(i) for i in range(1, global_epochs + 1)])
        plt.colorbar(cax, ax=ax, label='Participation (1=Active, 0=Inactive)')

    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

def plot_class_distribution_across_datasets(client_datasets_per_dataset, global_epochs, local_epochs, num_clients, save_fig=False, fig_filename='class_distribution_across_datasets.png', show_fig=False):
    """
    Plots the class distribution for all datasets in a single plot.

    Parameters:
        client_datasets_per_dataset (dict): Dictionary where keys are dataset names and values are client datasets.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        save_fig (bool): If True, saves the plot as a PNG file.
        fig_filename (str): Name of the PNG file if save_fig is True.
        show_fig (bool): If True, displays the plot.
    """
    datasets = list(client_datasets_per_dataset.keys())
    num_datasets = len(datasets)
    fig, axs = plt.subplots(num_datasets, 1, figsize=(12, 5 * num_datasets))

    if num_datasets == 1:
        axs = [axs]  # Ensure axs is iterable when there's only one dataset

    for idx, dataset_name in enumerate(datasets):
        client_datasets = client_datasets_per_dataset[dataset_name]
        class_counts = {}

        for client_id, (images, labels) in client_datasets.items():
            unique, counts = np.unique(labels, return_counts=True)
            for cls, count in zip(unique, counts):
                class_counts[cls] = class_counts.get(cls, 0) + count

        classes = sorted(class_counts.keys())
        counts = [class_counts[cls] for cls in classes]

        ax = axs[idx]
        ax.bar(classes, counts)
        ax.set_xlabel('Class')
        ax.set_ylabel('Number of Samples')
        ax.set_title(f'{dataset_name}: Class Distribution\n(Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})')
        ax.set_xticks(classes)

    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()

def plot_combined_client_statistics_table(client_statistics_per_dataset, global_epochs, local_epochs, num_clients, save_csv=False, csv_filename='combined_client_statistics.csv', save_fig=False, fig_filename='combined_client_statistics.png', show_fig=False):
    """
    Creates and plots a combined client statistics table across all datasets.

    Parameters:
        client_statistics_per_dataset (dict): Dictionary where keys are dataset names and values are client statistics DataFrames.
        global_epochs (int): Number of global epochs.
        local_epochs (int): Number of local epochs.
        num_clients (int): Number of clients.
        save_csv (bool): If True, saves the table as a CSV file.
        csv_filename (str): Name of the CSV file if save_csv is True.
        save_fig (bool): If True, saves the table as an image.
        fig_filename (str): Name of the image file if save_fig is True.
        show_fig (bool): If True, displays the table.
    """
    combined_df = pd.DataFrame()
    for dataset_name, df in client_statistics_per_dataset.items():
        df_copy = df.copy()
        df_copy.insert(0, 'Dataset', dataset_name)
        combined_df = pd.concat([combined_df, df_copy], ignore_index=True)

    if save_csv:
        combined_df.to_csv(csv_filename, index=False)

    # Plot the table
    cell_text = combined_df.astype(str).values.tolist()
    col_labels = combined_df.columns.astype(str).tolist()

    fig, ax = plt.subplots(figsize=(12, len(combined_df) * 0.5 + 2))
    ax.axis('off')
    table = ax.table(cellText=cell_text, colLabels=col_labels, cellLoc='center', loc='upper left')
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1.2, 1.2)
    plt.title(f'Combined Client Statistics\n(Global Epochs: {global_epochs}, Local Epochs: {local_epochs}, Clients: {num_clients})')
    plt.tight_layout()

    if save_fig:
        plt.savefig(fig_filename, bbox_inches='tight', dpi=300)

    if show_fig:
        plt.show()
    else:
        plt.close()


def plot_client_types(client_types_config, save_fig=False, fig_filename=None, show_fig=True):
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


