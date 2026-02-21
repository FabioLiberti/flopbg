# dashboard.py

import streamlit as st
import json
import time
import os
import matplotlib.pyplot as plt

# Configura la directory di esecuzione
#execution_dir = '_Reports_/latest_execution'  # Assicurati che punti alla directory corretta
execution_dir = '_Reports_/rpt_20240915_2120_02eg01el02cl'  # puntare in automatico alla sottocartella corretta

st.title('Federated Learning Dashboard')

placeholder = st.empty()

while True:
    # Verifica se il file di metriche esiste
    metrics_file = os.path.join(execution_dir, 'realtime_metrics.json')
    if os.path.exists(metrics_file):
        with open(metrics_file, 'r') as f:
            metrics = json.load(f)

        rounds = metrics['rounds']
        federated_loss = metrics['federated_loss']
        federated_accuracy = metrics['federated_accuracy']
        centralized_loss = metrics.get('centralized_loss', [])
        centralized_accuracy = metrics.get('centralized_accuracy', [])

        with placeholder.container():
            st.subheader('Metriche Federate')

            fig1, ax1 = plt.subplots()
            ax1.plot(rounds, federated_loss, label='Federated Loss')
            ax1.set_xlabel('Rounds')
            ax1.set_ylabel('Loss')
            ax1.legend()
            st.pyplot(fig1)

            fig2, ax2 = plt.subplots()
            ax2.plot(rounds, federated_accuracy, label='Federated Accuracy')
            ax2.set_xlabel('Rounds')
            ax2.set_ylabel('Accuracy')
            ax2.legend()
            st.pyplot(fig2)

            if centralized_loss and centralized_accuracy:
                st.subheader('Metriche Centralizzate')
                st.write(f"Centralized Loss: {centralized_loss[0]:.4f}")
                st.write(f"Centralized Accuracy: {centralized_accuracy[0]:.4f}")

    else:
        st.write("In attesa dell'inizio dell'addestramento...")

    time.sleep(5)  # Aggiorna ogni 5 secondi
