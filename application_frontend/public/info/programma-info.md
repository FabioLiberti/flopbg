Riepilogo del programma sviluppato (in corso di evoluzione):
---------------------------------------------------------------------------
Programma esemplificativo che interroga 5 datasets pubblici (MNIST, Fashion MNIST, CIFAR10, CIFAR100, SVHN) e confronta l'apprendimento federato rispetto a quello centralizzato, tenendo in considerazione la dinamicità e l'eterogeneità dei client partecipanti al processo di apprendimento (mediante l'utilizzo dell'algoritmo FedProx è stato introdotto un termine di "participation rate" per la simulazione della dinamicità dei client, "learning rate" per l'eterogeneità, "quantization bits" per la riduzione della comunicazione in un framework con applicazione web in React/Flask, attualmente in evoluzione). 

Segue sintesi del programma sviluppato:

A) Ambito coperto:
- Apprendimento federato per problemi di classificazione di immagini
- Simulazione di scenari multi-client dinamici ed eterogenei con dati distribuiti non-IID

B) Funzionalità chiave:
- Distribuzione non-IID dei dati tra i client
- Gestione dei client dinamici (selezione dinamica dei client: partecipazione dinamica con participation_rate)
- Gestione dei client eterogenei (learning_rate per simulazione eterogeneità computazionale)
- Riduzione dell'overhead di comunicazione (quantizzazione dei pesi dei client)
- Configurazione flessibile dei parametri dell'esperimento
- Visualizzazione in tempo reale dell'accuratezza del modello (confronto con apprendimento centralizzato)
- Reporting

C) Framework e linguaggi:
- Backend: Python con TensorFlow e Flask
- Frontend: JavaScript con Reat e Chart.js

D) Algoritmo di apprendimento (Federated Learning) e Metodo seguito:
- Aggregazione dei pesi (FedAvg, FedProx con termine di penalizzazione MU)
- Splitting non-IID dei dati

E) Caratteristiche dei dataset:
n.5 DATASETS (a scelta mediante esecuzione da interfaccia web, eseguiti tutti consecutivamente e confrontati tra loro, anche rispetto apprendimento centralizzato, con produzione dei corrispondenti reports, se il codice viene eseguito manualmente).

- MNIST: immagini in bianco e nero di cifre scritte a mano (28x28 pixel, 10 classi)
- Fashion MNIST: immagini in bianco e nero di 10 categorie di abbigliamento (28x28 pixel)
- CIFAR-10: immagini a colori di 10 classi di oggetti (32x32 pixel)
- CIFAR-100: immagini a colori di 100 classi di oggetti (32x32 pixel)
- SVHN (Street View House Numbers): immagini a colori di cifre da 0 a 9 (32x32 pixel)

F) Modello di Rete Neurale applicato: 
- Rete convoluzionale (CNN) per la classificazione delle immagini.


Il codice al momento è in sviluppo sulle seguenti macchine, ognuna differente e operativa su specifico pc.

G) Pc utilizzati: 
- n. 2 pc obsoleti di ufficio (di cui uno con una vecchia GPU NVidia da 2GB); 
- n. 1 mini pc domestico;
- n. 1 server in cloud (Contabo VPS3);
- n. 1 macbook Pro M1 (ultima versione, più evoluta e performante con web application per consultazione processo di apprendimento in realt-time).

Al momento le versioni eseguite singolarmente su ogni pc sono distinte e concorrenti (quelle sviluppate sono molte di più) ma nelle ultime ore mi stò concentrando su quella più evoluta del Mac.

H) Demo video:
prodotto video demo che mostra il funzionamento della versione-MAC con le seguenti caratteristiche:

I) Hyperparameters:
Seguono gli iperparametri attualmente configurati resi disponibili all’esterno della configurazione per l’ottimizzazione del processo di test (configurazione mediante file “config.yaml”). 

Hyperparameters:
# config.yaml

global_epochs: 10
local_epochs: 3
num_clients: 50
batch_size: 32
learning_rate: 0.001
participation_rate: 0.7 # Partecipazione "parziale" del client
mu: 0.1  # Coefficiente di penalizzazione per FedProx
quantization_bits: 8  # specifica i bit per la quantizzazione


Funzionalità
Segue descrizione delle funzionalità approfondite e sviluppate nel codice inerenti il federated learning in ambienti dinamici ed eterogenei:

a) Gestione di Client Eterogenei

In un sistema di Federated Learning, i client sono spesso eterogenei, ovvero variano in termini di capacità computazionale, velocità di rete, e disponibilità di dati. Il programma affronta questo problema con:

•	Distribuzione non i.i.d. dei dati: La suddivisione dei dati tra i client non è indipendente e identicamente distribuita (non i.i.d.), il che simula scenari del mondo reale in cui i client possiedono dati che variano ampiamente in termini di contenuti e quantità. Il programma implementa una distribuzione basata su shard non i.i.d. per ciascun client, emulando così un ambiente realistico.

•	Eterogeneità nel carico di lavoro: Ogni client può avere tempi di addestramento variabili a seconda della quantità di dati assegnati e delle risorse computazionali disponibili. Il programma monitora questi tempi tramite il logging e la registrazione dei "client training times", il che permette di confrontare l'efficienza computazionale tra i client.

•	FedProx per client eterogenei: FedProx è un'algoritmo di Federated Learning sviluppato per migliorare la robustezza del modello globale quando i client sono eterogenei. Introduce un termine di penalizzazione nel processo di aggregazione dei pesi che limita l'aggiornamento locale rispetto al modello globale. Questo evita che client con dati particolarmente divergenti o con una velocità di apprendimento anomala influenzino eccessivamente il modello globale. Il programma implementa FedProx con un parametro mu che regola questa penalizzazione.

b) Quantizzazione dei Pesi

Per ridurre il carico di comunicazione tra client e server, il programma utilizza la quantizzazione dei pesi, riducendo la precisione dei pesi del modello prima che siano inviati al server. Questo è utile in ambienti distribuiti dove la larghezza di banda può essere limitata o costosa.

•	Implementazione della quantizzazione: Il parametro quantization_bits controlla il numero di bit utilizzati per rappresentare i pesi durante la fase di trasmissione. La quantizzazione riduce l'overhead di comunicazione senza influenzare drasticamente la precisione del modello, specialmente se i pesi possono essere rappresentati con una precisione inferiore (es. da 32-bit a 8-bit).

c) Partecipazione Parziale dei Client

In scenari reali, non tutti i client possono partecipare a ogni round di addestramento. Il programma introduce una partecipazione parziale dei client regolata dal parametro participation_rate.

•	Selezione dinamica dei client: A ogni round, solo una percentuale dei client totali partecipa all'addestramento. Questo riflette meglio ambienti federati dove i client potrebbero essere temporaneamente non disponibili o avere risorse limitate. Il programma gestisce la selezione casuale dei client partecipanti, rendendo il sistema più dinamico e robusto.

•	Monitoraggio e reporting della partecipazione: Il programma tiene traccia della partecipazione dei client a ogni round e registra i client che hanno contribuito agli aggiornamenti dei pesi. Questo è utile per analizzare la qualità e l'efficienza del sistema in termini di copertura dei client.
