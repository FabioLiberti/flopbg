<p align="center">
  <img src="_img_/Sperimentazioni_HEAD.png" alt="FLOPBG Banner" width="100%"/>
</p>

<h1 align="center">FLOPBG - Federated Learning in Dynamic and Heterogeneous Environments</h1>

<p align="center">
  <strong>A full-stack platform for Federated Learning research on medical imaging and benchmark datasets</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10-blue?logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/TensorFlow-2.16+-orange?logo=tensorflow&logoColor=white" alt="TensorFlow"/>
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Flask-API-black?logo=flask&logoColor=white" alt="Flask"/>
  <img src="https://img.shields.io/badge/License-Research-green" alt="License"/>
</p>

<p align="center">
  <em>Developed in collaboration between Universita Mercatorum and Ospedale Pediatrico Bambino Gesu (OPBG)</em>
</p>

---

## Overview

**FLOPBG** is a research platform designed to simulate, evaluate, and compare **Federated Learning (FL)** strategies against centralized approaches. The system focuses on **medical imaging classification** across heterogeneous and dynamic client environments, providing a comprehensive experimentation framework with real-time monitoring.

<p align="center">
  <img src="_screenshot/screen1.png" alt="Platform Dashboard" width="90%"/>
</p>

<p align="center">
  <img src="_img_/FLOPBG-Infografica.png" alt="FLOPBG Infografica" width="48%"/>
  &nbsp;
  <img src="_img_/FLOPBG-Diagramma.png" alt="FLOPBG Diagramma" width="48%"/>
</p>

---

## Key Features

| Feature | Description |
|---------|-------------|
| **12 FL Algorithms** | FedAvg, FedProx, SCAFFOLD, FedNova, FedExP, FedDyn, MOON, FedDisco, FedSpeed, FedLPA, DeepAFL, FedEL |
| **Client Heterogeneity** | Simulates strong, medium, and weak clients with different computational power and network speed |
| **Client Dynamism** | Variable participation rates (fast, normal, slow) with dropout simulation |
| **Non-IID Distribution** | Realistic data partitioning across clients |
| **Weight Quantization** | Configurable 8/16/32-bit compression for communication efficiency |
| **Reputation System** | Client selection weighted by reputation scores with incentive-based participation |
| **Real-time Dashboard** | Live monitoring of training metrics, client activity, and model performance |
| **11 Datasets** | 5 benchmark + 6 clinical medical imaging datasets |

---

## Supported Algorithms

| Algorithm | Category | Description |
|-----------|----------|-------------|
| **FedAvg** | Baseline | Weighted averaging of client model updates |
| **FedProx** | Regularization | Proximal term to limit client drift from the global model |
| **SCAFFOLD** | Variance Reduction | Control variates to correct client-server gradient drift |
| **FedNova** | Normalized Aggregation | Normalizes contributions by local gradient steps count |
| **FedExP** | Adaptive Aggregation | Extrapolation-based dynamic step size from pseudo-gradient agreement |
| **FedDyn** | Dynamic Regularization | Per-client dynamic regularizer updated at each round |
| **MOON** | Contrastive Learning | Model-contrastive loss aligning local representations with the global model |
| **FedDisco** | Distribution-Aware | Weights clients by KL-divergence of label distributions from the global distribution |
| **FedSpeed** | Gradient Correction | Proximal term with gradient perturbation correction |
| **FedLPA** | Bayesian Aggregation | Layer-wise precision-weighted (posterior) aggregation |
| **DeepAFL** | Analytic FL | Freezes feature layers and solves classifier via ridge regression |
| **FedEL** | Communication Efficient | Elastic layer selection based on update importance with configurable budget |

---

## Supported Datasets

### Benchmark Datasets

| Dataset | Resolution | Classes |
|---------|-----------|---------|
| MNIST | 28 x 28 x 1 | 10 |
| Fashion MNIST | 28 x 28 x 1 | 10 |
| CIFAR-10 | 32 x 32 x 3 | 10 |
| CIFAR-100 | 32 x 32 x 3 | 100 |
| SVHN | 32 x 32 x 3 | 10 |

### Clinical Datasets

| Dataset | Resolution | Classes | Description |
|---------|-----------|---------|-------------|
| Brain Tumor MRI | 224 x 224 x 3 | 4 | Glioma, meningioma, pituitary, no tumor |
| ISIC Skin Lesion | 224 x 224 x 3 | 9 | Melanoma, nevus, BCC, SCC and more |
| Chest X-Ray | 150 x 150 x 3 | 2 | Normal vs Pneumonia |
| Diabetic Retinopathy | 224 x 224 x 3 | 5 | No DR to Proliferative DR |
| Skin Cancer | 224 x 224 x 3 | 2 | Benign vs Malignant |
| Brain Tumor | 224 x 224 x 3 | 4 | Alternative brain tumor dataset |

---

## Architecture

```
                    +---------------------------+
                    |     React Frontend        |
                    |  Configuration | Dashboard |
                    |  Charts | Globe | Metrics  |
                    +------------+--------------+
                                 | Axios (proxy :3000 -> :5001)
                    +------------v--------------+
                    |       Flask REST API       |
                    |  /config /start /status    |
                    |  /stop /datasets /images   |
                    +------------+--------------+
                                 |
              +------------------v------------------+
              |    FederatedLearningSystem Engine    |
              |                                     |
              |  +----------+   +----------------+  |
              |  |  Server   |   | ClientManager  |  |
              |  | (12 aggr. |   | (selection,    |  |
              |  | algorithms)|  |  reputation)   |  |
              |  +----------+   +----------------+  |
              |        |               |            |
              |  +-----v---------------v---------+  |
              |  | Client 1 | Client 2 | ... | N |  |
              |  | (local training, quantization)|  |
              |  +-------------------------------+  |
              +-------------------------------------+
```

<p align="center">
  <img src="_img_/FLOPBG-Pipeline.png" alt="FLOPBG Pipeline" width="90%"/>
</p>

### Experimentation Pipeline

| Phase | Name | Description |
|:-----:|------|-------------|
| **1** | **Dataset Selection** | Selection from 11 available datasets (5 benchmark + 6 clinical medical imaging) |
| **2** | **Client Configuration** | Definition of client heterogeneity profiles (strong, medium, weak) and dynamism parameters (participation rate, dropout) |
| **3** | **Node Distribution** | Geographic deployment of nodes with configurable network topology and communication constraints |
| **4** | **FL Training** | Execution of federated training rounds using the selected algorithm (12 available) |
| **5** | **Aggregation** | Server-side aggregation with algorithm-specific strategies (weighted averaging, control variates, normalized gradients, contrastive alignment, etc.) |
| **6** | **Evaluation** | Comprehensive assessment through Accuracy, Loss, ROC-AUC, and Confusion Matrix metrics |

---

## Centralized vs Federated Learning

The platform provides direct comparison between centralized and federated training approaches, with detailed metrics at each round.

<p align="center">
  <img src="_img_/Graph_Central_vs_Fed.png" alt="Centralized vs Federated Comparison" width="85%"/>
</p>

---

## Geographic Node Distribution

Clients can be mapped to geographic locations and visualized on an interactive 3D globe. Each node is classified by computational tier and participation behavior.

<p align="center">
  <img src="_screenshot/screen4.png" alt="Globe Node Distribution" width="85%"/>
</p>

<p align="center">
  <img src="_img_/Global Node Distribution.png" alt="Node Legend" width="400"/>
</p>

---

## Platform Dashboard

The web dashboard provides full control and real-time monitoring of federated learning experiments.

<p align="center">
  <img src="_screenshot/screen5.png" alt="Results and ROC Curves" width="85%"/>
</p>

<p align="center">
  <img src="_screenshot/screen6.png" alt="Detailed Metrics" width="85%"/>
</p>

<p align="center">
  <img src="_screenshot/screen7.png" alt="Client Participation and Data Distribution" width="85%"/>
</p>

<p align="center">
  <img src="_screenshot/screen8.png" alt="Training Times" width="85%"/>
</p>

---

## Experiment Results

Output generated by the platform after a federated learning experiment (MNIST, 10 clients, 10 rounds, FedAvg).

### Model Performance

<p align="center">
  <img src="_screenshot/results/accuracy_loss.png" alt="Accuracy and Loss per Round" width="85%"/>
</p>

<p align="center">
  <em>Federated vs Centralized accuracy and loss convergence across training rounds</em>
</p>

<p align="center">
  <img src="_screenshot/results/precision_recall_f1.png" alt="Precision Recall F1" width="85%"/>
</p>

<p align="center">
  <em>Precision, Recall and F1-Score progression per round</em>
</p>

### Classification Analysis

<p align="center">
  <img src="_screenshot/results/confusion_matrix.png" alt="Confusion Matrix" width="50%"/>
  &nbsp;
  <img src="_screenshot/results/roc_curves.png" alt="ROC Curves" width="42%"/>
</p>

<p align="center">
  <em>Confusion Matrix (left) and per-class ROC Curves (right) at final round</em>
</p>

### Client Analysis

<p align="center">
  <img src="_screenshot/results/client_participation.png" alt="Client Participation Heatmap" width="85%"/>
</p>

<p align="center">
  <em>Client participation heatmap showing dynamic availability across rounds</em>
</p>

<p align="center">
  <img src="_screenshot/results/client_class_distribution.png" alt="Non-IID Class Distribution" width="48%"/>
  &nbsp;
  <img src="_screenshot/results/client_training_times.png" alt="Client Training Times" width="48%"/>
</p>

<p align="center">
  <em>Non-IID class distribution per client (left) and training times reflecting client heterogeneity (right)</em>
</p>

---

## Experiment Configuration

Full control over FL parameters: number of rounds, clients, learning rate, aggregation algorithm, client heterogeneity profiles, and dynamism settings.

<p align="center">
  <img src="_screenshot/screen2.png" alt="Configuration Panel" width="85%"/>
</p>

---

## Project Structure

```
flopbg/
├── application/                      # Backend FL engine
│   ├── app.py                        # Flask REST API server
│   ├── main.py                       # FL orchestrator
│   ├── federated_learning_system.py  # Core FL logic (12 algorithms)
│   ├── report_manager.py            # Report generation & scheduling
│   └── reports/                      # Reporting modules
│       ├── fl_reports.py             # FL-specific reporting
│       ├── metrics.py                # Metrics calculation
│       └── visualization.py          # Visualization utilities
├── application_frontend/             # React frontend
│   ├── src/
│   │   ├── App.js                    # Main application
│   │   ├── components/               # UI components (19+)
│   │   ├── hooks/                    # Custom React hooks
│   │   └── data/                     # Static data (geo, use cases)
│   └── package.json
├── clients/
│   ├── client.py                     # FL client node (12 training methods)
│   └── client_manager.py            # Client orchestration & reputation
├── server/
│   └── server.py                     # Aggregation server (8 strategies)
├── models/
│   └── model_definition.py          # CNN architectures (4 model types)
├── data/
│   └── data_loading.py              # Dataset loading & Non-IID splitting
├── utils/
│   ├── metrics.py                   # Evaluation metrics
│   ├── visualization.py            # Plotting utilities
│   └── sanitization.py             # Input validation
├── config.yaml                      # Experiment configuration
└── requirements.txt                 # Python dependencies
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Conda (recommended)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/FabioLiberti/flopbg.git
cd flopbg
```

**2. Create and activate the conda environment**
```bash
conda create -n flopbg python=3.10 -y
conda activate flopbg
pip install -r requirements.txt
```

**3. Install frontend dependencies**
```bash
cd application_frontend
npm install
cd ..
```

**4. Download datasets**

Clinical datasets must be downloaded separately and placed in the `data/` directory following this structure:
```
data/
├── chest_xray/train/  &  test/
├── ISIC/train/  &  test/
├── Brain Tumor MRI/Training/  &  Testing/
├── Retinopatia/
└── Skin Cancer/train/  &  test/
```

### Running the Application

**Terminal 1 - Backend:**
```bash
conda activate flopbg
python application/app.py
```

**Terminal 2 - Frontend:**
```bash
cd application_frontend
npm start
```

The application will be available at `http://localhost:3000` with the API running on port `5001`.

---

## Configuration

All experiment parameters are managed through `config.yaml`:

```yaml
# Training parameters
global_epochs: 2
local_epochs: 1
batch_size: 32
learning_rate: 0.001
mu: 0.1                          # FedProx / FedSpeed proximal term
num_clients: 5
ts: 5

# Client heterogeneity
client_types:
  strong:   { computational_power: 1.0, network_speed: 1.0, proportion: 0.3 }
  medium:   { computational_power: 0.7, network_speed: 0.7, proportion: 0.5 }
  weak:     { computational_power: 0.4, network_speed: 0.5, proportion: 0.2 }

# Client dynamism
client_dynamism:
  fast:     { participation_rate: 0.9, proportion: 0.3 }
  normal:   { participation_rate: 0.7, proportion: 0.5 }
  slow:     { participation_rate: 0.5, proportion: 0.2 }
```

---

## Evaluation Metrics

| Metric | Description |
|--------|-------------|
| Accuracy | Overall classification accuracy |
| Precision | Macro-averaged precision |
| Recall | Macro-averaged recall |
| F1-Score | Macro-averaged F1 |
| AUC-ROC | Area under the ROC curve (per-class and macro) |
| Confusion Matrix | Full NxN classification matrix |
| Training Time | Per-client and per-round timing |

---

## Tech Stack

**Backend:** Python 3.10 | Flask | TensorFlow/Keras | scikit-learn | NumPy | Matplotlib | Plotly

**Frontend:** React 18 | Material-UI | Chart.js | Recharts | globe.gl | Axios

---

## Roadmap

- [ ] Differential privacy mechanisms
- [ ] Docker containerization
- [ ] Distributed training across physical nodes
- [ ] Database persistence for experiment results
- [ ] OpenAPI/Swagger documentation

---

## Authors

**Fabio Liberti** - Universita Mercatorum / OPBG

---

## License

This project is developed for academic research purposes.
