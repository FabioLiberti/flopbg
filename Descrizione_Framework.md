# FLOPBG — Federated Learning in Dynamic and Heterogeneous Environments

## A Simulation Platform for Privacy-Preserving Medical AI

---

## Contesto Accademico

FLOPBG è una piattaforma di simulazione sviluppata nell'ambito di un Dottorato di Ricerca in Big Data and Artificial Intelligence presso l'Universitas Mercatorum (Università delle Camere di Commercio Italiane), in collaborazione con l'Ospedale Pediatrico Bambino Gesù (IRCCS), il più grande centro di ricerca e cura pediatrica in Europa. Il progetto affronta il problema dell'addestramento distribuito di modelli di intelligenza artificiale per l'imaging medico diagnostico in contesti in cui la condivisione centralizzata dei dati clinici è impedita da vincoli normativi (GDPR, regolamentazioni sanitarie nazionali) e infrastrutturali.

## Problema Scientifico

I modelli di deep learning per la diagnosi medica per immagini richiedono grandi volumi di dati etichettati per raggiungere prestazioni clinicamente accettabili. Tuttavia, i dati clinici sono distribuiti tra molteplici istituzioni sanitarie (ospedali, cliniche, centri di ricerca) che non possono condividerli centralmente per ragioni di privacy, sovranità dei dati e compliance normativa. Il Federated Learning (FL) risolve questo problema consentendo l'addestramento collaborativo di un modello globale senza trasferire i dati grezzi: ogni istituzione addestra localmente il modello sui propri dati e condivide solo gli aggiornamenti dei pesi del modello con un server centrale di aggregazione. FLOPBG affronta le sfide reali che rendono il FL non banale: eterogeneità computazionale tra i nodi, partecipazione intermittente, distribuzione non-IID dei dati e vincoli di comunicazione.

---

## Architettura del Sistema

Il sistema è composto da due macro-componenti: un backend Python (Flask + TensorFlow/Keras) che implementa il motore di Federated Learning, e un frontend React che fornisce un dashboard interattivo per la configurazione, il monitoraggio in tempo reale e la visualizzazione dei risultati.

### Backend (Python)

Il backend espone un'API REST (Flask, porta 5001) con endpoint per configurazione (`/config`), avvio (`/start`), arresto (`/stop`) e monitoraggio (`/status`) degli esperimenti. Il cuore è la classe `FederatedLearningSystem` (768 righe), che orchestra l'intero ciclo di vita dell'esperimento: caricamento del dataset, distribuzione non-IID dei dati ai client, creazione e gestione dei client con le rispettive caratteristiche di eterogeneità e dinamismo, esecuzione dei round di addestramento federato, aggregazione dei pesi e valutazione delle metriche.

### Frontend (React)

Il frontend offre un'interfaccia a tab con le seguenti sezioni: Overview (presentazione del framework), Datasets (selezione tra 11 dataset), Basic Configuration (parametri di addestramento), Advanced Configuration (eterogeneità e dinamismo dei client), Node Distribution (mappa geografica interattiva dei nodi con viste nazionale/europea/globale), Use Cases (scenari preconfigurati), Experiment (avvio, monitoraggio real-time e visualizzazione risultati). La mappa geografica utilizza react-simple-maps con proiezione D3 geoEqualEarth per visualizzare la distribuzione dei nodi ospedalieri.

---

## Componenti Principali del Motore FL

### Server di Aggregazione

Il server mantiene il modello globale e implementa due strategie di aggregazione: FedAvg (Federated Averaging) e FedProx. In FedAvg, i pesi del modello globale vengono aggiornati come media pesata dei pesi dei client, dove il peso di ogni client è proporzionale al numero di campioni nel suo dataset locale:

```
new_weights = Σ (samples_k / total_samples) × weights_k
```

In FedProx, dopo l'aggregazione FedAvg si applica un termine prossimale che vincola i pesi aggregati a rimanere vicini al modello globale corrente:

```
prox_weights = global_weights − μ × (global_weights − aggregated_weights)
```

dove μ è un coefficiente configurabile (default 0.1) che controlla la forza della regolarizzazione. Quando μ=0, FedProx si riduce a FedAvg.

### Client

Ogni client rappresenta un nodo (ospedale) con il proprio dataset locale, capacità computazionale e velocità di rete. Il client riceve il modello globale dal server, lo addestra localmente per un numero configurabile di epoche (`local_epochs`) sul proprio dataset, opzionalmente quantizza i pesi del modello risultante per ridurre il costo di comunicazione, e restituisce i pesi aggiornati al server. Ogni client è caratterizzato da un tipo di eterogeneità (strong, medium, weak) che determina le sue risorse computazionali e di rete, e da un tipo di dinamismo (fast, normal, slow) che determina la sua probabilità di partecipazione a ogni round.

### Client Manager

Gestisce il ciclo di vita dei client: registrazione, selezione per ogni round basata sui tassi di partecipazione, aggiornamento della reputazione e selezione incentivata. La selezione dei client attivi a ogni round avviene in modo probabilistico: per ogni client, la probabilità effettiva di partecipazione è il prodotto del tasso di partecipazione globale (`global_participation_rate`) per il tasso individuale del client (basato sul suo tipo di dinamismo). La reputazione di ogni client viene inizializzata a 1.0 e può essere aggiornata in base alla qualità del suo contributo, consentendo una selezione pesata per i round successivi.

---

## Eterogeneità dei Client

Il sistema modella l'eterogeneità computazionale attraverso tre classi di client:

| Tipo | Computational Power | Network Speed | Proporzione | Rappresentazione |
|------|-------------------|---------------|-------------|-----------------|
| **Strong** | 1.0 | 1.0 | 30% | Grandi ospedali universitari con GPU dedicate e connessioni in fibra ottica |
| **Medium** | 0.7 | 0.7 | 50% | Centri clinici con risorse adeguate ma non di ultima generazione |
| **Weak** | 0.4 | 0.5 | 20% | Piccoli ospedali periferici con hardware obsoleto e connettività limitata |

Ogni parametro (computational_power, network_speed, proportion) è configurabile dall'utente tramite il dashboard, consentendo di simulare scenari con distribuzioni diverse delle risorse.

---

## Dinamismo dei Client

Il sistema modella la partecipazione intermittente dei client attraverso tre profili di dinamismo:

| Tipo | Participation Rate | Proporzione | Rappresentazione |
|------|-------------------|-------------|-----------------|
| **Fast** | 0.9 | 30% | Client affidabili, quasi sempre disponibili, infrastruttura stabile |
| **Normal** | 0.7 | 50% | Partecipazione tipica, occasionali assenze per manutenzione o carico |
| **Slow** | 0.5 | 20% | Client inaffidabili con frequenti assenze, infrastruttura IT limitata |

A ogni round di addestramento federato, la partecipazione di ciascun client viene determinata probabilisticamente: se `random() <= global_participation_rate × client_participation_rate`, il client partecipa al round; altrimenti viene escluso. Questo produce pattern di partecipazione realistici e variabili nel tempo.

---

## Distribuzione Non-IID dei Dati

I dati vengono distribuiti tra i client utilizzando un algoritmo basato su shard che produce distribuzioni non-IID (non identicamente e indipendentemente distribuite). L'algoritmo:

1. Ordina tutti i campioni per etichetta, creando blocchi di dati omogenei per classe
2. Divide l'intero dataset in 200 shard
3. Mescola casualmente gli shard
4. Distribuisce gli shard ai client in modo round-robin

Il risultato è che ogni client riceve un sottoinsieme di classi non uniforme, simulando la situazione reale in cui ospedali diversi vedono casistiche cliniche diverse (ad esempio, un ospedale di montagna vede prevalentemente traumi, mentre un centro oncologico vede prevalentemente tumori).

---

## Quantizzazione dei Pesi

Il sistema implementa la quantizzazione post-training dei pesi del modello per ridurre il costo di comunicazione tra client e server. L'algoritmo: per ogni matrice di pesi W, calcola w_min e w_max, normalizza i valori nell'intervallo [0, 1], moltiplica per (2^bits − 1), arrotonda all'intero più vicino, e riconverte. Tre livelli supportati:

| Bit | Compressione | Precisione | Uso |
|-----|-------------|-----------|-----|
| **32 bit** | Nessuna | Piena | Baseline senza compressione |
| **16 bit** | Bilanciata | Buona | Compromesso comunicazione/qualità |
| **8 bit** | Massima | Ridotta | Client weak con banda limitata |

La quantizzazione è particolarmente utile per i client weak con banda limitata e consente di valutare il trade-off tra efficienza di comunicazione e degradazione della convergenza.

---

## Sistema di Reputazione

Ogni client possiede un punteggio di reputazione inizializzato a 1.0 che può essere aggiornato in base alla qualità del suo contributo all'addestramento. Il Client Manager utilizza questi punteggi per implementare una selezione incentivata: la probabilità di selezione di un client è proporzionale al suo punteggio di reputazione rispetto alla somma totale delle reputazioni. Questo meccanismo premia i client che forniscono aggiornamenti di alta qualità e penalizza quelli che producono aggiornamenti rumorosi o di bassa qualità.

---

## Dataset Supportati

### Dataset Benchmark (5)

| Dataset | Risoluzione | Classi | Descrizione |
|---------|-----------|--------|-------------|
| MNIST | 28×28×1 | 10 | Cifre scritte a mano |
| Fashion-MNIST | 28×28×1 | 10 | Capi di abbigliamento |
| CIFAR-10 | 32×32×3 | 10 | Oggetti comuni |
| CIFAR-100 | 32×32×3 | 100 | Oggetti fine-grained |
| SVHN | 32×32×3 | 10 | Numeri civici da Street View |

### Dataset Clinici di Imaging Medico (6)

| Dataset | Risoluzione | Classi | Descrizione |
|---------|-----------|--------|-------------|
| Chest X-Ray | 150×150×3 | 2 | Normale vs Polmonite |
| ISIC Skin Lesion | 224×224×3 | 9 | Melanoma, nevo, carcinoma basocellulare, squamocellulare, cheratosi |
| Brain Tumor | 224×224×3 | 4 | Glioma, meningioma, pituitario, sano |
| Brain Tumor MRI | 224×224×3 | 4 | Variante con dataset diverso |
| Diabetic Retinopathy | 128×128×3 | 5 | Dalla assenza alla forma proliferativa |
| Skin Cancer | 150×150×3 | 2 | Benigno vs Maligno |

Il totale dei dati clinici supera le 60.000 immagini.

---

## Metriche di Valutazione

Il sistema calcola e visualizza per ogni round:

- **Accuracy**: tasso di classificazione corretta
- **Loss**: entropia incrociata categorica o binaria
- **Precision**: tasso di veri positivi tra le predizioni positive (macro-averaged)
- **Recall**: tasso di veri positivi tra i reali positivi (macro-averaged)
- **F1-Score**: media armonica di precision e recall
- **AUC-ROC**: area sotto la curva ROC (per classe nel caso multiclasse, strategia One-vs-Rest)
- **Matrice di Confusione**: matrice N×N completa

Tutte le metriche vengono confrontate con il baseline centralizzato (Round 0).

---

## Scenari Multi-Scala

### Nazionale — Italia

10 ospedali di montagna italiani (Aosta, Bolzano, Trento, Belluno, Sondrio, L'Aquila, Potenza, Campobasso, Rieti, Isernia) per la detection di polmonite pediatrica da radiografie toraciche. Dataset: Chest X-Ray. 100 round, learning rate 0.01, μ=0.001, quantizzazione 8 bit, tasso di partecipazione globale 0.5.

### Europeo — EHDS

12 centri dermatologici in Europa (Berlino, Parigi, Londra, Milano, Madrid, Amsterdam, Stoccolma, Vienna, Zurigo, Lisbona, Atene, Varsavia) per la classificazione di lesioni cutanee nel framework European Health Data Space. Dataset: Skin Cancer. 150 round, learning rate 0.005, μ=0.01, quantizzazione 16 bit, tasso di partecipazione globale 0.6.

### Globale — WHO

15 centri clinici in 6 continenti (New York, San Francisco, Londra, Berlino, Tokyo, Pechino, Singapore, São Paulo, Buenos Aires, Melbourne, Delhi, Lagos, Il Cairo, Città del Capo, Parigi) per il rilevamento della tubercolosi coordinato dall'OMS. Dataset: Chest X-Ray. 200 round, learning rate 0.001, μ=0.05, quantizzazione 8 bit, tasso di partecipazione globale 0.4.

---

## Flusso di Esecuzione End-to-End

**Fase 1 — Configurazione.** L'utente seleziona il dataset, configura i parametri di addestramento (round, epoche locali, batch size, learning rate, μ, bit di quantizzazione, tasso di partecipazione), definisce l'eterogeneità e il dinamismo dei client, e distribuisce i nodi sulla mappa geografica.

**Fase 2 — Inizializzazione.** Il sistema carica il dataset, lo distribuisce in modo non-IID tra i client, crea il modello globale con l'architettura CNN appropriata per il dataset selezionato, e inizializza i client con i rispettivi parametri di eterogeneità e dinamismo.

**Fase 3 — Baseline centralizzato.** Il sistema addestra un modello centralizzato sull'intero dataset (Round 0) come baseline di confronto.

**Fase 4 — Addestramento federato.** Per ogni round da 1 a max_rounds: (a) selezione probabilistica dei client attivi basata sui tassi di partecipazione; (b) distribuzione del modello globale ai client selezionati; (c) addestramento locale di ciascun client per local_epochs epoche; (d) quantizzazione opzionale dei pesi; (e) raccolta dei pesi aggiornati e dei conteggi dei campioni; (f) aggregazione FedAvg o FedProx; (g) valutazione del modello globale sul test set; (h) salvataggio delle metriche del round.

**Fase 5 — Risultati.** Il sistema genera un report completo con metriche per round, confronto con il baseline centralizzato, visualizzazioni (grafici accuracy/loss, precision/recall/F1, curve ROC, matrice di confusione, heatmap di partecipazione dei client, distribuzione dei dati per client, tempi di addestramento per client), e salva tutti i risultati in formato JSON e PNG.

---

## Stack Tecnologico

| Componente | Tecnologie |
|-----------|-----------|
| **Backend** | Python 3, Flask, TensorFlow 2 / Keras |
| **Frontend** | React 18, Chart.js, react-simple-maps, D3.js |
| **FL Framework** | FedAvg, FedProx, Weight Quantization |
| **Data Processing** | NumPy, Scikit-learn, Pillow |
| **Visualization** | Chart.js (metriche), D3.js geoEqualEarth (mappe geografiche) |
| **Communication** | REST API, JSON, YAML configuration |
