# Analisi Completa dell'Applicazione MDPI 0.7.2

## Piattaforma di Federated Learning per Imaging Medico

---

## 1. Panoramica Generale

**MDPI_0.7.2** è un'applicazione full-stack per la sperimentazione e la simulazione di sistemi di **Federated Learning (FL)** applicati alla classificazione di immagini mediche. L'applicazione è progettata per confrontare l'apprendimento federato con quello centralizzato, con un focus specifico su dataset clinici nel dominio dell'imaging biomedico.

Il progetto è associato a due istituzioni (deducibile dagli asset nel frontend): **Università Mercatorum** e **Ospedale Pediatrico Bambino Gesù (OPBG)**, suggerendo una collaborazione accademica/ospedaliera per ricerca pubblicata su riviste MDPI.

La versione 0.7.2 rappresenta un'evoluzione significativa del sistema, con una transizione da un'architettura legacy (basata su un file `main.py` monolitico da 25KB) verso un'architettura modulare organizzata nel package `application/`.

---

## 2. Stack Tecnologico

### 2.1 Backend (Python)

Il backend è scritto interamente in **Python** e comprende circa **195 KB** di codice sorgente distribuito su 15 file `.py` principali.

**Framework e librerie principali** (dedotti dalla struttura e dai nomi dei file):

- **TensorFlow/Keras**: framework di deep learning principale (modelli salvati in formato `.h5` e `.keras`)
- **Flask**: web server per le API REST (file `app.py` da 23KB, file `server.py`)
- **NumPy/SciPy**: elaborazione numerica (file `.mat` per dataset SVHN)
- **TensorBoard**: logging degli esperimenti (file `tfevents` nelle cartelle report)
- **YAML**: configurazione dell'applicazione (`config.yaml`)
- **Matplotlib/Plotly**: visualizzazione lato backend (`visualization.py` da 29KB)

**Struttura dei requisiti** (`requirements.txt` da 4.5KB): indica un numero significativo di dipendenze, confermando un progetto con stack ML completo.

### 2.2 Frontend (React.js)

Il frontend è una **Single Page Application** React.js composta da circa **122 KB** di codice sorgente.

**Dipendenze principali** (dedotte dai componenti):

- **React.js**: framework UI (Create React App come scaffolding)
- **Recharts / Chart.js**: grafici e visualizzazioni
- **D3.js / TopoJSON**: visualizzazione geografica (mappa globale dei nodi)
- **http-proxy-middleware**: proxy per le API backend (`setupProxy.js`)
- **react-globe.gl o simile**: componente GlobeVisualization per la mappa 3D dei nodi

### 2.3 Dataset e Formati

L'applicazione lavora con due categorie di dataset:

**Dataset Standard ML** (per benchmarking):
- MNIST
- Fashion MNIST
- CIFAR-10
- CIFAR-100
- SVHN (Street View House Numbers) — file `.mat` da ~246MB totali

**Dataset Clinici** (per ricerca):
- **Brain Tumor MRI** — 3.264 immagini, 4 classi: glioma, meningioma, no tumor, pituitary tumor (Training/Testing split)
- **Brain_Tumor** — 7.023 immagini, 4 classi: glioma, meningioma, pituitary, healthy
- **ISIC (Skin Lesion)** — 2.357 immagini, 9 classi: melanoma, nevus, basal cell carcinoma, squamous cell carcinoma, actinic keratosis, pigmented benign keratosis, dermatofibroma, vascular lesion, seborrheic keratosis
- **Retinopatia Diabetica** — 35.126 immagini, 5 livelli di gravità: No DR, Mild, Moderate, Severe, Proliferative DR
- **Skin Cancer** — 6.594 immagini, 2 classi: benign, malignant (con split train/test e una copia in `data/`)
- **Chest X-Ray (Pneumonia)** — 5.856 immagini, 2 classi: NORMAL, PNEUMONIA (con split train/test/val)

**Totale immagini cliniche: circa 60.220**

---

## 3. Architettura del Sistema

### 3.1 Schema Architetturale

L'applicazione segue un'architettura **client-server** a tre livelli, che simula un ambiente di Federated Learning:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  application_frontend/src/                               │
│  ├─ App.js (52KB - orchestratore principale)             │
│  ├─ components/ (dashboard, config, grafici)             │
│  ├─ hooks/ (useProcessResults)                           │
│  └─ utils/ (helpers)                                     │
├─────────────────────────────────────────────────────────┤
│                  API LAYER (Flask)                        │
│  application/app.py (23KB)                               │
│  server/server.py (5KB)                                  │
├─────────────────────────────────────────────────────────┤
│              CORE FL ENGINE (Python)                      │
│  application/main.py (31KB)                              │
│  application/federated_learning_system.py (21KB)         │
├─────────────────────────────────────────────────────────┤
│              CLIENT SIMULATION                           │
│  clients/client.py (6KB)                                 │
│  clients/client_manager.py (5KB)                         │
├─────────────────────────────────────────────────────────┤
│              MODEL & DATA LAYER                          │
│  models/model_definition.py (5KB)                        │
│  data/data_loading.py (12KB)                             │
├─────────────────────────────────────────────────────────┤
│           REPORTING & VISUALIZATION                      │
│  application/report_manager.py (5KB)                     │
│  application/reports/fl_reports.py (9KB)                  │
│  application/reports/metrics.py (4KB)                     │
│  application/reports/visualization.py (8KB)               │
│  utils/visualization.py (29KB)                            │
│  utils/metrics.py (4KB)                                   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Moduli Principali

#### 3.2.1 `application/main.py` (31.415 bytes)
Il file più grande del progetto. Rappresenta il **motore principale dell'applicazione**, con la logica di orchestrazione degli esperimenti di federated learning: inizializzazione dei round, distribuzione dei dati ai client, aggregazione dei modelli e valutazione.

#### 3.2.2 `application/app.py` (22.967 bytes)
Il **server web Flask** che espone le API REST per il frontend. Gestisce le richieste HTTP per avviare esperimenti, recuperare risultati, configurare parametri e monitorare lo stato di esecuzione in tempo reale.

#### 3.2.3 `application/federated_learning_system.py` (20.658 bytes)
Il **cuore algoritmico** del sistema di Federated Learning. Implementa i protocolli di apprendimento federato: distribuzione del modello globale ai client, raccolta dei modelli locali aggiornati, e strategie di aggregazione (presumibilmente FedAvg e varianti).

#### 3.2.4 `clients/client.py` (6.007 bytes) e `clients/client_manager.py` (5.379 bytes)
Definiscono il comportamento di un **singolo nodo/client** nel sistema federato e il **gestore dei client**. Ogni client simula un dispositivo edge che addestra localmente il modello sui propri dati e invia gli aggiornamenti al server centrale.

#### 3.2.5 `models/model_definition.py` (5.345 bytes)
Definisce le **architetture delle reti neurali** (CNN) utilizzate per la classificazione. I modelli vengono salvati in formato `.h5` (legacy HDF5) e `.keras` (nuovo formato nativo).

#### 3.2.6 `data/data_loading.py` (11.790 bytes)
Gestisce il **caricamento e la distribuzione dei dataset** sia standard che clinici. Include la logica di partizionamento dei dati tra i client (IID e non-IID) e il preprocessing delle immagini.

#### 3.2.7 `server/server.py` (4.668 bytes)
Un server secondario (possibilmente per la comunicazione inter-nodo o per il coordinamento del FL al di fuori dell'interfaccia web).

#### 3.2.8 `utils/visualization.py` (28.722 bytes)
Il secondo file più grande del progetto. Una libreria di **visualizzazione avanzata** per generare grafici e report sulle performance del sistema FL.

#### 3.2.9 `utils/metrics.py` (4.192 bytes) e `utils/sanitization.py` (681 bytes)
Utility per il calcolo delle **metriche di performance** (accuracy, loss, precision, recall, F1, ecc.) e per la **sanitizzazione/validazione** degli input.

---

## 4. Frontend — Analisi dei Componenti

### 4.1 Componente Principale

**`App.js` (52.200 bytes)** — Il file React più grande, funge da orchestratore dell'intera interfaccia. Gestisce lo stato globale dell'applicazione, la navigazione tra le sezioni (configurazione, esecuzione, dashboard) e la comunicazione con il backend tramite API REST.

### 4.2 Sezione Configurazione

La configurazione degli esperimenti è organizzata in un modulo dedicato `ExperimentConfig/`:

- **`index.js`** (2KB): entry point del modulo, orchestrazione dei sotto-form
- **`BasicConfigForm.js`** (4.5KB): configurazione base dell'esperimento (numero di round, learning rate, batch size, ecc.)
- **`ExperimentConfigBasicForm.js`** (3.8KB): form di configurazione estesa
- **`ClientDynamismConfig.js`** (2.4KB): configurazione del **dinamismo dei client** (entrata/uscita dinamica dei nodi durante il training — una feature avanzata di FL)
- **`ClientHeterogeneityConfig.js`** (2.4KB): configurazione dell'**eterogeneità dei client** (distribuzione non-IID dei dati, variabilità nelle risorse computazionali dei nodi)
- **`ExperimentConfigForm.js`** (11.9KB): form legacy/alternativo per la configurazione completa

### 4.3 Sezione Dati

- **`DataSelection.js`** (1.4KB): selezione del dataset (standard ML o clinico) per l'esperimento

### 4.4 Sezione Nodi

- **`NodeConfiguration.js`** (4.6KB): configurazione dei nodi partecipanti al Federated Learning
- **`GlobeVisualization.js`** (4.3KB): **visualizzazione 3D su globo terrestre** della distribuzione geografica dei nodi FL, usando dati da `nodes.json` (8.9KB) e mappe topografiche (`world-110m.json`)

### 4.5 Dashboard e Visualizzazioni

- **`Dashboard.js`** (1.2KB): componente principale della dashboard dei risultati
- **`ChartMetrics.js`** (1KB): grafici delle metriche di training (loss, accuracy per round)
- **`ComparisonChart.js`** (0.9KB): confronto tra diversi esperimenti
- **`CentralizedVsFederatedLearningChart.js`** (1.4KB): grafico comparativo tra apprendimento **centralizzato** e **federato** — visualizzazione chiave del progetto
- **`ConfusionMatrixChart.js`** (5.2KB): matrice di confusione interattiva per la valutazione della classificazione
- **`ROCChart.js`** (3.8KB): curve ROC (Receiver Operating Characteristic)
- **`ClientDataDistributionChart.js`** (1.2KB): distribuzione dei dati tra i client
- **`ClientParticipationChart.js`** (1.3KB): partecipazione dei client nei round di training
- **`ClientTrainingTimesChart.js`** (1.2KB): tempi di training per client
- **`ImageComparison.js`** (2.7KB): confronto visivo tra immagini originali e predizioni del modello

### 4.6 Componenti di Supporto

- **`InfoBox/`** (index.jsx + styles.css): componente per mostrare informazioni contestuali, con contenuti caricati da file markdown nella cartella `public/info/`
- **`ErrorBoundary.js`** (0.7KB): error boundary React per la gestione degli errori del frontend
- **`hooks/useProcessResults.js`** (0.9KB): custom hook per il processing e la normalizzazione dei risultati degli esperimenti

### 4.7 Contenuti Informativi (public/info/)

Il frontend include una ricca documentazione integrata in formato Markdown:

- `project-info.md` (4KB): informazioni generali sul progetto
- `programma-info.md` (7KB): documentazione del programma/algoritmo
- `basic-config-info.md` (7KB): guida alla configurazione base
- `datasets-info.md` (6KB): descrizione dei dataset standard
- `datasets_clinical-info.md` (8KB): descrizione dei dataset clinici
- `dashboard-info.md` (9KB): guida alla dashboard
- `experiment_config-info.md`: info sulla configurazione avanzata

---

## 5. Sistema di Configurazione

### 5.1 File `config.yaml` (1.736 bytes)

Il file di configurazione YAML principale contiene i parametri dell'esperimento. Dalla struttura dei form frontend e dai nomi dei report, i parametri includono:

- **Numero di round FL** (epochs globali)
- **Numero di epochs locali** per client
- **Numero di client** partecipanti
- **Algoritmo di aggregazione** (FedAvg e varianti)
- **Parametri del modello** (architettura, learning rate, batch size)
- **Configurazione dataset** (quale dataset usare, split)
- **Parametri di dinamismo** (client dropout rate, join rate)
- **Parametri di eterogeneità** (distribuzione non-IID)

### 5.2 Nomenclatura dei Report

Il sistema di naming dei report rivela i parametri sperimentali. Ad esempio il pattern dei vecchi report:

`rpt_20240917_1527_02eg01el02cl` si decompone in:
- `rpt_` — prefisso report
- `20240917_1527` — timestamp (17 settembre 2024, ore 15:27)
- `02eg` — **2 epochs globali** (round FL)
- `01el` — **1 epoch locale** (per client)
- `02cl` — **2 client**

Il report `rpt_20240923_100eg01el50cl_web` indica un esperimento più ambizioso con **100 round, 1 epoch locale, 50 client**, eseguito via interfaccia web.

### 5.3 Configurazione dei Nodi (`nodes.json`, 8.876 bytes)

File JSON che definisce la configurazione geografica e le proprietà dei nodi partecipanti al sistema di Federated Learning. Include coordinate GPS per la visualizzazione sul globo 3D e parametri computazionali per ogni nodo.

---

## 6. Sistema di Reporting

### 6.1 Struttura dei Report

L'applicazione genera report strutturati per ogni esperimento. Esistono **due generazioni** di sistemi di reporting:

**Vecchio sistema** (`_Reports_/` in root, 10 run):
Ogni report contiene:
- `config.yaml` — copia della configurazione usata
- `execution_parameters.json` — parametri di esecuzione dettagliati
- `realtime_metrics.json` — metriche raccolte in tempo reale
- `results_table.csv` — tabella riassuntiva dei risultati
- `*_client_statistics.csv` — statistiche per dataset (MNIST, CIFAR-10, CIFAR-100, Fashion MNIST, SVHN)
- `combined_client_statistics.csv` — statistiche combinate
- `global_model_round_N_DATASET.keras` — modelli globali per ogni round e dataset
- `logs_DATASET/` — log TensorBoard

**Nuovo sistema** (`application/_Reports_/`, 64 run):
Report più snelli:
- `experiment_config.json` — configurazione dell'esperimento
- `latest_results.json` — risultati più recenti
- Directory `reports/` con sotto-cartelle `client_activity/` e `federated_metrics/` per log giornalieri dettagliati

### 6.2 Cronologia delle Sperimentazioni

L'attività sperimentale copre un periodo di circa **6 mesi**:

- **Settembre 2024**: primi esperimenti (vecchio sistema), focus su dataset standard ML
- **Ottobre 2024**: sviluppo frontend e integrazione dei dataset clinici
- **Novembre 2024**: transizione al nuovo sistema di reporting, primo run continuo di lungo periodo (report `rpt_20241105_1740` con `client_activity` giornaliera da novembre 2024 a gennaio 2025 e `federated_metrics` continui per mesi — suggerisce un **esperimento di FL continuo** in esecuzione)
- **Febbraio 2025**: ultime sperimentazioni (run fino al 17 febbraio 2025)

### 6.3 Metriche e Visualizzazioni

Il sistema genera molteplici tipologie di metriche:

- **Accuracy e Loss** per round di FL
- **Matrici di confusione** per la classificazione
- **Curve ROC** per l'analisi delle performance
- **Confronto Centralizzato vs Federato** — metrica chiave della ricerca
- **Distribuzione dei dati** tra client
- **Partecipazione dei client** durante i round
- **Tempi di training** per client
- **Confronto visivo** tra predizioni e ground truth

---

## 7. Evoluzione del Codice

### 7.1 File di Backup

Il progetto mantiene diversi file di backup con naming convention `_BK` o `_BKGOOD`:

- `main_BK04112024.py` (25.261 bytes) — backup del main del 4 novembre 2024 (precedente alla ristrutturazione in package `application/`)
- `data/data_loading_BK29102024_1415.py.txt` — backup del data loading
- `data/data_loading_BKGOOD_25092024_2205.py.txt` — versione "buona" funzionante del 25 settembre
- `utils/helpers_BKGOOD_03102024_1855.js.txt` — backup helpers frontend del 3 ottobre
- `utils/helpers_BKGOOD_26092024_0930.js.txt` — versione precedente del 26 settembre

### 7.2 Ristrutturazione Architetturale

L'evoluzione del progetto è chiara:

1. **Fase 1 (Settembre 2024)**: Prototipo con `main.py` monolitico in root, `dashboard.py` per visualizzazione Streamlit/Dash
2. **Fase 2 (Ottobre 2024)**: Aggiunta del frontend React, integrazione dei dataset clinici, sviluppo dei componenti di visualizzazione
3. **Fase 3 (Novembre 2024)**: Ristrutturazione in package `application/` con moduli separati (`main.py`, `app.py`, `federated_learning_system.py`, `report_manager.py`), sistema di reporting migliorato

---

## 8. Struttura Completa del Progetto

```
MDPI_0.7.2/
│
├── config.yaml                          # Configurazione principale (1.7KB)
├── requirements.txt                     # Dipendenze Python (4.5KB)
├── Readme.md                            # Documentazione progetto (3KB)
├── global_model.h5                      # Modello globale salvato (934KB)
├── dashboard.py                         # Dashboard legacy (1.9KB)
├── main_BK04112024.py                   # Backup main monolitico (25KB)
│
├── application/                         # Package applicazione principale
│   ├── __init__.py
│   ├── main.py                          # Motore FL principale (31KB)
│   ├── app.py                           # Server Flask/API (23KB)
│   ├── federated_learning_system.py     # Core algoritmo FL (21KB)
│   ├── report_manager.py               # Gestione report (5KB)
│   ├── nodes.json                       # Configurazione nodi (9KB)
│   ├── reports/                         # Modulo reporting
│   │   ├── __init__.py
│   │   ├── fl_reports.py                # Report FL (9KB)
│   │   ├── metrics.py                   # Metriche (4KB)
│   │   ├── visualization.py             # Visualizzazioni (8KB)
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py               # Helper funzioni
│   └── _Reports_/                       # Output esperimenti (64 run)
│       ├── rpt_YYYYMMDD_HHMM/
│       │   ├── experiment_config.json
│       │   ├── latest_results.json
│       │   └── reports/
│       │       ├── client_activity/     # Log giornalieri attività client
│       │       └── federated_metrics/   # Metriche FL giornaliere
│       └── ...
│
├── application_frontend/                # Frontend React
│   ├── package.json                     # Dipendenze Node.js (1.5KB)
│   ├── public/
│   │   ├── index.html                   # Template HTML
│   │   ├── world-110m.json              # Dati geografici globo
│   │   └── info/                        # Documentazione integrata (.md)
│   └── src/
│       ├── App.js                       # Componente principale (52KB)
│       ├── App.css                      # Stili principali
│       ├── index.js                     # Entry point React
│       ├── ErrorBoundary.js             # Error boundary
│       ├── setupProxy.js               # Proxy API backend
│       ├── assets/                      # Loghi Mercatorum + OPBG
│       ├── components/
│       │   ├── Dashboard.js
│       │   ├── DataSelection.js
│       │   ├── NodeConfiguration.js
│       │   ├── GlobeVisualization.js
│       │   ├── ExperimentConfig/        # Modulo configurazione
│       │   │   ├── index.js
│       │   │   ├── BasicConfigForm.js
│       │   │   ├── ExperimentConfigBasicForm.js
│       │   │   ├── ClientDynamismConfig.js
│       │   │   └── ClientHeterogeneityConfig.js
│       │   ├── ExperimentConfigForm.js  # Form legacy
│       │   ├── ChartMetrics.js
│       │   ├── ComparisonChart.js
│       │   ├── CentralizedVsFederatedLearningChart.js
│       │   ├── ConfusionMatrixChart.js
│       │   ├── ROCChart.js
│       │   ├── ClientDataDistributionChart.js
│       │   ├── ClientParticipationChart.js
│       │   ├── ClientTrainingTimesChart.js
│       │   ├── ImageComparison.js
│       │   └── InfoBox/
│       ├── data/                        # Dati statici (mappe)
│       ├── hooks/
│       │   └── useProcessResults.js
│       └── utils/
│           └── helpers.js
│
├── server/                              # Server FL
│   └── server.py                        # Server principale (5KB)
│
├── clients/                             # Simulazione client FL
│   ├── __init__.py
│   ├── client.py                        # Client FL (6KB)
│   └── client_manager.py               # Gestore client (5KB)
│
├── models/                              # Definizioni modelli ML
│   ├── __init__.py
│   └── model_definition.py             # Architetture CNN (5KB)
│
├── data/                                # Dataset
│   ├── data_loading.py                  # Caricamento dati (12KB)
│   ├── Brain Tumor MRI/                 # 3.264 immagini, 4 classi
│   ├── Brain_Tumor/                     # 7.023 immagini, 4 classi
│   ├── ISIC/                            # 2.357 immagini, 9 classi
│   ├── Retinopatia/                     # 35.126 immagini, 5 classi
│   ├── Skin Cancer/                     # 6.594 immagini, 2 classi
│   └── chest_xray/                      # 5.856 immagini, 2 classi
│
├── utils/                               # Utility condivise
│   ├── __init__.py
│   ├── metrics.py                       # Metriche di performance (4KB)
│   ├── sanitization.py                  # Validazione input (0.7KB)
│   └── visualization.py                # Visualizzazione avanzata (29KB)
│
├── _Reports_/                           # Report legacy (10 run)
│   └── rpt_YYYYMMDD_HHMM_NNegNNelNNcl/
│       ├── config.yaml
│       ├── execution_parameters.json
│       ├── realtime_metrics.json
│       ├── results_table.csv
│       ├── *_client_statistics.csv
│       ├── global_model_round_*.keras
│       └── logs_DATASET/               # TensorBoard logs
│
├── _img_/                               # Immagini documentazione
├── _screenshot/                         # Screenshot applicazione (8 file)
├── Appunti_DEVS/                        # Note sviluppo
├── public/                              # Risorse pubbliche condivise
│   └── world-110m.json
│
├── train_32x32.mat                      # Dataset SVHN training (182MB)
├── test_32x32.mat                       # Dataset SVHN testing (64MB)
├── federated-learning-analysis.md       # Analisi FL (14KB)
├── project_structure_main.txt           # Struttura progetto
├── project_structure_complete.txt       # Struttura completa (6.8MB)
└── struttura_progetto_MDPI_0.7.2.txt   # Struttura v0.7.2 (6.8MB)
```

---

## 9. Statistiche del Progetto

| Metrica | Valore |
|---|---|
| **File totali** (esclusi node_modules) | ~60.991 |
| **Codice Python** | ~195 KB (15 file) |
| **Codice JavaScript/JSX** | ~122 KB (25+ file) |
| **Immagini cliniche** | ~60.220 |
| **Dataset clinici** | 6 |
| **Dataset standard ML** | 5 |
| **Esperimenti eseguiti (nuovo sistema)** | 64 |
| **Esperimenti eseguiti (vecchio sistema)** | 10 |
| **Periodo di sviluppo** | Settembre 2024 — Febbraio 2025 |
| **Modelli salvati** | .h5, .keras |
| **Dimensione dataset SVHN** | ~246 MB |
| **File più grande (codice)** | App.js (52KB, frontend) |
| **File più grande (Python)** | main.py (31KB, backend) |

---

## 10. Caratteristiche Avanzate

### 10.1 Dinamismo dei Client
Il sistema supporta la simulazione del **client dinamism**, ovvero la capacità dei nodi di entrare e uscire dal processo di training federato in modo dinamico. Questa è una caratteristica avanzata che replica scenari reali in cui i dispositivi edge (es. dispositivi ospedalieri) possono disconnettersi.

### 10.2 Eterogeneità dei Dati
Il modulo `ClientHeterogeneityConfig.js` permette di configurare la **distribuzione non-IID** dei dati tra i client, simulando scenari realistici in cui ogni ospedale/struttura ha una distribuzione differente delle patologie.

### 10.3 Visualizzazione Geografica
La **GlobeVisualization** (globo 3D interattivo) mostra la distribuzione geografica dei nodi FL, rendendo il sistema particolarmente efficace per presentazioni accademiche e dimostrazioni del concetto di federated learning distribuito.

### 10.4 Confronto CL vs FL
Una delle funzionalità chiave è il confronto diretto tra **Centralized Learning** e **Federated Learning**, con grafici dedicati che mostrano le differenze in termini di accuracy, loss e convergenza.

### 10.5 Esperimento Continuo
Il report `rpt_20241105_1740` mostra evidenza di un **esperimento di federated learning continuo** in esecuzione per oltre 2 mesi (novembre 2024 — gennaio 2025), con metriche giornaliere raccolte automaticamente. Questo suggerisce un sistema con capacità di training asincrono e persistente.

---

## 11. Associazioni Istituzionali

Le immagini nella cartella `assets/` indicano un'affiliazione con:

- **Università degli Studi Niccolò Cusano / Mercatorum** (`mercatorum1.jpeg`, `mercatorum2.jpeg`)
- **Ospedale Pediatrico Bambino Gesù** (`opbg1.png`, `opbg2.png`)

Questo suggerisce un progetto di ricerca nell'ambito dell'**AI applicata alla medicina**, con l'obiettivo di pubblicazione su una rivista MDPI (Multidisciplinary Digital Publishing Institute).

---

## 12. Punti di Attenzione e Osservazioni

### 12.1 Aspetti Positivi
- Architettura modulare ben organizzata nella versione corrente
- Ampia varietà di dataset clinici reali per la validazione
- Sistema di reporting automatizzato con storicizzazione degli esperimenti
- Frontend ricco con molteplici visualizzazioni interattive
- Documentazione integrata nel frontend (info boxes con markdown)
- Confronto sistematico CL vs FL
- Supporto per scenari avanzati (dinamismo, eterogeneità)

### 12.2 Debiti Tecnici Rilevati
- File `App.js` da 52KB nel frontend è eccessivamente grande e andrebbe ulteriormente suddiviso in componenti/contesti
- Presenza di file di backup (`_BK`, `_BKGOOD`) nel repository — suggerisce l'assenza o l'uso limitato di version control (Git)
- File legacy ancora presenti in root (`main_BK04112024.py`, `dashboard.py`) dopo la ristrutturazione
- Duplicazione dei dati SVHN (file `.mat` sia in root che in `application/`)
- Duplicazione di `world-110m.json` (in `public/` e in `src/data/`)
- `utils/visualization.py` (29KB) potrebbe beneficiare di una suddivisione in moduli specializzati
- `helpers.py` in `application/reports/utils/` è vuoto (0 bytes)

### 12.3 Considerazioni di Sicurezza
- Il file `config.yaml` contiene la configurazione completa — verificare che non contenga credenziali
- I dataset clinici contengono immagini mediche — verificare la conformità GDPR/privacy
- Il `setupProxy.js` configura il proxy per le API — verificare l'hardening in produzione

---

## 13. Nota Metodologica

> **Importante**: Questa analisi è stata condotta interamente attraverso l'ispezione della struttura delle directory, dei nomi dei file, delle dimensioni e delle date di modifica, a causa di un blocco del filesystem FUSE/Dropbox che ha impedito la lettura del contenuto dei file sorgente. Di conseguenza, le conclusioni sui dettagli implementativi specifici (algoritmi esatti, framework specifici, logica di aggregazione) sono inferenze basate sulla nomenclatura e sulla struttura del progetto. Un'analisi del codice sorgente permetterebbe conclusioni più precise su: architetture CNN specifiche, strategia di aggregazione FL, metriche implementate, configurazione delle API REST, e dettagli del data preprocessing.
>
> Per un'analisi più approfondita, si consiglia di riprovare dopo aver messo in pausa la sincronizzazione Dropbox o dopo aver copiato i file in una cartella locale.

---

*Analisi generata il 6 febbraio 2026*
*Versione progetto analizzata: MDPI 0.7.2*
