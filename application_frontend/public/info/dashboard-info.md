<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c3e50; font-size: 28px; margin-bottom: 20px;">Federated Learning Dashboard</h1>
    
    <p style="font-size: 16px; margin-bottom: 24px;">
        Questa dashboard permette di monitorare e gestire l'addestramento di modelli in ambiente federato.
    </p>

    <h2 style="color: #34495e; font-size: 24px; margin-top: 30px; margin-bottom: 15px;">Funzionalità Principali</h2>
    <ul style="list-style-type: none; padding-left: 20px; margin-bottom: 24px;">
        <li style="margin-bottom: 8px;">• Configurazione dei parametri di training</li>
        <li style="margin-bottom: 8px;">• Monitoraggio in tempo reale delle metriche</li>
        <li style="margin-bottom: 8px;">• Visualizzazione delle performance</li>
        <li style="margin-bottom: 8px;">• Gestione dei nodi partecipanti</li>
    </ul>

    <h2 style="color: #34495e; font-size: 24px; margin-top: 30px;">Sezioni Dashboard</h2>
    
    <h3 style="color: #2980b9; font-size: 20px; margin-top: 20px;">1. Configurazione</h3>
    <ul style="list-style-type: none; padding-left: 20px; margin-bottom: 24px;">
        <li style="margin-bottom: 8px;">• Selezione dataset</li>
        <li style="margin-bottom: 8px;">• Impostazione parametri</li>
        <li style="margin-bottom: 8px;">• Gestione nodi</li>
    </ul>

    <h3 style="color: #2980b9; font-size: 20px; margin-top: 20px;">2. Monitoraggio</h3>
    <ul style="list-style-type: none; padding-left: 20px; margin-bottom: 24px;">
        <li style="margin-bottom: 8px;">• Metriche di training</li>
        <li style="margin-bottom: 8px;">• ROC Curves</li>
        <li style="margin-bottom: 8px;">• Confusion Matrix</li>
        <li style="margin-bottom: 8px;">• Distribuzioni dei dati</li>
    </ul>

    <h3 style="color: #2980b9; font-size: 20px; margin-top: 20px;">3. Analisi</h3>
    <ul style="list-style-type: none; padding-left: 20px; margin-bottom: 24px;">
        <li style="margin-bottom: 8px;">• Comparazione centralizzato vs federato</li>
        <li style="margin-bottom: 8px;">• Performance per client</li>
        <li style="margin-bottom: 8px;">• Tempi di training</li>
    </ul>

    <h2 style="color: #34495e; font-size: 24px; margin-top: 30px;">Note Tecniche</h2>
    <p style="margin-bottom: 12px;">Il sistema implementa il Federated Learning attraverso:</p>
    <ul style="list-style-type: none; padding-left: 20px;">
        <li style="margin-bottom: 8px;">• Aggregazione dei modelli locali</li>
        <li style="margin-bottom: 8px;">• Gestione della privacy dei dati</li>
        <li style="margin-bottom: 8px;">• Ottimizzazione delle comunicazioni</li>
    </ul>
</div>




Federated Learning Program Summary
Preview
Code

<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Federated Learning Project</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <header class="bg-gradient-to-r from-blue-600 to-indigo-800 text-white py-12">
        <div class="container mx-auto px-4">
            <h1 class="text-4xl font-bold mb-4">Federated Learning Project</h1>
            <p class="text-xl opacity-90">Sistema di apprendimento federato per classificazione di immagini</p>
        </div>
    </header>

    <main class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Features Section -->
            <section class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold mb-4 text-indigo-800">Caratteristiche Principali</h2>
                <ul class="space-y-2">
                    <li class="flex items-start">
                        <span class="text-indigo-600 mr-2">•</span>
                        Distribuzione non-IID dei dati tra i client
                    </li>
                    <li class="flex items-start">
                        <span class="text-indigo-600 mr-2">•</span>
                        Gestione client dinamici ed eterogenei
                    </li>
                    <li class="flex items-start">
                        <span class="text-indigo-600 mr-2">•</span>
                        Riduzione overhead di comunicazione
                    </li>
                    <li class="flex items-start">
                        <span class="text-indigo-600 mr-2">•</span>
                        Visualizzazione real-time dell'accuratezza
                    </li>
                </ul>
            </section>

            <!-- Datasets Section -->
            <section class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold mb-4 text-indigo-800">Dataset Supportati</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-gray-50 p-4 rounded">
                        <h3 class="font-bold">MNIST</h3>
                        <p class="text-sm">Cifre scritte a mano (28x28)</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded">
                        <h3 class="font-bold">Fashion MNIST</h3>
                        <p class="text-sm">Categorie abbigliamento (28x28)</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded">
                        <h3 class="font-bold">CIFAR-10</h3>
                        <p class="text-sm">10 classi oggetti (32x32)</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded">
                        <h3 class="font-bold">CIFAR-100</h3>
                        <p class="text-sm">100 classi oggetti (32x32)</p>
                    </div>
                </div>
            </section>
        </div>

        <!-- Technical Details -->
        <section class="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-4 text-indigo-800">Dettagli Tecnici</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 class="font-bold text-lg mb-2">Stack Tecnologico</h3>
                    <ul class="space-y-2">
                        <li>Backend: Python (TensorFlow, Flask)</li>
                        <li>Frontend: React, Chart.js</li>
                        <li>Algoritmo: FedAvg, FedProx</li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-lg mb-2">Hyperparameters</h3>
                    <div class="bg-gray-50 p-4 rounded">
                        <code class="text-sm">
                            global_epochs: 10<br>
                            local_epochs: 3<br>
                            num_clients: 50<br>
                            batch_size: 32<br>
                            learning_rate: 0.001<br>
                            participation_rate: 0.7<br>
                            mu: 0.1<br>
                            quantization_bits: 8
                        </code>
                    </div>
                </div>
            </div>
        </section>

        <!-- Implementation Details -->
        <section class="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-4 text-indigo-800">Caratteristiche Avanzate</h2>
            <div class="space-y-4">
                <div>
                    <h3 class="font-bold text-lg">Gestione Client Eterogenei</h3>
                    <p class="text-gray-700">Implementazione di FedProx con termine di penalizzazione per gestire l'eterogeneità dei client e migliorare la robustezza del modello globale.</p>
                </div>
                <div>
                    <h3 class="font-bold text-lg">Quantizzazione dei Pesi</h3>
                    <p class="text-gray-700">Riduzione dell'overhead di comunicazione mediante quantizzazione configurabile dei pesi del modello.</p>
                </div>
                <div>
                    <h3 class="font-bold text-lg">Partecipazione Dinamica</h3>
                    <p class="text-gray-700">Gestione della partecipazione parziale dei client con monitoraggio e reporting delle performance.</p>
                </div>
            </div>
        </section>
    </main>

    <footer class="bg-gray-800 text-white py-6 mt-8">
        <div class="container mx-auto px-4 text-center">
            <p>© 2024 Federated Learning Project</p>
        </div>
    </footer>
</body>
</html>
