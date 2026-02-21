Struttura del progetto: (aggiornare con parte di application)
-----------------------
/Users/fxlybs/_DEV/_MDPI_/MDPI_0.7.2/
├── application/
│   ├── app.py
│   └── federated_learning_system.py
├── data/
│   └── data_loading.py
├── clients/
│   ├── client.py
│   └── client_manager.py
├── server/
│   └── server.py
├── utils/
│   └── metrics.py
└── config.yaml
├── config.yaml
├── dashboard.py
└── main.py
------------------------------

Nota. Esecuzione della "Dashboard"
Per avviare la dashboard, esegui (bash):
streamlit run dashboard.py
PS: Assicurati che lo script di addestramento (main.py) sia in esecuzione contemporaneamente.

------------------------------
Conda: fl1 (python: 3.10.14)
------------------------------
Attivazione Application

1. Terminale 1: (mdpi) fxlybs@MacBook-Pro-di-FxLybs application % python app.py
2. Terminale 2: npm start

-----------------------------------------------------------------------------------------------------
Note di sviluppo (TO DO):
1. dataset clinici (dati strutturati e non strutturati)
2. aggiungere/conforntare più algoritmi
3. aggiungere/conforntare più strutture (CNN,....)
4. aggiungi metrica AUC-ROC
5. 1. Frontend (App.js)
- correggere metrica loss (saltata)
- correggere grafico visualizzazione confornocon centralizzato (saltato)
- Notifiche in tempo reale: Aggiungere notifiche popup (con librerie come toast) per informare l'utente quando un esperimento è iniziato o terminato.
6. 2. Backend (app.py)
- Persistenza dei risultati: Puoi salvare i risultati di ogni esperimento in un database o in un file per poterli recuperare successivamente.
- Parallelismo avanzato: Puoi migliorare il supporto per esperimenti multipli eseguendoli in parallelo, usando librerie come celery o rq per gestire la coda dei job.
7. 3. Sistema di Apprendimento Federato (federated_learning_system.py)
- Personalizzazione del modello: Attualmente il programma esegue un addestramento federato standard. Puoi introdurre meccanismi di personalizzazione del modello locale, dove ogni client può adattare il modello ai propri dati.
- Supporto per vari algoritmi federati: Puoi aggiungere supporto per più algoritmi di aggregazione, come FedAvg, FedProx, o varianti basate sulla compressione dei pesi o sulla quantizzazione.
8. 4. Metriche (metrics.py)
- Nuove metriche: Potresti aggiungere nuove metriche come AUC-ROC o calcolare metriche personalizzate per specifici tipi di dati.

Aggiunta di Algoritmi di Apprendimento Federato Avanzati:

Potresti espandere il programma includendo altri algoritmi federati come FedProx, FedNova, SCAFFOLD, o tecniche basate sulla compressione o sulla privacy differenziale.
Sicurezza e Privacy:

Integra meccanismi di privacy differenziale o crittografia omomorfica per proteggere i dati dei client.
Simulazione di Client Eterogenei:

Potresti simulare client eterogenei con diverse risorse computazionali e connessioni di rete variabili, testando l'impatto sulle performance globali.


.......
