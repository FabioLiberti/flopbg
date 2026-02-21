<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parametri Federated Learning</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 40px;
            font-size: 2.5em;
        }

        h2 {
            color: #3498db;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-top: 30px;
        }

        h3 {
            color: #2980b9;
            margin-top: 25px;
        }

        .parameter-box {
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }

        .parameter-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .code {
            background-color: #f1f1f1;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            color: #e74c3c;
        }

        .typical-value {
            background-color: #e8f4f8;
            padding: 8px 12px;
            border-radius: 5px;
            margin-top: 10px;
            display: inline-block;
        }

        ul {
            list-style-type: none;
            padding-left: 0;
        }

        li {
            margin: 10px 0;
            padding-left: 25px;
            position: relative;
        }

        li:before {
            content: "•";
            color: #3498db;
            font-weight: bold;
            position: absolute;
            left: 10px;
        }

        .emoji {
            font-size: 1.5em;
            margin-right: 10px;
        }

        footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛠️ Parametri Chiave nel Federated Learning</h1>

        <h2>📐 Parametri di Training</h2>

        <div class="parameter-box">
            <div class="parameter-title">
                <span class="emoji">1️⃣</span> Number of Rounds 
                <span class="code">num_rounds: int = 100</span>
            </div>
            <ul>
                <li>Rappresenta il numero totale di cicli di training federato</li>
                <li>Ogni round include: selezione client, training locale, aggregazione modelli</li>
                <li class="typical-value">💡 Valore tipico: 50-200 round, dipende dalla complessità del task</li>
            </ul>
        </div>

        <div class="parameter-box">
            <div class="parameter-title">
                <span class="emoji">2️⃣</span> Number of Clients 
                <span class="code">num_clients: int = 10</span>
            </div>
            <ul>
                <li>Numero totale di dispositivi/nodi partecipanti</li>
                <li>Influenza la distribuzione dei dati e la velocità di convergenza</li>
                <li class="typical-value">💡 Valore tipico: 10-1000 client, basato sull'applicazione</li>
            </ul>
        </div>

        <div class="parameter-box">
            <div class="parameter-title">
                <span class="emoji">3️⃣</span> Local Epochs 
                <span class="code">local_epochs: int = 5</span>
            </div>
            <ul>
                <li>Numero di epoche di training su ogni client prima dell'aggregazione</li>
                <li>Bilancia computazione locale vs comunicazione</li>
                <li class="typical-value">💡 Valore tipico: 1-10 epoche</li>
            </ul>
        </div>

        <h2>🛠️ Parametri di Ottimizzazione</h2>

        <div class="parameter-box">
            <div class="parameter-title">
                <span class="emoji">4️⃣</span> Batch Size 
                <span class="code">batch_size: int = 32</span>
            </div>
            <ul>
                <li>Dimensione dei batch per il training locale</li>
                <li>Impatta memoria utilizzata e velocità di convergenza</li>
                <li class="typical-value">💡 Valore tipico: 16-128</li>
            </ul>
        </div>

        <div class="parameter-box">
            <div class="parameter-title">
                <span class="emoji">5️⃣</span> Learning Rate 
                <span class="code">learning_rate: float = 0.01</span>
            </div>
            <ul>
                <li>Tasso di apprendimento per l'ottimizzazione locale</li>
                <li>Cruciale per la convergenza del modello</li>
                <li class="typical-value">💡 Valore tipico: 0.001-0.1</li>
            </ul>
        </div>

        <div class="parameter-box">
            <div class="parameter-title">
                <span class="emoji">6️⃣</span> Mu (FedProx) 
                <span class="code">mu: float = 0.01</span>
            </div>
            <ul>
                <li>Parametro di regolarizzazione per FedProx</li>
                <li>Controlla quanto il modello locale può deviare dal modello globale</li>
                <li class="typical-value">💡 Valore tipico: 0.001-0.1</li>
            </ul>
        </div>

        <h2>🌐 Parametri di Sistema</h2>

        <div class="parameter-box">
            <div class="parameter-title">
                <span class="emoji">7️⃣</span> Quantization Bits 
                <span class="code">quant_bits: int = 8</span>
            </div>
            <ul>
                <li>Bits usati per quantizzare i parametri del modello</li>
                <li>Riduce overhead di comunicazione</li>
                <li class="typical-value"> 💡 Valore tipico: 8-32 bits</li>
            </ul>
        </div>

        <div class="parameter-box">
            <div class="parameter-title">
                <span class="emoji">8️⃣</span> Global Participation Rate 
                <span class="code">participation_rate: float = 0.8</span>
            </div>
            <ul>
                <li>Frazione di client che partecipano in ogni round</li>
                <li>Bilancia convergenza vs efficienza computazionale</li>
                <li class="typical-value">💡 Valore tipico: 0.1-1.0 (10%-100% dei client)</li>
            </ul>
        </div>

        <footer>
            <p>Questa guida fornisce una panoramica dei parametri chiave utilizzati nel Federated Learning, 
            aiutando a comprendere il loro impatto sulle prestazioni e l'efficienza del sistema.</p>
        </footer>
    </div>
</body>
</html>